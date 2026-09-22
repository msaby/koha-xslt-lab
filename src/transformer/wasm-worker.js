import createXSLTTransformModule from './vendor/koha-xslt-wasm.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function guardUrl(input, root) {
  if (typeof input === 'string' || input instanceof URL) return new URL(input, root);
  if (input && typeof input.url === 'string') return new URL(input.url, root);
  throw new Error('URL de ressource invalide.');
}

function buildFetchGuard(policy, root) {
  const originalFetch = self.fetch.bind(self);
  const allowed = new Set(policy.allowedUrls || []);
  const rootUrl = new URL(root);
  return async (input, options = {}) => {
    const method = (options.method || (input && input.method) || 'GET').toUpperCase();
    const signal = options.signal || (input && input.signal);
    if (method !== 'GET') throw new Error('Méthode de chargement non autorisée.');
    const url = guardUrl(input, rootUrl);
    if (!/^https?:$/.test(url.protocol)) throw new Error('Schéma d’URL non autorisé.');
    if (policy.type === 'exact') {
      if (!allowed.has(url.href)) throw new Error(`Ressource non autorisée : ${url.href}`);
    } else if (policy.type === 'same-origin-stylesheet') {
      if (url.origin !== rootUrl.origin) throw new Error(`Origine non autorisée : ${url.origin}`);
      if (url.search || url.hash) throw new Error('Paramètres d’URL non autorisés.');
      if (!/\.(xsl|xslt)$/i.test(url.pathname)) throw new Error('Seules les dépendances XSLT sont autorisées.');
    } else {
      throw new Error('Politique de chargement inconnue.');
    }
    const response = await originalFetch(url.href, { credentials: 'omit', redirect: 'error', signal });
    if (!response.ok) throw new Error(`Ressource inaccessible : HTTP ${response.status}`);
    return response;
  };
}

self.onmessage = async ({ data }) => {
  const diagnostics = [];
  const {
    xml,
    stylesheet,
    stylesheetUrl,
    params = {},
    policy,
    outputLimitBytes = 10 * 1024 * 1024,
    stylesheetLimitBytes = 2 * 1024 * 1024,
    rejectStylesheetDoctype = true,
    fetchStylesheet = false,
    root = self.location.href
  } = data;
  let engine;
  let output = 0;
  const pointers = [];
  const originalFetch = self.fetch.bind(self);
  self.fetch = buildFetchGuard(policy, root);
  try {
    engine = await createXSLTTransformModule({
      print: message => diagnostics.push(message),
      printErr: message => diagnostics.push(message),
    });
    const heap = () => new Uint8Array((engine.wasmMemory || engine.HEAPU8).buffer);
    function bytes(text) {
      const encoded = textEncoder.encode(text);
      const pointer = engine._malloc(encoded.length + 1);
      if (!pointer) throw new Error('Mémoire WebAssembly insuffisante.');
      pointers.push(pointer);
      heap().set(encoded, pointer);
      heap()[pointer + encoded.length] = 0;
      return [pointer, encoded.length];
    }
    const paramEntries = Object.entries(params || {});
    const paramPointers = [];
    const paramArrayPointer = paramEntries.length ? engine._malloc((paramEntries.length * 2 + 1) * 4) : 0;
    if (paramArrayPointer) pointers.push(paramArrayPointer);
    for (const [name, value] of paramEntries) {
      const [namePointer] = bytes(String(name));
      const [valuePointer] = bytes(String(value));
      paramPointers.push(namePointer, valuePointer);
    }
    if (paramArrayPointer) {
      const heap32 = engine.HEAP32 || new Int32Array((engine.wasmMemory || engine.HEAPU8).buffer);
      const base = paramArrayPointer / 4;
      for (const [index, pointer] of paramPointers.entries()) heap32[base + index] = pointer;
      heap32[base + paramPointers.length] = 0;
    }
    const stylesheetContent = fetchStylesheet
      ? await (await fetch(stylesheetUrl)).text()
      : stylesheet;
    const stylesheetSize = textEncoder.encode(stylesheetContent).length;
    if (stylesheetSize > stylesheetLimitBytes) throw new Error('La feuille XSLT dépasse la limite autorisée.');
    if (rejectStylesheetDoctype && /<!DOCTYPE/i.test(stylesheetContent)) throw new Error('Les déclarations DOCTYPE ne sont pas acceptées pour la feuille XSLT.');
    const [xmlPointer, xmlLength] = bytes(xml);
    const [xslPointer, xslLength] = bytes(stylesheetContent);
    const [urlPointer] = bytes(stylesheetUrl);
    const mimeBuffer = engine._malloc(128);
    if (!mimeBuffer) throw new Error('Mémoire WebAssembly insuffisante.');
    pointers.push(mimeBuffer);
    heap().fill(32, mimeBuffer, mimeBuffer + 127);
    heap()[mimeBuffer + 127] = 0;
    const apply = engine.cwrap('transform', 'number', Array(7).fill('number'), { async: true });
    output = await apply(xmlPointer, xmlLength, xslPointer, xslLength, paramArrayPointer || 0, urlPointer, mimeBuffer);
    if (!output) throw new Error(diagnostics.join('\n') || 'Échec de la transformation WebAssembly.');
    const bytesView = heap();
    let end = output;
    while (bytesView[end] !== 0) {
      end += 1;
      if (end - output > outputLimitBytes) throw new Error('Le résultat dépasse la limite autorisée.');
    }
    const content = textDecoder.decode(bytesView.subarray(output, end));
    self.postMessage({ content, mimeType: engine.UTF8ToString(mimeBuffer) });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    self.fetch = originalFetch;
    if (engine) {
      if (output) engine._free(output);
      for (const pointer of pointers) engine._free(pointer);
    }
  }
};

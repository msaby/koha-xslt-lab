import { kohaStyles } from './koha-styles.js';
import createXSLTTransformModule from './vendor/koha-xslt-wasm.js';

const root = new URL('../../', import.meta.url);
const allowed = new Set(kohaStyles.flatMap(style => {
  const url = new URL(style.path, root);
  return [url.href, new URL('UNIMARCslimUtils.xsl', url).href];
}));
const originalFetch = self.fetch.bind(self);
// Includes/imports and document() may fetch only these six immutable stylesheets.
self.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, root);
  if (!allowed.has(url.href) || (options.method && options.method !== 'GET')) throw new Error('Ressource Koha non autorisée.');
  const response = await originalFetch(url.href, { credentials: 'omit', redirect: 'error' });
  if (!response.ok) throw new Error(`Feuille Koha inaccessible : HTTP ${response.status}`);
  return response;
};

self.onmessage = async ({ data: { xml, styleId } }) => {
  const diagnostics = [];
  let engine, output;
  const pointers = [];
  try {
    const style = kohaStyles.find(style => style.id === styleId);
    if (!style) throw new Error('Transformation Koha inconnue.');
    const url = new URL(style.path, root).href;
    const stylesheet = await (await fetch(url)).text();
    engine = await createXSLTTransformModule({ print: message => diagnostics.push(message), printErr: message => diagnostics.push(message) });
    function bytes(text) {
      const data = new TextEncoder().encode(text);
      const pointer = engine._malloc(data.length + 1);
      if (!pointer) throw new Error('Mémoire insuffisante.');
      pointers.push(pointer);
      engine.HEAPU8.set(data, pointer);
      engine.HEAPU8[pointer + data.length] = 0;
      return [pointer, data.length];
    }
    const [xmlPointer, xmlLength] = bytes(xml);
    const [xslPointer, xslLength] = bytes(stylesheet);
    const [urlPointer] = bytes(url);
    const [mimePointer] = bytes(' '.repeat(127));
    output = await engine.cwrap('transform', 'number', Array(7).fill('number'), { async: true })(xmlPointer, xmlLength, xslPointer, xslLength, 0, urlPointer, mimePointer);
    if (!output) throw new Error(diagnostics.join('\n') || 'Échec de la transformation Koha.');
    const content = engine.UTF8ToString(output);
    if (new TextEncoder().encode(content).length > 10 * 1024 * 1024) throw new Error('Le résultat dépasse la limite de 10 Mio.');
    self.postMessage({ content });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    if (engine) {
      if (output) engine._free(output);
      for (const pointer of pointers) engine._free(pointer);
    }
  }
};

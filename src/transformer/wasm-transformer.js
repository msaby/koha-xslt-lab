const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_XML_LIMIT = 2 * 1024 * 1024;
const DEFAULT_XSLT_LIMIT = 2 * 1024 * 1024;
const DEFAULT_OUTPUT_LIMIT = 10 * 1024 * 1024;

let activeFinish = null;

function parseXml(text, label) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) throw new Error(`XML invalide (${label}): ${parserError.textContent}`);
}

function rejectIfOversized(text, label, maxBytes) {
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new Error(`${label} dépasse la limite de ${Math.round(maxBytes / 1024 / 1024)} Mio.`);
  }
}

function rejectDoctype(text, label) {
  if (/<!DOCTYPE/i.test(text)) throw new Error(`Les déclarations DOCTYPE ne sont pas acceptées pour ${label}.`);
}

export function cancelWasmTransformation(message = 'Transformation annulée.') {
  if (activeFinish) activeFinish(new Error(message));
}

export function transformWithWasm({
  xml,
  stylesheet,
  stylesheetUrl,
  params = {},
  policy,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  xmlLimitBytes = DEFAULT_XML_LIMIT,
  stylesheetLimitBytes = DEFAULT_XSLT_LIMIT,
  outputLimitBytes = DEFAULT_OUTPUT_LIMIT,
  xmlLabel = 'la notice XML',
  stylesheetLabel = 'la feuille XSLT',
  rejectStylesheetDoctype = true
}) {
  cancelWasmTransformation();
  rejectIfOversized(xml, xmlLabel, xmlLimitBytes);
  rejectIfOversized(stylesheet, stylesheetLabel, stylesheetLimitBytes);
  rejectDoctype(xml, xmlLabel);
  if (rejectStylesheetDoctype) rejectDoctype(stylesheet, stylesheetLabel);
  parseXml(xml, xmlLabel);
  parseXml(stylesheet, stylesheetLabel);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./wasm-worker.js', import.meta.url), { type: 'module' });
    const finish = (error, content, mimeType) => {
      clearTimeout(timeout);
      worker.terminate();
      if (activeFinish === finish) activeFinish = null;
      if (error) reject(error);
      else resolve({ content, mimeType });
    };
    const timeout = setTimeout(() => finish(new Error(`La transformation a dépassé ${Math.round(timeoutMs / 1000)} secondes.`)), timeoutMs);
    activeFinish = finish;
    worker.onmessage = ({ data }) => finish(data.error ? new Error(data.error) : null, data.content, data.mimeType);
    worker.onerror = () => finish(new Error('Impossible de démarrer le moteur WebAssembly.'));
    worker.postMessage({
      xml,
      stylesheet,
      stylesheetUrl,
      params,
      policy,
      outputLimitBytes,
      root: document.baseURI
    });
  });
}

export const wasmLimits = {
  timeoutMs: DEFAULT_TIMEOUT_MS,
  xmlLimitBytes: DEFAULT_XML_LIMIT,
  stylesheetLimitBytes: DEFAULT_XSLT_LIMIT,
  outputLimitBytes: DEFAULT_OUTPUT_LIMIT
};

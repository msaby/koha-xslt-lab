// Experimental asynchronous adapter for the unmodified, pinned Wasm C entrypoint.
// It preserves includes/imports and their base URI; it does not flatten stylesheets.
const encoder = new TextEncoder();
let modulePromise;
let pending = Promise.resolve();
const diagnostics = [];

export async function ready() {
  modulePromise ||= window.createXSLTTransformModule({
    print: (message) => diagnostics.push(message),
    printErr: (message) => diagnostics.push(message),
  });
  return modulePromise;
}

export function parseXml(text, label) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error(`XML invalide (${label})`);
  return doc;
}

export function transform(xml, stylesheet, stylesheetUrl) {
  // Asyncify can suspend one transformation at a time in a given module.
  const job = pending.then(async () => {
    parseXml(xml, "notice");
    parseXml(stylesheet, "feuille XSLT");
    const module = await ready();
    diagnostics.length = 0;
    const pointers = [];
    let output = 0;
    function bytes(text) {
      const data = encoder.encode(text);
      const pointer = module._malloc(data.length + 1);
      if (!pointer) throw new Error("Mémoire WebAssembly insuffisante");
      pointers.push(pointer);
      const memory = new Uint8Array((module.wasmMemory || module.HEAPU8).buffer);
      memory.set(data, pointer);
      memory[pointer + data.length] = 0;
      return [pointer, data.length];
    }
    try {
      const [xmlPointer, xmlLength] = bytes(xml);
      const [xslPointer, xslLength] = bytes(stylesheet);
      const [urlPointer] = bytes(stylesheetUrl);
      const [mimePointer] = bytes(" ".repeat(127));
      const apply = module.cwrap("transform", "number", ["number", "number", "number", "number", "number", "number", "number"], { async: true });
      output = await apply(xmlPointer, xmlLength, xslPointer, xslLength, 0, urlPointer, mimePointer);
      if (!output) throw new Error(diagnostics.join("\n") || "Échec de la transformation WebAssembly");
      return { content: module.UTF8ToString(output), mimeType: module.UTF8ToString(mimePointer) };
    } finally {
      if (output) module._free(output);
      for (const pointer of pointers) module._free(pointer);
    }
  });
  pending = job.catch(() => {});
  return job;
}

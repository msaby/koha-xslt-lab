// Record the browser's real support before the polyfill replaces the API.
window.wasmProbe = { nativeAvailable: false, nativeError: null, blockedRequests: [], wasmCompilations: 0 };
try {
  if (typeof window.XSLTProcessor === "function") {
    new window.XSLTProcessor();
    window.wasmProbe.nativeAvailable = true;
  }
} catch (error) {
  window.wasmProbe.nativeError = error.message;
}
window.XSLTProcessor = undefined;
// Use only the bundled Wasm factory; do not install the synchronous DOM polyfill.
window.xsltPolyfillInstalled = true;
window.xsltUsePolyfillAlways = true;
window.xsltDontAutoloadXmlDocs = true;
window.xsltPolyfillQuiet = true;

// Restrict this experimental engine's fetches to static assets in this checkout.
const repositoryRoot = new URL("../../", window.location.href);
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, window.location.href);
  if (url.origin !== repositoryRoot.origin || !url.pathname.startsWith(repositoryRoot.pathname) || url.search || url.hash || (init.method && init.method !== "GET")) {
    window.wasmProbe.blockedRequests.push(url.href);
    return Promise.reject(new Error("Ressource hors du périmètre de l’essai"));
  }
  return originalFetch(url.href, { ...init, credentials: "omit", redirect: "error" });
};

// Count actual Wasm compilation, independently of the native XSLT API.
const OriginalModule = WebAssembly.Module;
WebAssembly.Module = new Proxy(OriginalModule, {
  construct(target, args) {
    window.wasmProbe.wasmCompilations += 1;
    return Reflect.construct(target, args);
  },
});

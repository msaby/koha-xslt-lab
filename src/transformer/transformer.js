import { cancelWasmTransformation, transformWithWasm } from './wasm-transformer.js';

async function loadText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url.pathname}`);
  }
  return response.text();
}

export function cancelTransformation() {
  cancelWasmTransformation('Transformation annulée.');
}

export async function transformSources(
  xmlText,
  stylesheetText,
  {
    stylesheetUrl = document.baseURI,
    ownerDocument = document,
    params = {}
  } = {}
) {
  const baseUrl = new URL(stylesheetUrl, ownerDocument.baseURI).href;
  const { content } = await transformWithWasm({
    xml: xmlText,
    stylesheet: stylesheetText,
    stylesheetUrl: baseUrl,
    params,
    policy: { type: 'same-origin-stylesheet' },
    xmlLabel: 'la notice MARCXML',
    stylesheetLabel: 'la feuille XSLT'
  });
  return content;
}

export async function transform(stylesheetPath, { xmlPath = "fixtures/record.xml", ownerDocument = document } = {}) {
  const xmlUrl = new URL(xmlPath, ownerDocument.baseURI);
  const stylesheetUrl = new URL(stylesheetPath, ownerDocument.baseURI);
  const [xmlText, stylesheetText] = await Promise.all([
    loadText(xmlUrl),
    loadText(stylesheetUrl)
  ]);
  return transformSources(xmlText, stylesheetText, { stylesheetUrl, ownerDocument });
}
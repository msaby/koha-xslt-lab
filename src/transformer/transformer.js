const stylesheetNamespace = "http://www.w3.org/1999/XSL/Transform";

async function loadText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url.pathname}`);
  }
  return response.text();
}

function parseXml(text, label) {
  const document = new DOMParser().parseFromString(text, "application/xml");
  const parserError = document.querySelector("parsererror");
  if (parserError) {
    throw new Error(`XML invalide (${label}): ${parserError.textContent}`);
  }
  return document;
}

function resolveDependencies(document, url) {
  const dependencies = [
    ...document.getElementsByTagNameNS(stylesheetNamespace, "include"),
    ...document.getElementsByTagNameNS(stylesheetNamespace, "import")
  ];
  for (const dependency of dependencies) {
    dependency.setAttribute("href", new URL(dependency.getAttribute("href"), url).href);
  }
  return document;
}

export function transformSources(xmlText, stylesheetText, stylesheetUrl = document.baseURI, ownerDocument = document) {
  const xmlDocument = parseXml(xmlText, "MARCXML");
  const stylesheetDocument = resolveDependencies(
    parseXml(stylesheetText, "XSLT"),
    new URL(stylesheetUrl, ownerDocument.baseURI)
  );
  const processor = new XSLTProcessor();
  processor.importStylesheet(stylesheetDocument);
  const fragment = processor.transformToFragment(xmlDocument, ownerDocument);
  return new XMLSerializer().serializeToString(fragment);
}

export async function transform(stylesheetPath, { xmlPath = "fixtures/record.xml", ownerDocument = document } = {}) {
  const xmlUrl = new URL(xmlPath, ownerDocument.baseURI);
  const stylesheetUrl = new URL(stylesheetPath, ownerDocument.baseURI);
  const [xmlText, stylesheetText] = await Promise.all([
    loadText(xmlUrl),
    loadText(stylesheetUrl)
  ]);
  return transformSources(xmlText, stylesheetText, stylesheetUrl, ownerDocument);
}
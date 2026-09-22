import { kohaStyles } from './koha-styles.js';
import { cancelWasmTransformation, transformWithWasm } from './wasm-transformer.js';

export function cancelKohaTransformation() {
  cancelWasmTransformation('Transformation annulée.');
}

export function transformKoha(xml, styleId) {
  cancelKohaTransformation();
  if (!kohaStyles.some(style => style.id === styleId)) return Promise.reject(new Error('Transformation Koha inconnue.'));
  const style = kohaStyles.find(candidate => candidate.id === styleId);
  const root = new URL('../../', import.meta.url);
  const stylesheetUrl = new URL(style.path, root);
  const allowedUrls = [stylesheetUrl.href, new URL('UNIMARCslimUtils.xsl', stylesheetUrl).href];
  return fetch(stylesheetUrl.href, { credentials: 'omit', redirect: 'error' })
    .then(response => {
      if (!response.ok) throw new Error(`Feuille Koha inaccessible : HTTP ${response.status}`);
      return response.text();
    })
    .then(stylesheet => transformWithWasm({
      xml,
      stylesheet,
      stylesheetUrl: stylesheetUrl.href,
      policy: { type: 'exact', allowedUrls },
      xmlLabel: 'les notices Koha',
      stylesheetLabel: 'les feuilles Koha',
      rejectStylesheetDoctype: false
    }))
    .then(result => result.content)
    .catch(error => Promise.reject(error instanceof Error ? error : new Error(String(error))));
}

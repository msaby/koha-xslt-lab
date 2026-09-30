import { kohaStyles } from './koha-styles.js';
import { cancelWasmTransformation, transformWithWasm } from './wasm-transformer.js';

export function cancelKohaTransformation() {
  cancelWasmTransformation('Transformation annulée.', 'koha');
}

export function transformKoha(xml, styleId) {
  cancelKohaTransformation();
  if (!kohaStyles.some(style => style.id === styleId)) return Promise.reject(new Error('Transformation Koha inconnue.'));
  const style = kohaStyles.find(candidate => candidate.id === styleId);
  const root = new URL('../../', import.meta.url);
  const stylesheetUrl = new URL(style.path, root);
  const allowedUrls = kohaStyles.flatMap(candidate => {
    const url = new URL(candidate.path, root);
    return [url.href, new URL('UNIMARCslimUtils.xsl', url).href];
  });
  return transformWithWasm({
    xml,
    stylesheetUrl: stylesheetUrl.href,
    fetchStylesheet: true,
    policy: { type: 'exact', allowedUrls },
    xmlLabel: 'les notices Koha',
    stylesheetLabel: 'les feuilles Koha',
    rejectStylesheetDoctype: false,
    cancelKey: 'koha'
  })
    .then(result => result.content)
    .catch(error => Promise.reject(error instanceof Error ? error : new Error(String(error))));
}

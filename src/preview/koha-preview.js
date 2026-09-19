const styles = new Map();

export async function createKohaPreview(html, style) {
  if (!['opac-detail', 'opac-list', 'staff-detail', 'staff-list'].includes(style)) {
    throw new Error('Style Koha inconnu.');
  }
  const context = style.startsWith('opac-') ? 'opac' : 'staff';
  if (!styles.has(context)) {
    const url = new URL(`../../content/koha/26.05.03/preview/${context}.css`, import.meta.url);
    styles.set(context, fetch(url).then(response => {
      if (!response.ok) throw new Error('Impossible de charger les styles Koha.');
      return response.text();
    }).catch(error => { styles.delete(context); throw error; }));
  }
  const css = (await styles.get(context)).replace(/<\/style/gi, '<\\/style');
  const content = style.endsWith('-list')
    ? `<div id="${context === 'opac' ? 'userresults' : 'results'}"><table id="searchresults" class="table"><tbody><tr><td>${html}</td></tr></tbody></table></div>`
    : `<div id="catalogue_detail_biblio" class="bibliodetails">${html}</div>`;
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; form-action 'none'; base-uri 'none'">
<style id="koha-standard-styles" data-context="${context}">${css}</style>
<style>body{padding:1rem;margin:0;min-width:0;background:white}#searchresults{width:100%}</style>
</head><body id="${style}" class="${context}">${content}</body></html>`;
}

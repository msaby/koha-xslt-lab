const root = 'content/koha/26.05.03/koha-tmpl/';
export const kohaStyles = [
  { id: 'opac-detail', label: 'Détail OPAC', path: `${root}opac-tmpl/bootstrap/en/xslt/UNIMARCslim2OPACDetail.xsl` },
  { id: 'opac-list', label: 'Liste OPAC', path: `${root}opac-tmpl/bootstrap/en/xslt/UNIMARCslim2OPACResults.xsl` },
  { id: 'staff-detail', label: 'Détail interface pro', path: `${root}intranet-tmpl/prog/en/xslt/UNIMARCslim2intranetDetail.xsl` },
  { id: 'staff-list', label: 'Liste interface pro', path: `${root}intranet-tmpl/prog/en/xslt/UNIMARCslim2intranetResults.xsl` },
];

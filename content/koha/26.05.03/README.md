# Référence XSLT Koha 26.05.03 — UNIMARC

Copie des sources officielles récupérée le 17 septembre 2026. Koha 26.05.03 était la dernière version stable proposée sur le site de téléchargement à cette date.

- Archive : https://download.koha-community.org/koha-26.05.03.tar.gz
- Publication : https://koha-community.org/koha-26-05-03-released/
- Provenance, SHA-256 de l’archive et des fichiers, points d’entrée et dépendances : [manifest.json](manifest.json).
- Texte de licence fourni dans l’archive : [LICENSE](LICENSE).

Les fichiers `.xsl` et `LICENSE` sont copiés à l’identique, sans modification des chemins, des commentaires ou des fins de ligne. L’arborescence originale est conservée. Les feuilles proviennent des répertoires `en` de la distribution ; ce ne sont pas des versions traduites en français.

## Les quatre affichages

| Contexte | Fichier principal | Dépendance directe |
| --- | --- | --- |
| OPAC, notice détaillée | `koha-tmpl/opac-tmpl/bootstrap/en/xslt/UNIMARCslim2OPACDetail.xsl` | `UNIMARCslimUtils.xsl` du même dossier |
| OPAC, notice brève / résultats | `koha-tmpl/opac-tmpl/bootstrap/en/xslt/UNIMARCslim2OPACResults.xsl` | `UNIMARCslimUtils.xsl` du même dossier |
| Intranet, notice détaillée | `koha-tmpl/intranet-tmpl/prog/en/xslt/UNIMARCslim2intranetDetail.xsl` | `UNIMARCslimUtils.xsl` du même dossier |
| Intranet, notice brève / résultats | `koha-tmpl/intranet-tmpl/prog/en/xslt/UNIMARCslim2intranetResults.xsl` | `UNIMARCslimUtils.xsl` du même dossier |

Les deux fichiers utilitaires sont conservés séparément, même s’ils portent le même nom. L’analyse récursive des `xsl:include` et `xsl:import` donne six feuilles au total ; les utilitaires n’importent aucune autre feuille.

## Vérifications réalisées

- Analyse XML et compilation des quatre points d’entrée avec leurs dépendances locales par `lxml` / libxslt.
- Empreintes SHA-256 enregistrées pour contrôler les copies.

La compilation ne valide pas encore l’exécution dans `XSLTProcessor`, le rendu dans le laboratoire ou la fidélité à une installation Koha. Ces références ne sont pas branchées à l’interface actuelle.

La préparation du futur mode et les questions d’ergonomie sont décrites dans [XSLT_KOHA.md](../../../docs/XSLT_KOHA.md).

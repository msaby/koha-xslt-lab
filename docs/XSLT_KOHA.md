# Préparation du mode « XSLT Koha »

## État

Le troisième mode est en préparation ; son interface et son moteur ne sont pas implémentés. La première étape, la collecte des références officielles UNIMARC, est réalisée dans [content/koha/26.05.03](../content/koha/26.05.03/README.md).

Version choisie : dernière stable officielle au moment de la collecte, **26.05.03**, le 17 septembre 2026. Source : [archive officielle](https://download.koha-community.org/koha-26.05.03.tar.gz), identifiée par version et empreinte dans le manifeste local. Ne pas remplacer silencieusement cette référence lors d’une future mise à jour.

## Périmètre du jeu de référence

Quatre points d’entrée couvrent OPAC / intranet et notice détaillée / résultats de recherche (notice brève). Chaque feuille inclut `UNIMARCslimUtils.xsl` dans son propre répertoire. Les deux utilitaires, distincts par leur chemin, sont copiés avec les quatre feuilles principales. Les imports relatifs et les contenus sont préservés, ainsi que le fichier `LICENSE` original.

Les feuilles sont issues des répertoires `en` de l’archive : décider ultérieurement si une référence traduite est nécessaire. Les feuilles MARC21, d’autorités et d’export ne font pas partie de cette collecte.

## Constats techniques avant conception

1. Les quatre feuilles compilent avec leurs dépendances sous `lxml` / libxslt. L’exécution dans les navigateurs reste à vérifier, notamment pour les fonctions EXSLT du namespace `http://exslt.org/strings` utilisées dans les sources.
2. Les XPath des feuilles lisent notamment `marc:sysprefs`, `marc:variables` et, pour les exemplaires, le namespace `http://www.koha-community.org/items`. Une notice MARCXML simple ne fournit pas tout ce contexte.
3. L’inspection de `C4/XSLT.pm` dans l’archive montre une préparation de la notice avec `ExpandCodedFields`, puis l’ajout de préférences, variables et, selon le contexte, données d’exemplaires avant transformation. Ce fichier Perl a été consulté ; il n’est pas copié ni exécuté dans le laboratoire.
4. Les feuilles produisent des fragments HTML destinés à Koha. Le rendu complet dépend aussi de l’habillage de l’application, de ses liens et ressources. L’aperçu du laboratoire ne doit pas être présenté comme une reproduction complète de Koha.
5. Le moteur actuel sait résoudre les références des feuilles chargées par URL, mais l’éditeur travaille sur des chaînes de texte. Modifier plusieurs feuilles dépendantes exigera une stratégie dédiée qui préserve les URI de base et la sémantique des imports. Ne pas fusionner naïvement les fichiers.

## Proposition pour notre prochaine discussion

- Deux choix de contexte : **OPAC / Intranet**, puis **Notice détaillée / Notice brève**. La feuille principale correspondante est sélectionnée automatiquement.
- Une liste de fichiers indiquant la feuille principale et ses dépendances, avec leurs noms réels. Choisir un fichier affiche son contenu dans l’éditeur.
- Une référence officielle conservée intacte ; les modifications portent sur une copie de travail. Prévoir une action explicite pour rétablir la référence.
- Une notice d’essai et, si nécessaire, un panneau distinct pour le contexte Koha : préférences, variables et exemplaires. Définir ensemble le niveau de détail utile à un débutant.
- Un aperçu et le code généré pour le contexte choisi. Décider si la comparaison avant/après et entre les quatre affichages est utile dès la première version.

Ces points sont des pistes de conception, pas des décisions d’interface déjà mises en œuvre.

## Prochaines décisions

Définir d’abord ce que l’usager doit pouvoir modifier : uniquement la feuille principale, ou également les utilitaires. Choisir ensuite comment fournir le contexte Koha et quel degré de fidélité visuelle attendre de l’aperçu. Un essai navigateur avec ces références et un MARCXML représentatif devra précéder l’implémentation du mode.

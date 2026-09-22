# Mode « XSLT Koha »

## État

Le troisième mode est disponible depuis l'accueil et la barre des modes. Il
utilise les références officielles UNIMARC de [content/koha/26.05.03](../content/koha/26.05.03/README.md)
avec le moteur WebAssembly corrigé. Les trois modes partagent désormais le même
adaptateur Worker + Wasm ; le mode Koha garde son périmètre de ressources figées.

## Utilisation

Choisir une notice dans le même catalogue d'exemples que le mode libre, puis un
type de transformation : **Détail OPAC**, **Liste OPAC**, **Détail interface pro**
ou **Liste interface pro**. Le XML reste éditable et accepte le copier-coller.
La XSLT n'est ni affichée ni modifiable dans ce mode.

Au premier accès, la première notice et Détail OPAC sont transformés. Changer
le type relance la transformation. Charger une autre notice laisse le résultat
en attente du bouton Transformer (ou Ctrl+Entrée), comme dans le mode libre.
Les choix restent sélectionnés. Le mode Koha conserve son XML séparément des
modes libre/guidé et ne remplace pas leur XSLT. Les retours rétablissent les sources.

Les onglets existants Aperçu, XML ou HTML généré (coloré) et Erreurs sont partagés.
Une erreur active l'onglet Erreurs et lui donne le focus. Les feuilles de référence
restent intactes. Les résultats de liste représentent la notice fournie dans le
contexte d'une liste ; le laboratoire n'exécute pas de recherche Koha.

## Exécution et limites

L’aperçu applique automatiquement les styles standard OPAC ou professionnels
de Koha 26.05.03, compilés depuis l’archive officielle et stockés dans le dépôt.
Les styles et leurs ressources sont intégrés uniquement dans l’iframe ; le HTML
de l’onglet de code est indenté pour la lecture, sans ajout des CSS. Les fichiers Poppins manquent dans l’archive,
donc l’interface professionnelle utilise sa police de secours. Ce rendu ne
reconstitue pas une page Koha complète ni ses fonctions interactives.
Voir [la provenance et la compilation des CSS](../content/koha/26.05.03/preview/README.md).

`src/transformer/koha-styles.js` associe les quatre choix aux fichiers officiels.
`src/transformer/wasm-transformer.js` centralise l’orchestration (Worker par
transformation, annulation, timeout, limites), et `src/transformer/wasm-worker.js`
exécute libxslt/libxml2. Le Worker est terminé après réponse, erreur, annulation,
changement de mode ou nouvelle transformation. Délai maximal : 15 secondes ;
entrée XML : 2 Mio ; sortie : 10 Mio. Ces limites ne sont pas un plafond de
mémoire interne : la sortie est vérifiée après sa production.

Le Worker ne charge que les quatre feuilles et leurs deux utilitaires, via une
liste d'URL exactes sans redirection ni identifiants de connexion. Les DOCTYPE
des notices sont refusés. L'aperçu est sandboxé sans scripts ; une CSP interdit
les ressources externes et les formulaires. Les liens Koha ne reproduisent pas
un site Koha opérationnel. Ce périmètre limité ne valide pas l'exécution future
de feuilles XSLT arbitraires éditées par l'utilisateur.

Pour les modes libre/guidé, le même Worker Wasm est utilisé avec une politique
explicite : dépendances XSLT uniquement (`.xsl`/`.xslt`), même origine, sans
query/hash, sans redirection, sans credentials. Les DOCTYPE sont refusés pour
XML et XSLT ; limites explicites : 2 Mio XML, 2 Mio XSLT, 10 Mio sortie, 15 s.

`tests/koha.browser.cjs` teste les douze couples notice/transformation, la sortie
colorée, la récupération après XML invalide et dépendance absente, le refus des
DOCTYPE et l'affichage mobile, à la racine et sous un sous-chemin local. Chromium
est lancé avec XSLT natif désactivé. Les autres navigateurs restent à vérifier.

Version choisie : dernière stable officielle au moment de la collecte, **26.05.03**, le 17 septembre 2026. Source : [archive officielle](https://download.koha-community.org/koha-26.05.03.tar.gz), identifiée par version et empreinte dans le manifeste local. Ne pas remplacer silencieusement cette référence lors d’une future mise à jour.

## Périmètre du jeu de référence

Quatre points d’entrée couvrent OPAC / intranet et notice détaillée / résultats de recherche (notice brève). Chaque feuille importe `UNIMARCslimUtils.xsl` dans son propre répertoire. Les deux utilitaires, distincts par leur chemin, sont copiés avec les quatre feuilles principales. Les imports relatifs et les contenus sont préservés, ainsi que le fichier `LICENSE` original.

Les feuilles sont issues des répertoires `en` de l’archive : décider ultérieurement si une référence traduite est nécessaire. Les feuilles MARC21, d’autorités et d’export ne font pas partie de cette collecte.

## Constats techniques avant conception

1. Les quatre feuilles compilent avec leurs dépendances sous `lxml` / libxslt et
   fonctionnent dans Chromium avec la copie Wasm corrigée, y compris les fonctions
   EXSLT utilisées sur le corpus testé. La matrice des autres navigateurs reste à compléter.
2. Les XPath des feuilles lisent notamment `marc:sysprefs`, `marc:variables` et, pour les exemplaires, le namespace `http://www.koha-community.org/items`. Une notice MARCXML simple ne fournit pas tout ce contexte.
3. L’inspection de `C4/XSLT.pm` dans l’archive montre une préparation de la notice avec `ExpandCodedFields`, puis l’ajout de préférences, variables et, selon le contexte, données d’exemplaires avant transformation. Ce fichier Perl a été consulté ; il n’est pas copié ni exécuté dans le laboratoire.
4. Les feuilles produisent des fragments HTML destinés à Koha. Le rendu complet dépend aussi de l’habillage de l’application, de ses liens et ressources. L’aperçu du laboratoire ne doit pas être présenté comme une reproduction complète de Koha.
5. Le moteur actuel sait résoudre les références des feuilles chargées par URL, mais l’éditeur travaille sur des chaînes de texte. Modifier plusieurs feuilles dépendantes exigera une stratégie dédiée qui préserve les URI de base et la sémantique des imports. Ne pas fusionner naïvement les fichiers.

## Pistes ultérieures, hors de l'interface actuelle

- Le menu actuel regroupe les quatre contextes dans un seul choix.
- Une liste de fichiers indiquant la feuille principale et ses dépendances, avec leurs noms réels. Choisir un fichier affiche son contenu dans l’éditeur.
- Une référence officielle conservée intacte ; les modifications portent sur une copie de travail. Prévoir une action explicite pour rétablir la référence.
- Une notice d’essai et, si nécessaire, un panneau distinct pour le contexte Koha : préférences, variables et exemplaires. Définir ensemble le niveau de détail utile à un débutant.
- Un aperçu et le code généré pour le contexte choisi. Décider si la comparaison avant/après et entre les quatre affichages est utile dès la première version.

Ces points sont des pistes de conception, pas des décisions d’interface déjà mises en œuvre.

## Prochaines décisions

Définir ultérieurement ce que l’usager pourra modifier : uniquement la feuille
principale ou également les utilitaires. Choisir comment fournir le contexte
Koha et quel degré de fidélité visuelle attendre de l’aperçu. Le mode actuel
ne propose aucune édition de XSLT et n'émule pas les traitements Perl de Koha.

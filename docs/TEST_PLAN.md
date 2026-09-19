# Plan de tests

## 1. Spike navigateur

Matrice cible Chrome/Firefox/Edge/Safari : parsing MARCXML namespace ; XSLT simple ; templates ; `include` ; `import` ; chemins relatifs ; GitHub Pages. Le spike natif historique est décrit dans ADR-001 ; la migration Wasm et ses limites sont décrites dans [ADR-002](ADR-002-xslt-wasm.md).

### Banc WebAssembly existant

`tests/wasm.browser.cjs` démarre son propre serveur HTTP et teste la racine puis
`/koha-xslt-lab/`. Définir `BROWSER_EXECUTABLE` vers Chromium et `WASM_VARIANT` :

- `patched` : exige 42/42 contrôles réussis avec la copie corrigée ;
- `original` : exige la reproduction des sept écarts par chemin dans le témoin reconstruit ;
- variable absente : teste le bundle amont, dont les sept écarts font échouer le runner.

Le runner désactive XSLT natif, vérifie son absence, une compilation Wasm réelle,
l'absence d'erreurs JavaScript de page et de requêtes externes. Les rapports
mesurés sont conservés dans `spike/wasm/results/`, les nouvelles exécutions dans
`test-results/`. Références libxslt/lxml générées par `spike/wasm/generate-reference.py`.
Ce banc est actuellement un runner Chromium ; les autres navigateurs nécessitent
encore des scénarios et lanceurs adaptés, avec preuve d'usage exclusif de Wasm.

La comparaison normalise les espaces HTML et l'ordre des attributs. Le test de
JavaScript inerte conserve le HTML comme texte : il ne teste pas la sécurité
d'un aperçu iframe. Les notices Koha n'incluent pas tout le contexte enrichi.

### Conditions d'acceptation de la migration en production

- Réussite du corpus corrigé et des parcours libre/guidé sur les navigateurs retenus,
  sans recours au moteur natif ; même vérification sur le déploiement GitHub Pages réel.
- Cas de dépendance absente, cycle, redirection, URI interdite et `document()` ;
  vérifier aussi qu'aucune donnée saisie ne peut être transmise par une URI construite.
- Transformation trop longue, récursion, gros XML et sortie excessive : interruption
  effective, interface utilisable et reprise correcte. Déterminer les limites puis
  vérifier leur application, sans les considérer comme déjà implémentées.
- Revue du parsing, des entités, de `XML_PARSE_HUGE` et des consommations mémoire
  lors de transformations répétées ; essais sur appareils aux ressources limitées.
- Aperçu réel : scripts, événements, navigation, formulaires et ressources externes
  confinés selon la politique définie. Un résultat HTML ne doit pas accéder au DOM hôte.
- Relecture du correctif, traçabilité des artefacts et procédure de mise à jour
  documentées. Rejouer les régressions après toute mise à jour du moteur.

Ces conditions sont à vérifier ; les 42 succès actuels ne les valident pas toutes.

## 2. Tests unitaires

### Tests disponibles pour les notices et feuilles XSLT d’exemple

Depuis la racine du dépôt : `node tests/sample-loading.test.cjs`.

Les dix-neuf tests de `tests/sample-loading.test.cjs` couvrent les noms affichés sans extension, le chargement des notices et des feuilles sans modification de l’autre éditeur, l’annulation après modification, une erreur HTTP, la visibilité des menus selon le mode, les chargements tardifs après changement de mode et la saisie pendant le chargement. Ils vérifient aussi que le fichier chargé reste sélectionné, que la sélection précédente est rétablie après annulation ou erreur, que les descriptions XSLT sont visibles avant et après le choix et qu’Échap ferme la liste en restituant le focus.

Ils utilisent un DOM simulé et ne vérifient ni le rendu visuel ni le moteur XSLT du navigateur.

Les tests unitaires du catalogue vérifient aussi le tri par `order` indépendamment
de l'ordre de la liste, les titres JSON et la numérotation continue avec des ordres
espacés, le premier exercice chargé, le rejet d'un ordre non numérique, le
départage des égalités et la reprise après erreur HTTP sans perte des sources.

### Tests navigateur des éditeurs

Vérifier également les couleurs du code généré, la copie exacte du texte depuis
l'onglet de sortie et le rendu inerte des balises et attributs HTML potentiellement
exécutables. Ces contrôles complètent les tests de l'aperçu iframe, sans les remplacer.

`npm run test:browser` exécute `tests/editors.browser.cjs` avec Playwright Core. Démarrer le serveur HTTP local au préalable. Définir `BROWSER_EXECUTABLE` si le Chromium installé n’est pas celui attendu par Playwright, et éventuellement `LAB_URL` pour tester une autre adresse.

Le scénario vérifie les couleurs distinctes et numéros de ligne des deux entrées, un véritable collage via le presse-papiers, l’annulation, Ctrl+Entrée, les erreurs de transformation, le chargement et la validation d’un exercice, Tab entre éditeurs et l’absence de débordement à 390 pixels. Il vérifie également l’absence d’erreurs JavaScript et de requêtes externes. Une capture mobile est déposée dans `test-results/`, exclu de Git.

Vérifié sur le Chromium local le 18 septembre 2026. Les autres navigateurs et technologies d’assistance restent à vérifier.

### Couverture complémentaire prévue

- parsing XML valide/invalide ;
- parsing XSLT valide/invalide ;
- normalisation de chemins virtuels ;
- validateurs d'exercices ;
- sérialisation/restauration locale ;
- génération de prompt LLM.

## 3. Tests de transformation

### Mode XSLT Koha

`node tests/koha.browser.cjs` (avec `BROWSER_EXECUTABLE`) teste le nouveau mode
à la racine et sous `/koha-xslt-lab/`, avec XSLT natif désactivé. Il vérifie les
quatre choix sur les trois notices (dont les auteurs), la XSLT masquée, les
sélections persistantes, la coloration du résultat, les erreurs XML et de
dépendance, leur récupération, le refus des DOCTYPE, le mobile et l'absence de
requêtes externes. `tests/editors.browser.cjs` vérifie aussi les transitions
avec les modes libre/guidé et la restauration des sources.

L'exercice de comptage figure en deuxième position. Vérifier que sa notice dédiée
contient trois `datafield`, que la solution retourne `3` puis `2` après retrait
d'une zone, et que le validateur refuse `13`. Ces cas sont couverts par les tests
Python et navigateur. Les 42 contrôles du spike Wasm documentés dans ADR-002
constituent le corpus historique de la décision ; il précède cet exercice.

Pour chaque exercice : XML + XSLT solution -> résultat attendu. Ajouter des cas : zone absente, répétée, caractères accentués, apostrophes, espaces, namespace manquant.

Les trois tests de `tests/test_example_xslt.py` s’exécutent avec `python -m unittest discover -s tests -v` et nécessitent `lxml`. Ils vérifient les trois présentations HTML sur chaque notice, ainsi que la transformation identité sur les notices et sur un XML contenant champs répétés, ordre inhabituel, attributs, commentaires, espaces et instruction de traitement. Les comparaisons de l’identité utilisent une sérialisation XML canonique. Ces tests avec libxslt complètent les vérifications de `XSLTProcessor` dans les navigateurs.

## 4. Sécurité

Tester une transformation produisant `<script>`, événements `onclick`, liens/navigation et HTML malveillant. Vérifier qu'aucun script ne s'exécute dans l'application hôte et que l'iframe n'obtient pas de privilèges inutiles.

## 5. E2E

Depuis l'écran initial, choisir l'utilisation libre et vérifier que les exercices sont masqués. Passer au parcours guidé avec le bouton de l’en-tête et vérifier que l'exercice 1 est chargé par défaut. Modifier la XSLT de l'exercice 1, transformer, valider, consulter un indice, passer à l'exercice 2, puis revenir à l'utilisation libre et vérifier que les sources éditées sont conservées. Ajouter ensuite un scénario multifichier.

- En mode libre, charger chacune des trois notices : vérifier le nom sans extension dans le menu, le remplacement du XML, la conservation de la XSLT et l’absence de transformation automatique. Cliquer sur « Transformer » et contrôler le titre et l’auteur affichés avec la XSLT initiale.
- Modifier ou coller du XML, sélectionner une notice puis annuler : vérifier la conservation de la saisie. Recommencer et confirmer le remplacement.
- Simuler un fichier inaccessible : vérifier le message près du menu, la conservation du XML et la possibilité de sélectionner à nouveau une notice.
- Vérifier que le menu est masqué dans le parcours guidé.
- Répéter les scénarios de chargement, confirmation, annulation et erreur avec le menu XSLT ; vérifier que le XML reste inchangé et que ce menu est également masqué en mode guidé.
- Charger `identite`, transformer et consulter « XML ou HTML généré » : vérifier la conservation des champs, sous-zones, valeurs, attributs et de leur ordre dans le XML. Vérifier les trois autres feuilles dans l’aperçu, notamment les notices sans sous-titre et avec plusieurs sous-titres.
- Dans chaque exercice, vérifier la consigne unique, le bouton de validation en dessous à gauche, puis l’ouverture et la fermeture des indices et de la solution.
- Depuis la solution ouverte, copier dans l’éditeur XSLT : vérifier la correction
  de l’exercice courant, le XML inchangé, le focus dans l’éditeur et l’obligation
  de transformer à nouveau avant validation. Garder la solution ouverte en mobile
  pour vérifier l’absence de débordement horizontal.
- Provoquer une erreur XML ou XSLT et lancer la transformation : vérifier la sélection de l’onglet « Erreurs », le focus sur son bouton et l’affichage du message.

## 6. Accessibilité

Pour le sélecteur XSLT, vérifier les descriptions sur écran étroit et au clavier : ouverture avec Entrée/Espace, parcours par Tab/Maj+Tab, activation d’un choix, fermeture par Échap avec retour au bouton. Vérifier aussi la fermeture au clic extérieur et lorsque le focus quitte le menu. Les descriptions doivent rester visibles sans survol, y compris sur mobile.

Navigation clavier, focus, noms accessibles, ordre de tabulation, messages d'erreur annoncés, zoom 200 %, contraste. Ajouter un audit automatisé mais conserver une vérification manuelle.

## 7. GitHub Pages

Tester le build sous un chemin `/koha-xslt-lab/`, liens relatifs, rechargement, assets, import de contenu et absence d'appels réseau inattendus.

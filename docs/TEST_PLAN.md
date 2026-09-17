# Plan de tests

## 1. Spike navigateur

Matrice Chrome/Firefox/Edge : parsing MARCXML namespace ; XSLT simple ; templates ; `include` ; `import` ; chemins relatifs ; GitHub Pages. Capturer résultats et versions dans ADR-001.

## 2. Tests unitaires

### Tests disponibles pour les notices et feuilles XSLT d’exemple

Depuis la racine du dépôt : `node tests/sample-loading.test.cjs`.

Les douze tests de `tests/sample-loading.test.cjs` couvrent les noms affichés sans extension, le chargement des notices et des feuilles sans modification de l’autre éditeur, l’annulation après modification, une erreur HTTP, la visibilité des menus selon le mode, les chargements tardifs après changement de mode et la saisie pendant le chargement.

Ils utilisent un DOM simulé et ne vérifient ni le rendu visuel ni le moteur XSLT du navigateur.

### Couverture complémentaire prévue

- parsing XML valide/invalide ;
- parsing XSLT valide/invalide ;
- normalisation de chemins virtuels ;
- validateurs d'exercices ;
- sérialisation/restauration locale ;
- génération de prompt LLM.

## 3. Tests de transformation

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
- Charger `identite`, transformer et consulter « HTML généré » : vérifier la conservation des champs, sous-zones, valeurs, attributs et de leur ordre dans le XML. Vérifier les trois autres feuilles dans l’aperçu, notamment les notices sans sous-titre et avec plusieurs sous-titres.
- Dans chaque exercice, vérifier la consigne unique, le bouton de validation en dessous à gauche, puis l’ouverture et la fermeture des indices et de la solution.
- Provoquer une erreur XML ou XSLT et lancer la transformation : vérifier la sélection de l’onglet « Erreurs », le focus sur son bouton et l’affichage du message.

## 6. Accessibilité

Navigation clavier, focus, noms accessibles, ordre de tabulation, messages d'erreur annoncés, zoom 200 %, contraste. Ajouter un audit automatisé mais conserver une vérification manuelle.

## 7. GitHub Pages

Tester le build sous un chemin `/koha-xslt-lab/`, liens relatifs, rechargement, assets, import de contenu et absence d'appels réseau inattendus.

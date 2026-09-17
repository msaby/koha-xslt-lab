# Plan de tests

## 1. Spike navigateur

Matrice Chrome/Firefox/Edge : parsing MARCXML namespace ; XSLT simple ; templates ; `include` ; `import` ; chemins relatifs ; GitHub Pages. Capturer résultats et versions dans ADR-001.

## 2. Tests unitaires

- parsing XML valide/invalide ;
- parsing XSLT valide/invalide ;
- normalisation de chemins virtuels ;
- validateurs d'exercices ;
- sérialisation/restauration locale ;
- génération de prompt LLM.

## 3. Tests de transformation

Pour chaque exercice : XML + XSLT solution -> résultat attendu. Ajouter des cas : zone absente, répétée, caractères accentués, apostrophes, espaces, namespace manquant.

## 4. Sécurité

Tester une transformation produisant `<script>`, événements `onclick`, liens/navigation et HTML malveillant. Vérifier qu'aucun script ne s'exécute dans l'application hôte et que l'iframe n'obtient pas de privilèges inutiles.

## 5. E2E

Depuis l'écran initial, choisir l'utilisation libre et vérifier que les exercices sont masqués. Revenir au choix, sélectionner le parcours guidé et vérifier que l'exercice 1 est chargé par défaut. Modifier la XSLT de l'exercice 1, transformer, valider, consulter un indice, passer à l'exercice 2, puis revenir à l'utilisation libre et vérifier que les sources éditées sont conservées. Ajouter ensuite un scénario multifichier.

## 6. Accessibilité

Navigation clavier, focus, noms accessibles, ordre de tabulation, messages d'erreur annoncés, zoom 200 %, contraste. Ajouter un audit automatisé mais conserver une vérification manuelle.

## 7. GitHub Pages

Tester le build sous un chemin `/koha-xslt-lab/`, liens relatifs, rechargement, assets, import de contenu et absence d'appels réseau inattendus.

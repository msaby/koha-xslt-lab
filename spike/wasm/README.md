# Essai limité XSLT WebAssembly

## Validation de la version amont 1.0.30, 30 septembre 2026

Le bundle officiel au commit `9ee67e848ef8ce2ad3b0bac4814b5a87db38a939`
réussit **42/42 contrôles** à la racine et sous `/koha-xslt-lab/` dans Chromium,
avec XSLT natif désactivé. Le mode Koha réussit ses 12 transformations sur
chacun des deux chemins, y compris les auteurs des vues détaillées. Le moteur
du projet est désormais extrait de ce bundle sans patch local. Le cas minimal
des paramètres importés reste dans le banc de régression.

Les résultats ci-dessous décrivent l'expérience historique du 18 septembre
sur la version 1.0.28 ; ils ne décrivent plus le moteur embarqué actuel.

## Conclusion après correction du 18 septembre 2026

**42/42 contrôles réussis avec la copie corrigée**, XSLT natif désactivé,
dans Chromium 153.0.8010.12, à la racine et sous `/koha-xslt-lab/`.
La copie témoin reconstruite avec les mêmes outils reproduit les sept échecs
(35/42). Le changement testé rétablit le dictionnaire partagé de libxml2 dans
le chargeur de dépendances. Les paramètres importés et les vues Koha passent
désormais les comparaisons, sans modifier les feuilles officielles.

Les rapports de cette comparaison historique sont conservés dans `results/`.
Cette réussite ne remplace pas la validation des autres navigateurs et des
ressources utilisateur arbitraires.

## Résultats initiaux, avant correction

**Faisabilité démontrée, candidat non validé pour une intégration générale.**
Dans Chromium 153.0.8010.12, avec `--disable-blink-features=XSLT`, le banc obtient
**35 réussites sur 41 contrôles**, à la racine comme sous `/koha-xslt-lab/`.
Une compilation WebAssembly est observée, l'API XSLT native est absente,
aucune requête externe et aucune erreur JavaScript de page ne sont observées.
Les rapports conservés sont dans `results/`.

Ajout d'un [cas minimal de paramètres importés](fixtures/author-parameter/README.md) :
le bilan avant correction est **35/42**, le nouveau contrôle reproduisant le défaut.
Les paramètres restent corrects dans un template local, mais arrivent vides
dans le template importé, quelle que soit leur forme (fragment, chaîne, nombre).
Les rapports `results/` incluent désormais ce diagnostic et ses sorties complètes.

Les quatre solutions d'exercices, les douze couples notice/feuille d'exemple,
l'identité (ordre, espaces internes, commentaires, instruction de traitement),
les includes/imports, la précédence d'import avec `apply-imports`, les dépendances
imbriquées, les fonctions EXSLT testées et la sortie texte passent.
Les trois erreurs attendues, la reprise et la sérialisation des appels simultanés passent aussi.
Le résultat HTML reste du texte : son JavaScript n'est jamais injecté dans la page.

Les six écarts sont les vues **OPAC détail et interface professionnelle détail**,
sur chacune des trois notices. Le bloc `results_summary author main_author`
présent dans la référence libxslt manque dans le résultat Wasm. Les six vues
brèves passent la comparaison. À ce stade, la cause précise restait à isoler ;
ni les feuilles officielles ni les résultats attendus n'ont été modifiés pour la masquer.
Le bundle amont 1.0.28 échouait ; la version 1.0.30 corrige ces écarts.

## Exécuter

Servir la racine du dépôt avec `python -m http.server 8000 --bind 127.0.0.1`, puis
ouvrir <http://127.0.0.1:8000/spike/wasm/>. La page lance le banc automatiquement.
Elle utilise exclusivement Wasm, même si le navigateur possède encore XSLT natif.

Pour tester avec l'API native réellement désactivée :

```powershell
$env:BROWSER_EXECUTABLE = "$env:LOCALAPPDATA/ms-playwright/chromium-1243/chrome-win64/chrome.exe"
node tests/wasm.browser.cjs
```

Le runner démarre son propre serveur statique temporaire, teste les deux chemins
et écrit les rapports dans `test-results/wasm*.json`.
Adapter `BROWSER_EXECUTABLE` à l'installation Chromium locale.
Pour régénérer les références, utiliser Python avec lxml :
`python spike/wasm/generate-reference.py`. Python n'intervient pas dans les
transformations navigateur : les résultats de référence sont des fichiers statiques.

## Moteur et provenance

Le bundle officiel de [xslt_polyfill](https://github.com/mfreed7/xslt_polyfill),
version 1.0.30, est figé au commit `9ee67e848ef8ce2ad3b0bac4814b5a87db38a939`.
Il contient libxml2/libxslt compilés en Wasm avec Asyncify. Les fichiers amont
sont conservés sans modification dans `vendor/`, avec sources d'enveloppe,
licences et empreintes dans `vendor/manifest.json`.
Le fichier chargé pèse 1 456 506 octets avant compression HTTP.

L'essai utilise la fabrique Wasm et un petit adaptateur **asynchrone** (`engine.js`).
Il n'installe pas le remplacement synchrone de `XSLTProcessor` ni la transformation
automatique de documents du polyfill. Les imports sont résolus par libxslt avec
l'URL réelle de la feuille ; aucune concaténation de feuilles n'est utilisée.
Les transformations sont mises en file, car Asyncify suspend un seul appel à la fois.

## Portée et limites

- Comparaison à libxslt via lxml, versions consignées dans `reference.json`.
- XML : comparaison de structure, valeurs, espaces internes et ordre ; déclaration
  XML et espaces hors élément racine exclus. Le moteur force l'omission de la déclaration XML.
- HTML : comparaison DOM avec espaces normalisés et attributs triés ; ce n'est
  ni une comparaison octet par octet ni une validation visuelle de tous les espacements.
- Les notices ne contiennent pas tout le contexte enrichi de Koha (préférences,
  exemplaires, variables). Ces tests ne certifient pas une émulation complète.
- Chromium uniquement testé ; Firefox, Safari, Edge et les versions de 2027
  restent à vérifier. L'essai démontre l'indépendance vis-à-vis de XSLT natif.
- CSP sans `unsafe-eval` JavaScript, fetch limité aux ressources du même dépôt,
  pas d'envoi de notice, pas de résultat HTML exécuté. Ce périmètre expérimental
  ne remplace pas un audit du moteur pour des sources arbitraires.
- Avant intégration : tester les dépendances
  absentes et documents externes, prévoir un Worker interruptible et des limites
  de ressources, puis vérifier les navigateurs cibles et la maintenance du moteur.

Le mode Koha de l'application utilise le moteur Wasm amont. Les modes libre et
guidé utilisent encore XSLT natif.

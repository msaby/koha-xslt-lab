# Expérience contrôlée : dictionnaire partagé

Le 18 septembre 2026, Chromium 153.0.8010.12, API native désactivée :

| Variante | Racine | Sous-chemin |
| --- | --- | --- |
| Bundle amont | 35/42 | 35/42 |
| `original.js`, témoin reconstruit | 35/42 | 35/42 |
| `patched.js`, chargeur corrigé | 42/42 | 42/42 |

Aucune erreur JavaScript de page ni requête externe observée dans les deux
reconstructions. Les rapports complets sont dans `../results/wasm-original*.json`
et `../results/wasm-patched*.json`. Le résultat corrigé retrouve les paramètres
et les auteurs Koha, et passe la comparaison DOM complète des cas du banc.

## Changement unique entre les deux variantes

`../patch-loader.py` remplace l'appel `xmlReadMemory` du chargeur par un contexte
de parsing utilisant le dictionnaire fourni par libxslt. La référence au dictionnaire
est incrémentée, et le contexte est libéré après parsing. Les options de parsing
restent identiques. Le chargeur standard de libxslt partage déjà ce dictionnaire.

Les noms de paramètres des feuilles principale et importée doivent être reconnus
ensemble. Dans cette configuration, ignorer ce partage provoquait leur perte.
La comparaison témoin/correction confirme le rôle de cette omission pour les
cas reproduits ; elle ne prétend pas certifier tous les usages XSLT possibles.

## Reproduire

Dans Linux, avec Emscripten 3.1.5, build-essential, autoconf, automake, libtool,
pkg-config, Python 3, curl et les certificats TLS :

```sh
bash spike/wasm/build-experiment.sh
```

Les sources GNOME sont téléchargées aux révisions du manifeste amont. La compilation
utilise un dossier persistant `~/koha-wasm-dictionary-build` (ou le premier argument).
Pour une reconstruction complète, fournir un nouveau dossier vide.
Le script reconstruit deux copies de `vendor/transform.c`, sans modifier l'original.
Les deux compilations utilisent les mêmes bibliothèques et réglages. L'en-tête
`stdlib.h` et l'inclusion explicite de `stringToNewUTF8` sont nécessaires avec
ce compilateur et sont identiques des deux côtés. `compiler.txt` précise sa version.
Les scripts JS générés embarquent chacun le binaire Wasm. Licences : voir
`../vendor/LICENSE`, `LICENSE-libxml2` et `LICENSE-libxslt` ; les fichiers amont
et les sources du correctif restent disponibles dans le dépôt.

Tester depuis PowerShell avec Chromium configuré via `BROWSER_EXECUTABLE` :

```powershell
$env:WASM_VARIANT = 'original'
node tests/wasm.browser.cjs
$env:WASM_VARIANT = 'patched'
node tests/wasm.browser.cjs
```

Le mode `original` vérifie la reproduction attendue des sept écarts par chemin ;
le mode `patched` exige zéro échec. Sans variable, le runner teste le bundle amont
et signale ses écarts. Le banc corrigé visible manuellement est `../patched.html`.
Les empreintes des deux artefacts sont consignées dans `manifest.json`.

Cette correction est expérimentale et locale : elle n'a pas été publiée en amont
et le moteur principal du laboratoire n'a pas encore été migré.

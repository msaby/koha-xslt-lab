# Koha XSLT Lab

Application pédagogique statique pour apprendre XSLT 1.0 dans le contexte **Koha + UNIMARC/MARCXML**. L'application doit être publiable sur GitHub Pages et fonctionner sans backend : édition MARCXML/XSLT, transformation locale, aperçu HTML, exercices progressifs, aide UNIMARC/XSLT et préparation de prompts pour un LLM.

## Objectif

Réduire la distance entre « je ne connais pas XSLT » et « je peux comprendre et modifier prudemment une feuille XSLT d'affichage de Koha ».

## Contraintes structurantes

- GitHub Pages, application 100 % statique.
- XSLT 1.0 en priorité.
- UNIMARC uniquement en V1.
- Transformation dans le navigateur ; aucune notice envoyée à un serveur.
- Support de Chrome, Firefox et Edge récents.
- Gestion pédagogique de plusieurs fichiers XSLT (`xsl:include` / `xsl:import`).
- Le site n'émule pas Koha intégralement.
- L'aperçu HTML doit être isolé (`iframe sandbox`).

## Notices d’exemple

Lors de la première entrée en mode libre, la première notice de `content/samples/index.json` (actuellement `jardin-des-nuages.xml`) et la feuille `identite.xsl` sont chargées et sélectionnées automatiquement, puis transformées. Les retours suivants au mode libre conservent les sources en cours.

En mode « Utilisation libre », le menu « Charger une notice d’exemple » remplace le XML de l’éditeur sans modifier la XSLT. Le copier-coller reste possible. Si le XML a été modifié, une confirmation précède son remplacement. Cliquez ensuite sur « Transformer ».

Les trois notices fictives sont stockées dans `content/samples/` et répertoriées dans `content/samples/index.json`. Pour ajouter une notice, placez son fichier XML dans ce dossier et ajoutez son nom au tableau JSON. Le menu affiche automatiquement le nom du fichier sans l’extension `.xml`.

Les fichiers proposés sont `jardin-des-nuages.xml`, `atlas-des-iles-imaginaires.xml` et `cuisine-des-etoiles.xml`. Le menu est réservé au mode libre ; les exercices chargent leur propre notice. En cas d’annulation ou d’échec du chargement, le XML actuel est conservé.

Dans les menus de notices et de feuilles XSLT, le fichier chargé reste sélectionné. Une annulation ou une erreur rétablit la sélection précédente. Le chargement d’un exercice réinitialise les deux menus, puisque les sources sont remplacées par celles de l’exercice.

## Feuilles XSLT d’exemple

En mode libre, le menu « Charger une feuille XSLT d’exemple » fonctionne comme celui des notices : noms de fichiers sans extension, remplacement de la XSLT uniquement, confirmation si elle a été modifiée, conservation des sources en cas d’annulation ou d’erreur. Le copier-coller reste possible et la transformation est déclenchée avec « Transformer ».

- `identite` : recopie le XML, ses éléments, attributs, textes, commentaires et instructions de traitement, en conservant l’ordre des nœuds et les champs répétés.
- `titre-auteur` : affiche le titre et la mention de responsabilité en HTML.
- `titre-sous-titres` : affiche le titre et tous les sous-titres séparés par « : ».
- `tous-les-champs` : présente les zones, indicateurs et sous-zones en HTML, dans l’ordre de la notice.

La transformation identité produit du XML, consultable dans l’onglet actuellement nommé « XML ou HTML généré ». Elle conserve la structure et les données, mais ne garantit pas un fichier identique octet par octet : la sérialisation peut changer les préfixes de namespace, les guillemets ou la forme des balises vides.

Les fichiers sont dans `content/xslt/samples/`. Pour ajouter une feuille XSLT 1.0 autonome, y déposer le fichier `.xsl` puis ajouter son nom au tableau `content/xslt/samples/index.json`.

La liste XSLT affiche le nom et une courte description de chaque feuille avant le choix. Après chargement, le nom reste sélectionné et sa description reste visible sous le bouton. Les descriptions de l’interface sont stockées dans `content/xslt/samples/descriptions.json`, avec le nom complet du fichier comme clé ; les commentaires explicatifs restent dans les feuilles. Mettre les deux à jour lors de l’ajout ou de la modification d’un exemple.

Au clavier, ouvrir avec Entrée ou Espace, parcourir les choix avec Tab et Maj+Tab, puis activer un choix avec Entrée ou Espace. Échap ferme la liste et ramène le focus au bouton ; quitter le menu au clavier ou cliquer ailleurs le ferme également.

## Lancement local et tests

Les éditeurs MARCXML et XSLT des modes libre et guidé utilisent CodeMirror 6 : coloration des balises, attributs, valeurs et commentaires, numéros de ligne, indentation automatique et annulation/rétablissement. Le copier-coller et Ctrl+Entrée (Cmd+Entrée sur macOS) restent disponibles. Tab passe au champ suivant.

Depuis la racine du dépôt, avec Python installé :

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Ouvrir <http://127.0.0.1:8000/>. Aucun build ni installation de dépendances n’est nécessaire : Python sert les fichiers et le navigateur exécute le JavaScript et les transformations XSLT.

CodeMirror est fourni dans `src/editor/xml-editor.bundle.js`, avec ses licences dans `src/editor/LICENSES.txt` ; aucun CDN n’est utilisé. Pour modifier la configuration de l’éditeur, éditer `src/editor/xml-editor.js`, puis régénérer le fichier intégré avec Node.js et npm :

```sh
npm ci
npm run build:editor
```

Les versions des outils et bibliothèques sont fixées dans `package-lock.json`. Le fichier généré et les licences doivent être conservés dans le dépôt pour permettre le lancement statique direct.

Avec Node.js installé, exécuter les tests du chargement des notices et des feuilles XSLT :

```sh
node tests/sample-loading.test.cjs
```

Ces tests utilisent un DOM simulé ; les vérifications dans un navigateur sont décrites dans le [plan de tests](docs/TEST_PLAN.md).

Le test des éditeurs dans Chromium se lance avec `npm run test:browser`, serveur local démarré et dépendances npm installées. Il nécessite un navigateur Chromium Playwright installé, ou la variable `BROWSER_EXECUTABLE` indiquant le chemin d’un exécutable Chromium. `LAB_URL` permet de changer l’URL locale testée (par défaut `http://127.0.0.1:8000/`).

Les transformations des exemples peuvent être vérifiées avec Python et `lxml` installé dans l’environnement de test :

```sh
python -m unittest discover -s tests -v
```

`lxml` n’est pas requis pour faire fonctionner le site.

## Parcours guidé

Chaque exercice affiche une consigne unique, puis le bouton « Valider le résultat », aligné à gauche. « Afficher les indices » et « Afficher la solution » sont deux blocs dépliables, utilisables également au clavier. En cas d’erreur de transformation, l’onglet « Erreurs » est sélectionné, reçoit le focus et affiche le message.

## Documents du projet

- [Préparation du mode XSLT Koha](docs/XSLT_KOHA.md) — références officielles UNIMARC 26.05.03 et questions de conception du futur troisième mode.

- [PRD](docs/PRD.md) — exigences produit et critères d'acceptation.
- [Architecture](docs/ARCHITECTURE.md) — architecture technique et décisions.
- [Pédagogie](docs/PEDAGOGY.md) — progression pédagogique et exercices.
- [Formats de contenu](docs/DATA_FORMATS.md) — formats JSON/XML/XSLT du contenu pédagogique.
- [Plan de tests](docs/TEST_PLAN.md) — stratégie de tests.
- [Roadmap](docs/ROADMAP.md) — phases et backlog initial.
- [Guide Codex](docs/CODEX_GUIDE.md) — méthode de travail recommandée avec Codex.
- [Instructions Codex](docs/AGENTS.md) — instructions pour la documentation du projet.

## Démarrage du développement

Le spike initial est conservé dans `spike/` et accessible à <http://127.0.0.1:8000/spike/> lorsque le serveur local tourne. Il vérifie le namespace MARCXML, `xsl:include` et `xsl:import` avec le moteur partagé. La décision provisoire et les vérifications navigateur et GitHub Pages restant à effectuer sont décrites dans [ADR-001](docs/ADR-001-xslt-engine.md).

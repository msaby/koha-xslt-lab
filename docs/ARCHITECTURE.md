# Architecture technique

## 1. Principe

Application statique : HTML/CSS/JavaScript + ressources JSON/XML/XSL. Un outil de build est autorisé au développement, mais la sortie GitHub Pages ne doit nécessiter aucun serveur applicatif.

## 2. Risque n°1 : moteur XSLT multifichier

Avant toute UI complète, réaliser un **spike**. Tester sur Chrome, Firefox et Edge : MARCXML avec namespace `http://www.loc.gov/MARC21/slim`, `value-of`, templates, `apply-templates`, template nommé, `xsl:include`, `xsl:import`, chemins relatifs et ressources servies par un serveur HTTP local puis GitHub Pages.

### Décision A — natif
Si `XSLTProcessor` résout les dépendances de façon fiable dans les navigateurs cibles, l'utiliser directement.

### Décision B — résolution applicative
Si ce n'est pas fiable, conserver une représentation de projet multifichier et résoudre les `include/import` dans l'application avant compilation/transformation. Respecter les différences sémantiques entre include et import ; ne pas faire un simple copier-coller naïf si cela change la précédence d'import.

### Décision C — moteur embarqué
Seulement si A/B sont insuffisantes, évaluer un moteur JS/WASM compatible avec les contraintes statiques. Documenter poids, licence, compatibilité XSLT 1.0 et comportement par rapport à libxslt/Koha.

Le résultat du spike doit être écrit dans `docs/ADR-001-xslt-engine.md`.

## 3. Modules proposés

```text
src/
  app/
  editor/
  transformer/
  preview/
  exercises/
  validation/
  storage/
  help/
  llm-helper/
content/
  exercises/
  samples/
  xslt/
  unimarc/
tests/
```

Responsabilités : `transformer` parse/compile/exécute ; `preview` isole le HTML ; `exercises` charge le contenu ; `validation` évalue le résultat ; `storage` persiste localement ; `llm-helper` fabrique uniquement du texte copiable.

## 4. Éditeur

Les deux entrées XML/XSLT utilisent CodeMirror 6 et son [support XML](https://github.com/codemirror/lang-xml), en mode libre et guidé. La configuration `src/editor/xml-editor.js` fournit coloration syntaxique, numéros de ligne, indentation et historique. Son interface `value` permet au chargeur d’exemples et aux exercices de lire et remplacer les sources. Le chargement d’un fichier réinitialise l’historique de cet éditeur ; les saisies et collages restent annulables.

`npm run build:editor` produit le module autonome `src/editor/xml-editor.bundle.js` avec esbuild et rassemble les licences des dépendances dans `src/editor/LICENSES.txt`. Ces fichiers sont versionnés : aucun build n’est nécessaire pour servir le dépôt, et aucune dépendance n’est téléchargée à l’exécution. Les versions sont verrouillées dans `package-lock.json`.

Tab conserve son rôle de navigation entre champs. Ctrl+Entrée/Cmd+Entrée lance la transformation depuis l’éditeur. Les erreurs de parsing restent affichées dans les messages accessibles de l’application. La recherche intégrée et le soulignement des erreurs ne sont pas encore implémentés.

## 5. Parsing

Utiliser `DOMParser` pour XML/XSLT lorsque pertinent. Vérifier explicitement les `parsererror`. Ne jamais injecter directement le résultat XSLT dans le DOM principal.

## 6. Aperçu sécurisé

Utiliser un `iframe sandbox`. Construire un document HTML complet via `srcdoc` ou Blob URL selon les tests de compatibilité. Ne pas activer `allow-scripts` sauf nécessité démontrée — a priori aucune pour le MVP.

## 7. Stockage

`localStorage` suffit pour préférences/progression légère. IndexedDB est préférable si le projet multifichier sauvegardé devient volumineux. Versionner le schéma de stockage afin de permettre les migrations.

## 8. Déploiement

GitHub Pages via GitHub Actions si build. Tester les chemins avec un `base` correspondant au sous-répertoire du dépôt ; éviter les chemins absolus `/...` qui casseraient sur `owner.github.io/repo/`.

## 9. Dépendances

Minimiser les dépendances. Toute dépendance doit être justifiée, maintenue et compatible avec la licence du projet. Aucun CDN requis en production : préférer bundler les dépendances pour rendre l'outil stable et utilisable sans dépendre d'un tiers au chargement.

## 10. Compatibilité Koha

Ne jamais affirmer que le navigateur reproduit exactement le moteur XSLT de Koha. Les exercices ciblent XSLT 1.0 standard. Prévoir une bannière/documentation indiquant que la validation finale d'une personnalisation doit être faite sur un Koha de test.

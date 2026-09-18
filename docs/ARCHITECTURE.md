# Architecture technique

## 1. Principe

Application statique : HTML/CSS/JavaScript + ressources JSON/XML/XSL. Un outil de build est autorisé au développement, mais la sortie GitHub Pages ne doit nécessiter aucun serveur applicatif.

## 2. Moteur retenu pour 2027 et état de l'intégration

L'[ADR-002 — moteur WebAssembly](ADR-002-xslt-wasm.md) retient **libxslt/libxml2
embarqués dans le navigateur**, avec un correctif local du chargeur de dépendances.
Ce choix permet de conserver XSLT 1.0, les véritables imports Koha et l'hébergement
statique sans transmettre les notices à un serveur. Le retrait annoncé du moteur
natif rend l'ancienne orientation de l'[ADR-001](ADR-001-xslt-engine.md) insuffisante.

**État actuel :** les modes libre et guidé utilisent encore `XSLTProcessor` natif.
Le moteur corrigé est isolé dans `spike/wasm/` ; il n'est pas intégré au produit
et n'est pas encore validé pour la production. Il réussit 42/42 contrôles sur
Chromium avec XSLT natif désactivé, contre 35/42 avant correction.

Le correctif rétablit le dictionnaire partagé entre feuilles, nécessaire aux
paramètres des templates importés dans les cas testés. Les feuilles Koha restent
intactes. L'adaptateur utilise une entrée asynchrone du module Wasm et sérialise
les transformations ; il ne charge pas les fonctions de remplacement automatique
de pages du polyfill. Les imports restent interprétés par libxslt, sans concaténation.

### Limites structurantes

- Les résultats valident un corpus limité dans Chromium, pas tous les navigateurs,
  tous les usages XSLT ou une émulation complète de Koha.
- Le calcul peut bloquer le thread principal : un Worker interruptible et des
  limites de ressources restent à implémenter avant exposition de sources arbitraires.
- Le chargeur définitif doit contrôler les dépendances et `document()` ; le
  filtre réseau expérimental ne constitue pas une garantie de confidentialité générale.
- Le banc conserve le résultat HTML comme texte. La sûreté de l'aperçu réel
  reste à vérifier pendant l'intégration avec l'iframe sandboxé.
- La variante locale impose compilation reproductible, suivi de sécurité et
  tests à chaque mise à jour. Le correctif n'a pas encore été accepté en amont.

Les conditions détaillées de production, le coût du moteur et les raisons du
choix sont consignés dans l'ADR-002. La disponibilité native ne doit pas masquer
un échec du moteur embarqué lors de la validation de la migration.

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

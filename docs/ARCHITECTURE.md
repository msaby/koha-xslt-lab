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
Le troisième mode XSLT Koha utilise la copie corrigée dans un Worker dédié par
transformation. Les autres modes ne sont pas encore migrés. Le spike réussit 42/42 contrôles sur
Chromium avec XSLT natif désactivé, contre 35/42 avant correction.

Le correctif rétablit le dictionnaire partagé entre feuilles, nécessaire aux
paramètres des templates importés dans les cas testés. Les feuilles Koha restent
intactes. L'adaptateur utilise une entrée asynchrone du module Wasm et sérialise
les transformations ; il ne charge pas les fonctions de remplacement automatique
de pages du polyfill. Les imports restent interprétés par libxslt, sans concaténation.

### Limites structurantes

- Les résultats valident un corpus limité dans Chromium, pas tous les navigateurs,
  tous les usages XSLT ou une émulation complète de Koha.
- Le mode Koha dispose d'un Worker interruptible (15 s), d'une limite d'entrée de
  2 Mio et de sortie de 10 Mio. Cette dernière est vérifiée après calcul ; ce
  n'est pas une limite de mémoire totale. Les feuilles sont fixes, non éditables.
- Le chargeur Koha autorise exactement les six URL des feuilles de référence,
  sans redirections ni identifiants de connexion ; les DOCTYPE des notices sont
  refusés. L'extension à des feuilles arbitraires nécessitera une nouvelle revue.
- L'aperçu partagé reste sandboxé sans scripts et impose une CSP interdisant
  les ressources externes et les formulaires. La fidélité visuelle complète de
  Koha et la validation de tous les navigateurs restent hors de la preuve actuelle.
- La variante locale impose compilation reproductible, suivi de sécurité et
  tests à chaque mise à jour. Le correctif n'a pas encore été accepté en amont.

Les conditions détaillées de production, le coût du moteur et les raisons du
choix sont consignés dans l'ADR-002. La disponibilité native ne doit pas masquer
un échec du moteur embarqué lors de la validation de la migration.

## 3. Modules proposés

### Présentation Koha

`src/preview/koha-preview.js` charge et mémorise le CSS OPAC ou professionnel
compilé depuis la même archive Koha 26.05.03 que les XSLT. Il construit uniquement
le document d’aperçu ; le résultat brut de transformation reste intact. Un
chargement de CSS en échec est signalé dans l’onglet d’erreur et peut être retenté.
Les réponses tardives sont ignorées après changement de mode ou de transformation.

Les styles sont confinés à l’iframe sans privilèges. Sa CSP autorise les styles
intégrés et les images/polices `data:`, sans scripts ni ressources distantes.
Les autres modes gardent leur aperçu habituel. Ce rendu reste partiel : les
polices Poppins manquent dans l’archive officielle et utilisent le repli standard ;
les pages, scripts, widgets et préférences Koha ne sont pas reproduits.
La provenance et les étapes de compilation sont décrites dans
[le dossier des styles](../content/koha/26.05.03/preview/README.md).

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

Le catalogue du parcours guidé est chargé à la demande depuis
`content/exercises/index.json`. Les fiches sont chargées en parallèle, vérifiées
sur `id`, `order` et `title`, puis triées par `order` croissant (égalité départagée
par l'ordre du catalogue). Le menu HTML ne contient aucune liste codée en dur.
Les fiches restent en mémoire pour la session ; un échec permet une nouvelle
tentative. Les fichiers XML/XSLT sont chargés à la sélection et les réponses
obsolètes ne remplacent pas les sources d'un exercice plus récent ou du mode libre.

## 4. Éditeur

Les deux entrées XML/XSLT utilisent CodeMirror 6 et son [support XML](https://github.com/codemirror/lang-xml), en mode libre et guidé. La configuration `src/editor/xml-editor.js` fournit coloration syntaxique, numéros de ligne, indentation et historique. Son interface `value` permet au chargeur d’exemples et aux exercices de lire et remplacer les sources. Le chargement d’un fichier réinitialise l’historique de cet éditeur ; les saisies et collages restent annulables.

`npm run build:editor` produit le module autonome `src/editor/xml-editor.bundle.js` avec esbuild et rassemble les licences des dépendances dans `src/editor/LICENSES.txt`. Ces fichiers sont versionnés : aucun build n’est nécessaire pour servir le dépôt, et aucune dépendance n’est téléchargée à l’exécution. Les versions sont verrouillées dans `package-lock.json`.

Tab conserve son rôle de navigation entre champs. Ctrl+Entrée/Cmd+Entrée lance la transformation depuis l’éditeur. Les erreurs de parsing restent affichées dans les messages accessibles de l’application. La recherche intégrée et le soulignement des erreurs ne sont pas encore implémentés.

## 5. Parsing

L'onglet « XML ou HTML généré » utilise le parseur XML Lezer déjà embarqué avec
CodeMirror pour colorer balises, attributs, valeurs et commentaires. Le résultat
reste dans un `pre` en lecture seule ; seuls des nœuds texte et des `span` sont
créés, sans injection de HTML. Dans les trois modes, `src/preview/format-output.js`
indente d’abord le code avec deux espaces. Le texte mixte, CDATA et les éléments
à espaces préservés restent intacts ; une structure non reconnue reste inchangée.
La sélection et la copie reprennent le texte affiché, avec sa mise en forme.
L’aperçu et la validation utilisent toujours la sortie originale du moteur.
La coloration réutilise les couleurs des éditeurs d’entrée.

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

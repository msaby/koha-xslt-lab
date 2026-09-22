# Guide de développement avec Codex

## 1. Préparer le dépôt

Créer un dépôt `koha-xslt-lab`, y placer tous les fichiers Markdown de ce kit à la racine, puis ouvrir le dépôt dans VS Code/Codex. `AGENTS.md` sert d'instructions persistantes au projet.

## 2. Ne pas demander « développe toute l'application »

Procéder par incréments vérifiables. Le premier travail de Codex doit être le **spike moteur**, car le support multifichier est le risque principal.

### Prompt 1 — initialisation

```text
Lis README.md, PRD.md, ARCHITECTURE.md, PEDAGOGY.md, TEST_PLAN.md, ADR-002-xslt-wasm.md et AGENTS.md.
Ne développe pas encore l'application complète.
Propose l'architecture minimale du spike Phase 0 permettant de valider le moteur WebAssembly retenu avec MARCXML UNIMARC, xsl:include et xsl:import, en réutilisant l'adaptateur Worker existant et les contraintes documentées dans ADR-002. Initialise uniquement ce spike et ses tests. Le résultat doit pouvoir être servi par un simple serveur HTTP statique et rester compatible avec le futur déploiement GitHub Pages.
```

### Prompt 2 — exécuter et documenter le spike

```text
Exécute les tests possibles localement. Vérifie séparément transformation simple, namespace MARCXML, template, xsl:include, xsl:import et chemins relatifs avec le moteur WebAssembly et l'adaptateur Worker commun. Documente précisément les résultats observés et les limites restantes dans docs/ADR-002-xslt-wasm.md, sans annoncer de compatibilité non testée.
```

### Prompt 3 — squelette MVP

```text
À partir de ADR-002 et de l'architecture actuelle, implémente le plus petit laboratoire utilisable autour du moteur WebAssembly via l'adaptateur Worker existant : éditeur XML, éditeur XSLT, bouton Transformer, raccourci Ctrl+Entrée, onglet Aperçu sandboxé, onglet HTML et zone d'erreurs. Respecte les contraintes documentées dans ADR-002. N'ajoute pas encore le système d'exercices. Ajoute les tests nécessaires et vérifie le build GitHub Pages.
```

### Prompt 4 — exercices

```text
Implémente le schéma d'exercice décrit dans DATA_FORMATS.md, le chargeur, les trois niveaux d'indices, la solution et une validation fondée sur le résultat. Commence uniquement par les exercices 1 à 3 de PEDAGOGY.md. Ajoute les tests avant d'étendre le corpus.
```

### Prompt 5 — multifichier

```text
Implémente l'exercice de modularisation main.xsl + utils.xsl sur le moteur WebAssembly retenu, en conservant l'adaptateur Worker existant et les contraintes de chargement documentées dans ADR-002. L'utilisateur doit voir et modifier les fichiers séparément. Ajoute un test E2E de cet exercice et documente toute différence avec le comportement de libxslt ou du moteur utilisé dans Koha.
```

### Prompt 6 — couche Koha

```text
Ajoute la section Comprendre Koha et une mini-XSLT pédagogique inspirée de l'architecture Koha. Distingue explicitement notice stockée, traitements Koha/Perl, MARCXML transmis au XSLT et HTML. Ne simule pas ExpandCodedFields dans cette issue. Ajoute un avertissement indiquant que la validation finale doit être faite sur un Koha de test.
```

### Prompt 7 — LLM

```text
Ajoute le générateur de prompt LLM local. Il doit inclure objectif, XML, XSLT et erreur éventuelle, rappeler XSLT 1.0 et UNIMARC/MARCXML, et demander une explication avant une réécriture complète. Aucun appel réseau/API. Ajouter bouton Copier et tests unitaires.
```

## 3. Boucle de travail recommandée

Pour chaque issue : demander à Codex de lire les docs pertinentes ; lui faire inspecter avant de modifier ; limiter l'issue à un résultat testable ; demander tests/build ; examiner `git diff` ; committer seulement après validation manuelle dans le navigateur.

## 4. Questions à poser à Codex lors d'une revue

```text
Relis ce diff comme reviewer. Cherche en priorité : régressions GitHub Pages, failles liées au HTML transformé, appels réseau involontaires, incompatibilités Chrome/Firefox/Edge, usage XSLT > 1.0 dans le contenu pédagogique, validation d'exercice trop dépendante d'une solution particulière et erreurs UNIMARC. Ne modifie rien : donne d'abord tes constats avec fichier et ligne.
```

## 5. Pour corriger un bug

Fournir à Codex : navigateur/version, exercice, XML, XSLT, résultat obtenu, résultat attendu et erreur console. Lui demander d'écrire/reproduire le test avant de corriger lorsque possible.

## 6. Discipline Git

Une branche/issue par fonctionnalité. Commits petits et descriptifs. Ne pas mélanger dépendances, refactoring et fonctionnalité pédagogique. Utiliser `git diff` pour vérifier les modifications de gros fichiers XSLT.

## 7. Déploiement

Quand le MVP fonctionne localement : demander à Codex d'ajouter le workflow GitHub Pages, puis tester l'URL réelle avant de considérer les chemins relatifs/includes comme validés. La réussite en `file://` ou localhost ne suffit pas.

## 8. Definition of Done globale MVP

Tous les critères de `PRD.md` sont satisfaits ; exercice multifichier fonctionnel sur navigateurs cibles ; aucun contenu utilisateur transmis ; aperçu sandboxé ; tests verts ; accessibilité principale vérifiée ; GitHub Pages testé ; documentation à jour.

# Roadmap et backlog initial

## Phase 0 — Spike moteur (bloquant)

- [ ] Créer une page minimale XML/XSLT/résultat.
- [x] Valider le moteur WebAssembly sur Chromium avec XSLT natif désactivé (42/42 contrôles à la racine et sous un sous-chemin local).
- [ ] Étendre la matrice de validation aux navigateurs cibles (Chrome/Edge/Firefox/Safari).
- [x] Vérifier namespace MARCXML, templates et transformations simples dans le banc WebAssembly.
- [x] Vérifier `xsl:include`, `xsl:import` et les chemins relatifs en HTTP local à la racine et sous un sous-chemin.
- [ ] Tester sur GitHub Pages.
- [x] Rédiger ADR-002 et retenir l'architecture WebAssembly.

## Phase 1 — Laboratoire MVP

- [ ] Initialiser projet et CI.
- [x] Intégrer CodeMirror.
- [x] Éditeurs XML/XSLT avec coloration, numéros de ligne et indentation.
- [ ] Transformer + erreurs.
- [ ] Aperçu sandboxé + HTML source.
- [ ] Import/export simple.

## Phase 2 — Exercices

- [ ] Schéma JSON.
- [ ] Chargeur d'exercices.
- [ ] Validateurs.
- [ ] Indices/solutions.
- [ ] Progression locale.
- [ ] 10–12 exercices.

## Phase 3 — Koha

- [ ] Mini-XSLT Koha.
- [ ] Exercice multifichier.
- [ ] Page « Comprendre Koha ».
- [ ] Documentation `ExpandCodedFields` et limites du lab.

## Phase 4 — LLM

- [ ] Générateur de prompt.
- [ ] Copier dans le presse-papiers.
- [ ] Exercices de critique d'une réponse IA.

## Phase 5 — Qualité

- [ ] Tests E2E.
- [ ] Audit accessibilité.
- [ ] Documentation contributeur.
- [ ] Déploiement GitHub Pages stable.

## Definition of Done d'une issue

Code lisible, tests pertinents, aucune régression, documentation mise à jour si comportement visible, pas de dépendance ajoutée sans justification, fonctionnement GitHub Pages vérifié pour les changements de routing/assets.

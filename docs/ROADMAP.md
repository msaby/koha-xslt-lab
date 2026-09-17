# Roadmap et backlog initial

## Phase 0 — Spike moteur (bloquant)

- [ ] Créer une page minimale XML/XSLT/résultat.
- [ ] Tester `XSLTProcessor` sur Chrome/Firefox/Edge.
- [ ] Tester namespace MARCXML.
- [ ] Tester `xsl:include` et `xsl:import` en HTTP local.
- [ ] Tester sur GitHub Pages.
- [ ] Rédiger ADR-001 et choisir l'architecture.

## Phase 1 — Laboratoire MVP

- [ ] Initialiser projet et CI.
- [ ] Intégrer CodeMirror.
- [ ] Éditeurs XML/XSLT.
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

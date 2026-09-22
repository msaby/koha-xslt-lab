# Instructions Codex — Koha XSLT Lab

## Mission
Construire un laboratoire pédagogique statique XSLT 1.0 pour Koha/UNIMARC, déployable sur GitHub Pages.

## Priorités
1. Exactitude technique et pédagogique.
2. Simplicité pour un bibliothécaire débutant.
3. Aucun backend.
4. Sécurité de l'aperçu HTML.
5. Compatibilité GitHub Pages et navigateurs cibles.
6. Dépendances minimales.

## Règles impératives
- Lire `PRD.md`, `ARCHITECTURE.md`, `PEDAGOGY.md`,`DATA_FORMATS.md` et `TEST_PLAN.md` avant une modification substantielle.
- Ne pas commencer l'UI complète avant d'avoir terminé le spike moteur et ADR-001.
- Cibler XSLT 1.0, éviter à tout prix les versons ultérieures
- Utiliser UNIMARC exclusivement ; ne pas introduire MARC21 sans demande explicite.
- Ne jamais prétendre émuler exactement Koha si ce n'est pas le cas.
- Ne jamais envoyer XML/XSLT utilisateur vers un service distant.
- Isoler le HTML transformé dans un iframe sandboxé.
- Ne pas exécuter de JavaScript provenant du résultat XSLT.
- Les exercices doivent valider le résultat et accepter plusieurs solutions.
- Ne pas contourner un problème de `xsl:include/import` par concaténation naïve sans analyser la sémantique XSLT.
- Préférer des chemins relatifs compatibles `owner.github.io/repository/`.
- Ajouter des tests pour toute logique non triviale.

## Méthode
Avant de coder : reformuler brièvement l'objectif de l'issue, inspecter le code existant, identifier les fichiers concernés et annoncer un plan court. Après modification : exécuter tests/lint/build, résumer les changements, signaler les limites et proposer le prochain petit incrément. Éviter les refactorings non demandés.

## Style produit
Interface en français par défaut pour le MVP, vocabulaire accessible, termes techniques expliqués. Ne pas masquer le namespace MARCXML : il fait partie de l'apprentissage.

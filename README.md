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

En mode « Utilisation libre », le menu « Charger une notice d’exemple » remplace le XML de l’éditeur sans modifier la XSLT. Le copier-coller reste possible. Si le XML a été modifié, une confirmation précède son remplacement. Cliquez ensuite sur « Transformer ».

Les trois notices fictives sont stockées dans `content/samples/` et répertoriées dans `content/samples/index.json`. Pour ajouter une notice, placez son fichier XML dans ce dossier et ajoutez son nom au tableau JSON. Le menu affiche automatiquement le nom du fichier sans l’extension `.xml`.

## Documents du projet

- `PRD.md` — exigences produit et critères d'acceptation.
- `ARCHITECTURE.md` — architecture technique et décisions.
- `PEDAGOGY.md` — progression pédagogique et exercices.
- `DATA_FORMATS.md` — formats JSON/XML/XSLT du contenu pédagogique.
- `TEST_PLAN.md` — stratégie de tests.
- `ROADMAP.md` — phases et backlog initial.
- `CODEX_GUIDE.md` — méthode de travail recommandée avec Codex.
- `AGENTS.md` — instructions persistantes à donner à Codex dans le dépôt.

## Démarrage du développement

Commencer impérativement par le spike décrit dans `ARCHITECTURE.md` : vérifier le comportement de `XSLTProcessor` avec MARCXML et surtout `xsl:include`/`xsl:import` lorsque les fichiers sont servis comme ils le seront sur GitHub Pages. Ne pas construire l'application complète avant cette validation.

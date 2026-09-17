# ADR-001 — Moteur XSLT du laboratoire

## Statut

Accepté provisoirement après le spike Phase 0. La matrice complète des navigateurs reste à exécuter.

## Contexte

Le laboratoire doit transformer localement du MARCXML UNIMARC avec `XSLTProcessor`. Les feuilles pédagogiques peuvent utiliser `xsl:include` et `xsl:import`, avec des chemins relatifs, et l'application sera servie depuis un sous-chemin GitHub Pages.

## Spike exécuté

Le spike est disponible dans `spike/`. Il est servi par HTTP local et couvre :

- namespace MARCXML `http://www.loc.gov/MARC21/slim` ;
- sélection d'un sous-champ avec `xsl:value-of` ;
- template nommé et appel avec `xsl:call-template` ;
- `xsl:include` relatif ;
- `xsl:import` relatif et surcharge du template ;
- chargement des ressources depuis un sous-chemin (`/fixtures/...`).

Résultat observé dans le navigateur intégré Chromium le 17 septembre 2026 : **3/3 tests réussis**.

## Observation importante

Une feuille chargée avec `fetch`, puis analysée par `DOMParser`, ne conserve pas automatiquement une URL de base exploitable par `XSLTProcessor` pour ses dépendances relatives. Le navigateur a tenté de charger `fields.xsl` et `base.xsl` à la racine du serveur au lieu de leur répertoire respectif.

L'attribut `xml:base` ajouté au document DOM n'a pas corrigé ce comportement dans le navigateur testé.

## Décision

Adopter provisoirement la **décision B — résolution applicative** :

1. charger chaque feuille par `fetch` ;
2. analyser le XML et vérifier les erreurs de parsing ;
3. résoudre les URI `href` de `xsl:include` et `xsl:import` par rapport à l'URL de la feuille courante ;
4. transmettre à `XSLTProcessor` la feuille modifiée avec des URI absolues ;
5. conserver les éléments `include` et `import` afin que le processeur garde leur sémantique et leur précédence XSLT.

Cette approche ne concatène pas naïvement les fichiers et ne remplace pas `import` par `include`.

## Limites et prochaines vérifications

- Le résultat a été vérifié dans un seul navigateur Chromium intégré ; Firefox et Edge restent à tester.
- Le comportement devra être vérifié sur une URL GitHub Pages avec un sous-chemin de dépôt.
- Le navigateur signale que `XSLTProcessor` est déprécié. Il faut surveiller sa disponibilité dans les navigateurs cibles avant de figer l'architecture.
- Les erreurs réseau, les cycles de dépendances et les dépendances imbriquées devront recevoir des tests dédiés dans le chargeur définitif.
- Le spike ne constitue pas encore l'aperçu sécurisé de l'application : aucun résultat utilisateur ne doit être injecté dans le DOM principal du MVP.
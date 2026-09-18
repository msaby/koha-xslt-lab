# ADR-002 — libxslt embarqué en WebAssembly pour l'objectif 2027

## Statut au 18 septembre 2026

**Orientation retenue pour la migration, validation de production encore incomplète.**
Cette décision remplace l'orientation native de [l'ADR-001](ADR-001-xslt-engine.md).
Elle ne signifie pas que la migration a été réalisée : les modes libre et guidé
utilisent encore `src/transformer/transformer.js` et `XSLTProcessor` natif.
La copie Wasm corrigée fonctionne uniquement dans le banc `spike/wasm/`.

## Besoin et raisons du choix

Le laboratoire doit fonctionner en 2027, rester statique et transformer les
notices localement. Le [retrait annoncé de XSLT natif](https://developer.chrome.com/docs/web-platform/deprecating-xslt)
rend insuffisante la résolution d'URI de l'ADR-001 : corriger les chemins ne
remplace pas un moteur supprimé du navigateur.

Nous retenons libxslt/libxml2 compilés en WebAssembly, à partir de
[xslt_polyfill](https://github.com/mfreed7/xslt_polyfill), pour les raisons suivantes :

- exécution dans le navigateur sans backend ni envoi des sources utilisateur ;
- maintien de XSLT 1.0, des imports et de leur précédence, nécessaires aux feuilles Koha ;
- proximité avec la famille de moteur utilisée par Koha, sans promesse d'identité complète ;
- réussite mesurée des cas pédagogiques et des quatre feuilles Koha sur nos notices ;
- possibilité de servir le moteur comme fichier statique depuis le dépôt, sans CDN.

Un backend changerait les contraintes d'hébergement et de confidentialité.
Un autre moteur JavaScript/Wasm reste une alternative si les critères ci-dessous
ne sont pas satisfaits ; aucun comparatif exhaustif de moteurs n'a été réalisé.
Le choix ne repose donc pas sur une affirmation de supériorité générale.

## Solution précise et différence avec le paquet amont

La base testée est xslt-polyfill 1.0.28, commit
`75d5220d1f3473f1fb79b036b839c344c465b703`. Versions des bibliothèques, licences
et empreintes sont conservées dans `spike/wasm/vendor/` et `experimental/`.

Nous utilisons la fabrique Wasm et un adaptateur asynchrone local (`engine.js`),
pas le remplacement synchrone de l'API DOM ni la transformation automatique
des pages XML du polyfill. Les imports sont chargés relativement à l'URL réelle
de la feuille et interprétés par libxslt ; aucune concaténation de feuilles
ni substitution d'`import` par `include` n'est autorisée.

Le chargeur amont ignorait le dictionnaire libxml2 fourni pour les dépendances.
Des paramètres transmis à un template importé arrivaient vides. La copie corrigée
partage ce dictionnaire, comme le chargeur standard de libxslt. Ce correctif
est limité au parsing des dépendances ; les feuilles Koha restent intactes.
Le [cas minimal](../spike/wasm/fixtures/author-parameter/README.md) et le
[protocole de reconstruction](../spike/wasm/experimental/README.md) documentent la preuve.

Les appels sont sérialisés car le module Asyncify suspend un seul appel à la fois.
**Asynchrone ne signifie pas exécuté hors du thread de l'interface** : le calcul
peut encore bloquer la page. Aucun Worker interruptible n'est implémenté dans cet essai.

## Preuves et portée de la validation

Chromium 153.0.8010.12, XSLT natif désactivé, à la racine et sous un sous-chemin local :

| Variante | Résultat par chemin |
| --- | --- |
| Bundle amont et copie témoin reconstruite | 35/42 |
| Copie corrigée, mêmes sources de bibliothèques et mêmes outils que le témoin | 42/42 |

La correction résout le diagnostic de paramètres et six comparaisons Koha
(OPAC détail et interface professionnelle détail × trois notices). Les autres
contrôles couvrent notamment identité, exercices, imports imbriqués, précédence,
quelques fonctions EXSLT, sortie texte et reprise après erreur.

Ce sont **42 contrôles du corpus**, pas une certification XSLT ou Koha. La
comparaison HTML normalise les espaces et l'ordre des attributs ; elle ne valide
pas tous les détails visuels. Pour XML, la déclaration et les espaces hors
élément racine sont exclus. Le moteur force actuellement l'omission de la
déclaration XML : l'identité conserve les données testées, pas tous les octets.

## Limitations et conditions avant production

| Limite actuelle | Conséquence et vérification requise |
| --- | --- |
| Chromium seul testé | Exécuter la matrice Chrome, Edge, Firefox et Safari retenue pour le produit. Ne pas annoncer la compatibilité 2027 sur la seule base de ce test. |
| Sous-chemin simulé localement | Tester le véritable hébergement GitHub Pages, les chemins et la politique de sécurité. |
| Calcul dans le thread principal, pas de plafond validé | Prévoir un Worker interruptible, un délai maximal et des limites d'entrée/sortie ; tester récursion excessive, gros documents et répétitions. Les valeurs restent à déterminer. |
| Sources utilisateur arbitraires non auditées | Revoir les options de parsing, notamment `XML_PARSE_HUGE`, les entités et les limites de ressources ; le confinement Wasm ne suffit pas à garantir la robustesse. |
| Chargeur de ressources expérimental | Définir une liste de ressources autorisées et tester fichiers absents, cycles, redirections, `document()` et accès externes. Le filtre fetch du banc n'est pas le chargeur définitif. |
| Pas d'aperçu HTML réel dans le banc | Maintenir un iframe sandboxé sans scripts lors de l'intégration. Tester aussi événements, formulaires, navigation et chargements de ressources du résultat. Le test de texte inerte ne prouve pas la sûreté d'un aperçu. |
| Contexte Koha partiel | Les notices ne reproduisent pas toutes les préférences, variables, exemplaires ni préparations Perl. Valider toute personnalisation dans un Koha de test. |
| Couverture XSLT limitée | XSLT 1.0 visé ; quelques fonctions EXSLT vérifiées. XSLT 2/3 et les extensions non testées ne sont pas promis. |
| Coût de chargement et mémoire | Le bundle corrigé testé pèse 1 497 102 octets avant compression. Mesurer démarrage et consommation sur les appareils cibles ; ne pas déduire la mémoire utilisée du poids du fichier. |
| Adaptateur vers l'entrée C du moteur | Cette intégration est à maintenir avec le paquet amont ; sa compatibilité entre versions n'est pas garantie par notre banc actuel. |

La confidentialité exige d'interdire que le XML/XSLT saisi serve à construire
des requêtes réseau arbitraires, y compris vers la même origine. La simple
politique de même origine ne constitue pas une garantie d'absence d'exfiltration.

## Maintenance du correctif local

L'auteur présente le polyfill comme une solution de transition. Nous assumons
donc une dépendance à surveiller, et non un composant dont la maintenance future
serait acquise. Le correctif local n'est ni une version officielle ni une correction
acceptée par l'auteur. Une issue a été rédigée ; **elle n'a pas été publiée par
l'assistant**, conformément au choix de l'utilisateur de la poster lui-même.

Avant publication du laboratoire :

1. Conserver sources figées, licences, recette de compilation et empreintes des artefacts.
2. Faire relire le correctif et documenter la personne ou l'équipe chargée des mises à jour.
3. Surveiller libxml2, libxslt et le polyfill, notamment leurs correctifs de sécurité.
4. À chaque mise à jour, reconstruire et rejouer le cas minimal ainsi que le corpus
   sur les navigateurs cibles. Ne pas charger automatiquement une version distante « latest ».
5. Si le correctif entre dans une version officielle, la tester avant de retirer
   notre modification. Sinon, conserver explicitement la responsabilité de la variante locale.

La migration devra être acceptée après les vérifications du [plan de tests](TEST_PLAN.md).
Un échec doit produire une erreur explicite ; le moteur natif ne peut pas être
le secours durable de l'architecture 2027. Si la maintenance ou les limites de
sécurité ne peuvent être assurées, réexaminer le choix du moteur.

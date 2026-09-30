# ADR-002 — libxslt embarqué en WebAssembly pour l'objectif 2027

## Statut au 30 septembre 2026

**Orientation retenue pour la migration, validation de production encore incomplète.**
Cette décision remplace l'orientation native de [l'ADR-001](ADR-001-xslt-engine.md).
Elle ne signifie pas que la migration a été réalisée : les modes libre et guidé
utilisent encore `src/transformer/transformer.js` et `XSLTProcessor` natif.
Depuis le 19 septembre 2026, le moteur Wasm est intégré uniquement au
mode XSLT Koha : Worker interruptible, quatre feuilles fixes, URL autorisées
explicitement. Voir [le périmètre de cette intégration](XSLT_KOHA.md). Les limites
de l'essai ci-dessous restent la référence pour une migration générale ; le
succès du troisième mode ne certifie pas les feuilles utilisateur arbitraires.

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

## Solution précise et provenance

La version utilisée est xslt-polyfill 1.0.30, commit
`9ee67e848ef8ce2ad3b0bac4814b5a87db38a939`. Versions des bibliothèques,
licences et empreintes sont conservées dans `spike/wasm/vendor/`.

Nous utilisons la fabrique Wasm et un adaptateur asynchrone local (`engine.js`),
pas le remplacement synchrone de l'API DOM ni la transformation automatique
des pages XML du polyfill. Les imports sont chargés relativement à l'URL réelle
de la feuille et interprétés par libxslt ; aucune concaténation de feuilles
ni substitution d'`import` par `include` n'est autorisée.

Le chargeur de la version 1.0.28 ignorait le dictionnaire libxml2 fourni pour les
dépendances. Des paramètres transmis à un template importé arrivaient vides.
La version officielle 1.0.30 partage ce dictionnaire ; aucun patch local n'est
désormais appliqué. Les feuilles Koha restent intactes.
Le [cas minimal](../spike/wasm/fixtures/author-parameter/README.md) et le
[résultats historiques](../spike/wasm/results/) documentent le défaut initial.

Les appels sont sérialisés car le module Asyncify suspend un seul appel à la fois.
**Asynchrone ne signifie pas exécuté hors du thread de l'interface** : le calcul
peut encore bloquer la page dans le spike. L'intégration Koha utilise désormais
un Worker séparé par appel, terminé après réponse, annulation ou délai de 15 s.

## Preuves et portée de la validation

Chromium 153, XSLT natif désactivé, à la racine et sous un sous-chemin local :

| Variante | Résultat par chemin |
| --- | --- |
| Version officielle 1.0.28, résultat historique | 35/42 |
| Version officielle 1.0.30, 30 septembre 2026 | 42/42 |

La correction amont résout le diagnostic de paramètres et six comparaisons Koha
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
| Limites générales non validées | Le mode Koha dispose d'un Worker, d'un délai de 15 s et de limites 2 Mio en entrée / 10 Mio en sortie après calcul. La mémoire totale, les sources arbitraires et les appareils limités restent à évaluer. |
| Sources utilisateur arbitraires non auditées | Revoir les options de parsing, notamment `XML_PARSE_HUGE`, les entités et les limites de ressources ; le confinement Wasm ne suffit pas à garantir la robustesse. |
| Chargeur de ressources expérimental | Définir une liste de ressources autorisées et tester fichiers absents, cycles, redirections, `document()` et accès externes. Le filtre fetch du banc n'est pas le chargeur définitif. |
| Pas d'aperçu HTML réel dans le banc | Maintenir un iframe sandboxé sans scripts lors de l'intégration. Tester aussi événements, formulaires, navigation et chargements de ressources du résultat. Le test de texte inerte ne prouve pas la sûreté d'un aperçu. |
| Contexte Koha partiel | Les notices ne reproduisent pas toutes les préférences, variables, exemplaires ni préparations Perl. Valider toute personnalisation dans un Koha de test. |
| Couverture XSLT limitée | XSLT 1.0 visé ; quelques fonctions EXSLT vérifiées. XSLT 2/3 et les extensions non testées ne sont pas promis. |
| Coût de chargement et mémoire | Le bundle amont 1.0.30 pèse 1 456 506 octets avant compression. Mesurer démarrage et consommation sur les appareils cibles ; ne pas déduire la mémoire utilisée du poids du fichier. |
| Adaptateur vers l'entrée C du moteur | Cette intégration est à maintenir avec le paquet amont ; sa compatibilité entre versions n'est pas garantie par notre banc actuel. |

La confidentialité exige d'interdire que le XML/XSLT saisi serve à construire
des requêtes réseau arbitraires, y compris vers la même origine. La simple
politique de même origine ne constitue pas une garantie d'absence d'exfiltration.

## Maintenance du moteur amont

L'auteur présente le polyfill comme une solution de transition. Nous suivons
donc les versions officielles et conservons leurs sources, licences et empreintes.
Le correctif du dictionnaire est intégré à la version 1.0.30 ; le patch local
historique a été retiré après validation du banc et du mode Koha.

Avant publication du laboratoire :

1. Conserver sources figées, licences, recette de compilation et empreintes des artefacts.
2. Documenter la personne ou l'équipe chargée des mises à jour.
3. Surveiller libxml2, libxslt et le polyfill, notamment leurs correctifs de sécurité.
4. À chaque mise à jour, reconstruire et rejouer le cas minimal ainsi que le corpus
   sur les navigateurs cibles. Ne pas charger automatiquement une version distante « latest ».
5. Vérifier la compatibilité de l'entrée C et de l'adaptateur Worker à chaque version.

La migration devra être acceptée après les vérifications du [plan de tests](TEST_PLAN.md).
Un échec doit produire une erreur explicite ; le moteur natif ne peut pas être
le secours durable de l'architecture 2027. Si la maintenance ou les limites de
sécurité ne peuvent être assurées, réexaminer le choix du moteur.

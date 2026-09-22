# PRD — Koha XSLT Lab

## 1. Produit

Koha XSLT Lab est un laboratoire web de formation à XML, XPath et XSLT 1.0 appliqués aux notices UNIMARC/MARCXML et aux affichages Koha. Il fonctionne entièrement côté navigateur et est déployable sur GitHub Pages.

## 2. Utilisateurs

Public principal : bibliothécaires et administrateurs fonctionnels Koha connaissant UNIMARC mais débutant en XML/XPath/XSLT. Public secondaire : formateurs, administrateurs SIGB, étudiants et développeurs Koha débutants.

## 3. Objectifs utilisateur

À la fin du parcours, l'utilisateur doit pouvoir : comprendre MARCXML et le namespace MARC ; sélectionner zones/sous-champs avec XPath ; utiliser `value-of`, `if`, `choose`, `for-each`, templates, `apply-templates`, `call-template`, `include/import` ; lire une XSLT Koha ; changer un libellé ; supprimer ou ajouter un affichage ; comprendre qu'une partie des données peut être préparée par Koha/Perl avant XSLT.

## 4. Modes

Au lancement, l'utilisateur choisit Utilisation libre, Parcours guidé ou XSLT Koha.
Aucun exercice n'est affiché avant le choix du parcours guidé.

### Utilisation libre
Deux "éditeurs" (zone de saisie) contenant respectivement un document XML (MARCXML ou un autre schéma) et une feuille de style XSLT. Transformation à la demande, aperçu HTML, code XML ou HTML généré, erreurs éventuelles. Pas de fonction import/export de `.xml` ni de `.xsl`.

Le menu « Charger une notice d’exemple », réservé au mode libre, propose les fichiers du catalogue `content/samples/index.json` sous leur nom sans extension. La sélection remplace le code XML éventuellement déjà présent dans l'éditeur XML, avec confirmation si le contenu a été modifié ; le copier-coller reste possible. Une annulation ou une erreur de chargement conserve le XML contenu précédemment. La transformation reste déclenchée par l’utilisateur.

Le mode libre propose aussi « Charger une feuille XSLT d’exemple », avec les mêmes règles de sélection et de protection des saisies. Seule le code XSLT éventuellement présent dans l'éditeur XSLT est remplacé. Le catalogue comprend une transformation identité conservant les données et l’ordre des nœuds XML, ainsi que des présentations HTML simples.

### Parcours guidé

Comme pour le mode Utilisation libre, deux "éditeurs" (zone de saisie) contenant respectivement un document XML (MARCXML ou un autre schéma) et une feuille de style XSLT. Transformation à la demande, aperçu HTML, code XML ou HTML généré, erreurs éventuelles. Pas de fonction import/export de `.xml` ni de `.xsl`.

Un sélecteur permet de choisir un exercice présent dans le dépôt. Chaque exercice se compose d'un fichier XML et d'une feuille de style XSLT. Le sélecteur est généré depuis le catalogue et les fiches JSON : tri par `order` numérique croissant, titres issus de `title` et numérotation continue. Le premier exercice selon ce tri est chargé par défaut. Ajouter ou déplacer un exercice ne nécessite aucune modification HTML.

Parcours progressif avec consigne, fichiers de départ, validation du résultat, trois niveaux d'indices, solution consultable et progression enregistrée localement. L'exercice 1 est sélectionné et chargé par défaut lorsque le parcours guidé est choisi. Un sélecteur permet ensuite de charger les exercices disponibles.

La consigne unique est suivie du bouton de validation aligné à gauche. Les indices et la solution sont consultables dans deux blocs dépliables au comportement identique. En cas d’erreur de transformation, l’onglet « Erreurs » s’ouvre et reçoit le focus.

Le bloc solution propose « Copier la solution dans l’éditeur XSLT ». Le bouton remplace la XSLT par la correction affichée et place le focus dans l’éditeur, sans modifier la notice XML. Il faut ensuite lancer la transformation ; le résultat précédent est effacé pour éviter de valider une sortie devenue obsolète.

Les trois modes restent accessibles à tout moment depuis l'en-tête. Le mode libre et le mode parcours guidé partagent les zones de saise ; Le mode XSLT Koha conserve son XML séparément
et laisse la XSLT des deux autres modes intacte.

### XSLT Koha

Le mode **XSLT Koha** propose une notice MARCXML et un menu permettant de choisir une de ces 4 transformations : Détail OPAC, Liste OPAC, Détail interface pro et Liste interface pro. La XSLT n'est pas affichée ni modifiable. Le résultat utilise les onglets communs. Le mode garde ses choix et son XML indépendamment des sources des deux autres modes.

Vue pédagogique du pipeline : `notice UNIMARC -> traitements Koha -> MARCXML transmis au XSLT -> HTML`. La V1 explique notamment `ExpandCodedFields` sans prétendre le simuler complètement.

## 5. Fonctionnalités MVP

1. Éditeur MARCXML avec numéros de ligne, coloration et validation syntaxique.
2. Éditeur XSLT avec mêmes fonctions.
3. Transformation XSLT 1.0 locale, bouton et raccourci `Ctrl+Entrée`.
4. Aperçu HTML isolé ; onglet XML ou HTML généré ; onglet erreurs.
5. Corpus de fichiers XML et de feuilles de styles XSLT pour le mode libre
6. Au moins 10 exercices progressifs (fichiers XML et XSLT) pour le parcours guidé.
7. Corpus de notices UNIMARC pour le mode XSLT Koha
8. Feuilles de style XSLT Koha récentes et officielles pour le mode XSLT Koha
9. Validation fondée sur le résultat, pas sur une solution XSLT unique.
10. Aide-mémoire XSLT/XPath.
11. Sauvegarde automatique locale et réinitialisation.
12. Gestion pédagogique multifichier, au minimum `main.xsl -> xsl:include -> utils.xsl`.
13. Générateur de prompt LLM sans appel API.
14. Interface clavier et accessibilité visée WCAG 2.2 AA / RGAA pertinent.

## 6. Exercices MVP

1. Afficher l'identifiant de la notice en zone `001` avec `xsl:value-of`.
2. Compter les `datafield` avec `count()` sur une notice contenant exactement trois zones.
3. Afficher `200$a` avec `xsl:value-of`.
4. Afficher `200$a` et le premier `200$e` dans un paragraphe unique avec un séparateur.
5. Afficher `200$a` et tous les `200$e` avec `xsl:for-each` et des séparateurs.
6. Afficher plusieurs données bibliographiques.
7. Ajouter des libellés HTML.
8. Afficher `330$a` conditionnellement avec `xsl:if`.
9. Introduire `xsl:choose`.
10. Afficher plusieurs sujets avec `xsl:for-each`.
11. Refactorer avec `xsl:apply-templates` et `xsl:template match`.
12. Traiter 600/601/606/607 avec une logique commune.
13. Utiliser un template nommé et `xsl:call-template`.
14. Déplacer un template dans `utils.xsl` et l'inclure.
15. Modifier une mini-XSLT inspirée de Koha : libellé, suppression, ajout de 225.
16. Lire un extrait authentique/adapté d'une XSLT Koha et identifier ses mécanismes.

## 7. Confidentialité et sécurité

Aucun contenu des éditeurs n'est transmis par défaut. Toute télémétrie future exclut XML/XSLT et doit être explicitement documentée. Le HTML produit est non fiable et doit être rendu dans un `iframe sandbox` sans privilèges inutiles. Les imports de fichiers sont considérés non fiables.

## 8. Hors périmètre MVP

Backend, comptes, base de données, collaboration, exécution Perl, connexion à Koha, émulation exacte de `ExpandCodedFields`, MARC21, XSLT 2/3, API LLM, éditeur MARC complet, assistance ou documentation sur le format UNIMARC ou les normes de catalogage, validation du schéma MARCXML à la saisie.

## 9. Critères d'acceptation MVP

Depuis l'URL GitHub Pages, un utilisateur doit pouvoir :  
- sélectionner chacun des 3 modes (libre, parcours guidé, xslt Koha)
- passer d'un mode à l'autre

Pour le mode parcours guidé un utilisateur doit pouvoir :
- ouvrir un exercice
- obtenir des indices
- obtenir la solution
- appliquer la transformation
- valider l'exercice
- restaurer sa progression après rechargement,

Pour le mode libre un utilisateur doit pouvoir : 
- sélectionner un fichier XML et une feuille XSLT présentes dans le dépot
- modifier ces fichiers dans les éditeurs XML et XSLT
- saisir ex nihilo du code XML et XSLT
- appliquer la transformation
- voir le résultat (aperçu HTML, code XML ou HTML généré, erreurs éventuelles)

Pour le mode XSLT Koha un utilisateur doit pouvoir : 
- sélectionner depuis un menu une notice MARCXML présente dans le dépot
- modifier la notice MARCXML dans l'éditeur
- saisir ex nihilo une notice MARCXML
- choisir un type de transformation correspondant aux 4 affichages Koha : Détail OPAC, Liste OPAC, Détail interface pro ou Liste interface pro
- appliquer la transformation
- voir le résultat (aperçu HTML, code XML ou HTML généré, erreurs éventuelles)

Tout doit fonctionner sans compte ni backend.

L'application doit être accessible, en particulier être utilisable au clavier.

Pour le MVP pas de recherche d'affichage sur smartphone ni tablette.

## 10. Mesures de qualité

- Aucun contenu utilisateur envoyé au réseau par la transformation.
- Temps de réponse quasi immédiat sur les corpus fournis.
- Aucune erreur console lors du parcours nominal.
- Tests automatisés sur transformations et validation.
- Parcours principal utilisable au clavier.

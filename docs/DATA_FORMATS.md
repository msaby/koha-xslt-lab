# Formats de contenu

## Exercice JSON

Le menu est construit à la première ouverture du parcours guidé, à partir des
identifiants du tableau `exercises` dans `content/exercises/index.json`.
Chaque identifiant désigne `content/exercises/<id>.json` et doit correspondre
au champ `id` de cette fiche. Utiliser lettres non accentuées, chiffres, tirets
ou underscores, sans extension ; les identifiants doivent être uniques.

Les fiches sont triées par **`order` croissant**, puis numérotées automatiquement
1, 2, 3… ; `title` fournit le libellé. Le nom du fichier ne fixe pas sa position.
Les valeurs 10, 20, 30 sont possibles : un exercice avec `order: 15` se place
entre 10 et 20. À égalité, l'ordre du catalogue départage les fiches.

`order` doit être un nombre JSON (pas une chaîne) et `title` doit être non vide.
Un catalogue vide, une fiche inaccessible ou ces métadonnées invalides produisent
un message d'erreur et laissent le menu désactivé. Revenir au parcours guidé
permet de réessayer un chargement échoué.

```json
{
  "id": "ex01-identifier",
  "order": 1,
  "title": "Afficher l'identifiant de la notice",
  "concepts": ["xpath", "xsl:value-of"],
  "instruction": "Le code initial crée une balise HTML p contenant \"Votre identifiant apparaîtra ici.\". L'objectif de l'exercice est de remplacer cette phrase par le contenu de la zone 001.",
  "files": {
    "xml": "content/samples/identifier.xml",
    "entryXslt": "content/xslt/ex01/main.xsl",
    "projectFiles": ["content/xslt/ex01/main.xsl"]
  },
  "validation": [
    {"type": "textContains", "value": "FRBNF000000001"}
  ],
  "hints": [
    "Cherchez l'élément record.",
    "Sélectionnez marc:controlfield.",
    "Filtrez avec [@tag='001']."
  ],
  "solution": "content/solutions/ex01/main.xsl"
}
```

La consigne unique est stockée dans `instruction` et affichée dans le bloc HTML `exercise-instruction`.

### Ajouter un exercice à la main

1. Dupliquer une fiche, par exemple `content/exercises/ex-count-datafields.json`,
   sous un nouvel identifiant comme `ex-publisher`.
2. Préparer une notice XML (ou en réutiliser une), une XSLT de départ et sa
   solution. Renseigner leurs chemins relatifs à la racine du dépôt dans `files`
   et `solution`. Conserver `projectFiles` cohérent avec la feuille de départ.
3. Adapter `id`, `order`, `title`, `instruction`, `concepts`, `hints` et `validation`.
4. Ajouter l'identifiant au tableau `exercises` du catalogue. Aucune modification
   de `index.html` ni compilation n'est nécessaire.
5. Recharger le site, ouvrir le parcours guidé et vérifier le menu, la notice,
   les indices, la copie de solution, la transformation et la validation.

Pour déplacer un exercice, modifier seulement `order` puis recharger la page.
Les fiches restent en mémoire pendant la session : un changement de mode ne
recharge pas un catalogue déjà chargé avec succès. Le premier exercice selon
le tri est sélectionné au premier accès ; les retours conservent le travail courant.

## Catalogue de notices d’exemple

`content/samples/index.json` est un tableau de noms de fichiers, dans l’ordre du menu du mode libre :

```json
[
  "jardin-des-nuages.xml",
  "atlas-des-iles-imaginaires.xml",
  "cuisine-des-etoiles.xml"
]
```

Chaque entrée désigne un fichier XML directement dans `content/samples/`. Le libellé est dérivé du nom en retirant l’extension `.xml` ; il n’y a pas de champ de libellé séparé. Ajouter un fichier au dossier ne suffit pas : il doit aussi figurer dans ce catalogue.

Les trois notices fictives utilisent un élément `record` avec le namespace `http://www.loc.gov/MARC21/slim` et des zones UNIMARC. Elles proposent respectivement un sous-titre, plusieurs sous-titres et aucun sous-titre. Les fichiers des exercices restent référencés par `files.xml` et ne sont pas automatiquement ajoutés au menu libre.

## Catalogue de feuilles XSLT d’exemple

`content/xslt/samples/index.json` contient un tableau de noms de fichiers `.xsl` : `identite.xsl`, `titre-auteur.xsl`, `titre-sous-titres.xsl` et `tous-les-champs.xsl`. Les chemins sont relatifs au dossier `content/xslt/samples/`, et les libellés du menu sont les noms sans extension. Ce catalogue indépendant est réservé au mode libre ; il ne modifie pas les feuilles de départ ou les solutions des exercices.

Les exemples sont des feuilles XSLT 1.0 autonomes. `identite.xsl` produit du XML avec le template identité `@*|node()` et `xsl:copy`, sans suppression des espaces ni tri. Les trois autres produisent du HTML à partir de notices UNIMARC/MARCXML, seules ou dans une collection.

Les descriptions du sélecteur XSLT sont définies dans `content/xslt/samples/descriptions.json`, un objet associant chaque nom complet de fichier `.xsl` à une description courte. Chaque fichier du catalogue doit avoir une description. Les descriptions sont affichées comme texte dans la liste avant le choix, puis sous le sélecteur après chargement. Conserver leur cohérence avec les commentaires XML des feuilles.

## Validateurs disponibles

- `textContains` : le texte du résultat contient `value`.
- `textEquals` : le texte du résultat est égal à `value`.

Les espaces sont normalisés dans les deux cas. Toutes les règles doivent réussir.
Exemple : `{"type": "textEquals", "value": "3"}` accepte le résultat du comptage
mais refuse `13`. La validation porte sur le résultat, pas sur la présence de
`count()` dans le code. Les validateurs de structure CSS et de nombre d'éléments
ne sont pas encore implémentés. Éviter `innerHTML` exact, trop fragile.

## Projet XSLT

Représentation logique : `{ entryFile, files: Map<path,string> }`. Tous les chemins doivent être relatifs, normalisés et confinés au projet ; interdire `../` sortant de la racine virtuelle.

## Aide UNIMARC

JSON minimal par zone : tag, libellé, description courte, sous-champs nécessaires aux exercices, éventuellement lien/source documentaire dans la documentation du projet. Ne pas prétendre à l'exhaustivité.

## Versionnement

Le manifeste `content/exercises/index.json` porte actuellement `contentSchemaVersion: 3`. Toute modification incompatible du format des exercices doit incrémenter cette version. Le catalogue de notices est un tableau indépendant.

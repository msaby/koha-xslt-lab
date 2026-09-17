# Formats de contenu

## Exercice JSON

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

## Validateurs MVP

- `textContains`
- `textEqualsNormalized`
- `cssSelectorExists`
- `cssSelectorText`
- `count`

Éviter `innerHTML` exact, trop fragile.

## Projet XSLT

Représentation logique : `{ entryFile, files: Map<path,string> }`. Tous les chemins doivent être relatifs, normalisés et confinés au projet ; interdire `../` sortant de la racine virtuelle.

## Aide UNIMARC

JSON minimal par zone : tag, libellé, description courte, sous-champs nécessaires aux exercices, éventuellement lien/source documentaire dans la documentation du projet. Ne pas prétendre à l'exhaustivité.

## Versionnement

Le manifeste `content/exercises/index.json` porte actuellement `contentSchemaVersion: 3`. Toute modification incompatible du format des exercices doit incrémenter cette version. Le catalogue de notices est un tableau indépendant.

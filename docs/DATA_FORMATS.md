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

Ajouter `contentSchemaVersion` au manifeste global. Toute modification incompatible des JSON doit incrémenter cette version.

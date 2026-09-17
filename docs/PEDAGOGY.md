# Conception pédagogique

## Principes

Une difficulté nouvelle à la fois. Commencer par `MARCXML -> XSLT -> HTML`, puis introduire XPath, conditions, répétitions, templates, modularité et enfin l'architecture Koha. Les stagiaires connaissent UNIMARC : utiliser de vraies structures MARCXML dès le début plutôt qu'un XML générique de livres.

Le laboratoire propose d'abord un choix entre utilisation libre et parcours guidé. Le parcours guidé charge l'exercice 1 par défaut ; l'utilisateur peut revenir à l'utilisation libre à tout moment, sans perdre les sources éditées.

## Séquence suggérée

### Niveau 0 — lire MARCXML
Identifier `record`, `datafield`, `subfield`, `tag`, `code` et le namespace MARCXML.

### Niveau 1 — extraire
`001`, puis `200$a`, puis la combinaison de `200$a` avec le premier `200$e`, avant de parcourir tous les `200$e`. L'exercice `001` commence sans sous-zone afin d'isoler la sélection d'une zone de contrôle ; les exercices suivants introduisent la sélection de plusieurs sous-zones, les séparateurs et la répétition avec `xsl:for-each`.

### Niveau 2 — présenter
Produire HTML et libellés ; distinguer donnée et présentation.

### Niveau 3 — décider
`xsl:if`, puis `xsl:choose`.

### Niveau 4 — répéter
Zones sujet répétées ; `for-each` puis discussion de ses limites.

### Niveau 5 — templates
`apply-templates`, `template match`, contexte courant (`.`), XPath relatif.

### Niveau 6 — réutiliser
Template nommé, paramètres simples si nécessaire, puis traitement commun 600/601/606/607.

### Niveau 7 — modulariser
`xsl:include` et différence conceptuelle avec `xsl:import`.

### Niveau 8 — Koha
Mini-XSLT proche de Koha puis extrait réel. Expliquer les quatre contextes : résultats/détail, OPAC/pro. Montrer que Koha peut préparer les données avant XSLT (`ExpandCodedFields`).

## Validation

Valider le DOM/résultat, jamais la présence d'une chaîne de code précise. Normaliser les espaces lorsque pertinent. Les tests doivent accepter plusieurs solutions correctes.

## Indices

Chaque exercice : indice conceptuel, indice XPath/syntaxe, indice presque complet. Le corrigé est disponible volontairement.

## LLM

Le LLM est un copilote, pas un oracle. Exercices : demander une explication d'erreur ; demander un indice sans solution ; faire vérifier une proposition ; repérer une réponse utilisant XSLT 2.0 alors que le contexte impose 1.0 ; fournir XML + XSLT + erreur + objectif. Le générateur de prompt doit rappeler « XSLT 1.0 », « UNIMARC/MARCXML » et « explique avant de réécrire ».

## Corpus UNIMARC

Prévoir au minimum : notice minimale 001/200 ; livre avec 010/100/101/200/publication/215/225/330/7XX ; notice avec 600/601/606/607 répétés ; notice complexe avec absences et répétitions. Vérifier les exemples UNIMARC avant publication et documenter la source des libellés de zones.

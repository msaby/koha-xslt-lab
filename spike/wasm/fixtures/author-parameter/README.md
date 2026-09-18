# Reproduction minimale : paramètre d'un template importé

`notice.xml` contient un champ 700 (Brume, Lila) et un champ 701 témoin.
`main.xsl` compare une sélection directe et six appels de templates :
template local/importé × paramètre fragment de résultat/chaîne/nombre.
`templates.xsl` contient le template importé, identique au template local
à son nom près. Ce troisième fichier est nécessaire pour tester l'import.

Chaque appel affiche le contexte, le namespace, le nombre de champs visibles,
la valeur du paramètre, le nombre de champs sélectionnés et le nom d'auteur.
La valeur attendue du paramètre est toujours `700`, avec un champ sélectionné
et l'auteur `Brume`. Le champ 701 permet de détecter une sélection trop large.

## Résultat observé le 18 septembre 2026

Chromium 153.0.8010.12, XSLT natif désactivé, à la racine et sous un sous-chemin :

| Variante | Paramètre Wasm | Champs sélectionnés Wasm | Référence libxslt |
| --- | --- | --- | --- |
| Sélection directe | sans paramètre | 1 | 1 |
| Local, fragment | 700 | 1 | 700 / 1 |
| Local, chaîne | 700 | 1 | 700 / 1 |
| Local, nombre | 700 | 1 | 700 / 1 |
| Importé, fragment | vide | 0 | 700 / 1 |
| Importé, chaîne | vide | 0 | 700 / 1 |
| Importé, nombre | vide | 0 | 700 / 1 |

Le contexte reste `record`, le namespace MARCXML est correct et les deux champs
sont visibles dans les six appels. Le template importé est donc chargé et appelé,
mais ne reçoit pas la valeur du paramètre. Changer uniquement la syntaxe du
paramètre ne corrige pas le défaut. Ce cas isole la transmission des paramètres
vers une feuille importée ; il ne démontre pas encore la cause interne au moteur.

Le cas est intégré au banc `spike/wasm/` ; ses sorties complètes sont dans
`authorParameter` des rapports `results/wasm*.json`. Il compte comme un contrôle
de transformation comprenant les six variantes. Bilan avant correction : 35/42 contrôles
réussis (six écarts Koha et cette reproduction minimale).

## Hypothèse testée et confirmée

Le chargeur de dépendances de `vendor/transform.c` ignore l'argument `xmlDictPtr dict`.
La copie expérimentale rétablit le dictionnaire partagé libxml2 entre feuilles.
Les six variantes passent alors (paramètre 700, un champ sélectionné, auteur Brume),
ainsi que les six comparaisons Koha auparavant en échec : **42/42 contrôles**.
Une copie non corrigée, reconstruite avec les mêmes outils, reproduit 35/42.
Les deux variantes sont testées à la racine et sous un sous-chemin avec l'API native
désactivée. Les feuilles Koha restent intactes.

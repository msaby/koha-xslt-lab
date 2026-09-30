# Contrôle des paramètres d'un template importé

`notice.xml` contient un champ 700 (Brume, Lila) et un champ 701 témoin.
`main.xsl` compare une sélection directe et six appels de templates :
template local/importé × paramètre fragment de résultat/chaîne/nombre.
`templates.xsl` contient le template importé, identique au template local
à son nom près. Ce troisième fichier permet de tester l'import.

Chaque appel affiche le contexte, le namespace, le nombre de champs visibles,
la valeur du paramètre, le nombre de champs sélectionnés et le nom d'auteur.
La valeur attendue du paramètre est toujours `700`, avec un champ sélectionné
et l'auteur `Brume`. Le champ 701 permet de détecter une sélection trop large.

Ce cas fait partie des 42 contrôles réussis par la version officielle 1.0.30
du moteur WebAssembly, avec XSLT natif désactivé, à la racine et sous un
sous-chemin. Les résultats sont dans les rapports `results/wasm*.json`.

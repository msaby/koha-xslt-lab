# Moteur Wasm du mode Koha

`koha-xslt-wasm.js` est généré depuis le bundle officiel xslt-polyfill 1.0.30.
Le script extrait sa fabrique Wasm puis ajoute un export ES pour le Worker module.
Il embarque son binaire Wasm et ne requiert aucun CDN. Ne pas modifier le code
généré à la main.

Sources figées et licences : voir `spike/wasm/vendor/manifest.json`.
L'amont est xslt-polyfill 1.0.30, commit
9ee67e848ef8ce2ad3b0bac4814b5a87db38a939. Les trois licences sont copiées ici.

Pour actualiser cette copie après reconstruction, exécuter depuis la racine :

```sh
node scripts/build-koha-engine.cjs
```

Rejouer `tests/wasm.browser.cjs` puis `tests/koha.browser.cjs`. Les empreintes de l'entrée
et de la sortie sont enregistrées dans `manifest.json` par le script.

# Moteur Wasm du mode Koha

`koha-xslt-wasm.js` est la copie de `spike/wasm/experimental/patched.js`, avec
uniquement `export default createXSLTTransformModule;` ajouté en fin de fichier
pour le chargement dans un Worker module. Il embarque son binaire Wasm et ne
requiert aucun CDN. Ne pas modifier le code généré à la main.

Sources figées, licences, correction du dictionnaire et reconstruction : voir
`spike/wasm/vendor/manifest.json`, `spike/wasm/patch-loader.py` et
`spike/wasm/build-experiment.sh`. L'amont est xslt-polyfill 1.0.28, commit
75d5220d1f3473f1fb79b036b839c344c465b703. Les trois licences sont copiées ici.

Pour actualiser cette copie après reconstruction, exécuter depuis la racine :

```sh
node scripts/build-koha-engine.cjs
```

Rejouer le banc corrigé puis `tests/koha.browser.cjs`. Les empreintes de l'entrée
et de la sortie sont enregistrées dans `manifest.json` par le script.

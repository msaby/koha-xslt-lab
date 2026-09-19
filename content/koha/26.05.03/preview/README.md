# Styles de l’aperçu Koha

Les CSS OPAC et professionnels sont compilés depuis les sources Sass de
l’archive officielle Koha 26.05.03 déjà utilisée pour les XSLT :
https://download.koha-community.org/koha-26.05.03.tar.gz

`../styles-manifest.json` conserve les empreintes des fichiers de l’archive.
`manifest.json` décrit les CSS dérivés et leurs versions de compilation.
Les sources restent intactes. Bootstrap 5.3.8, Font Awesome 7.2.0 et Sass 1.98.0
correspondent aux versions du verrou Yarn de Koha.

## Reproduction

Depuis la racine du dépôt, après `npm ci` :

```sh
python scripts/extract-koha-styles.py /chemin/koha-26.05.03.tar.gz
node scripts/build-koha-styles.cjs
python scripts/extract-koha-styles.py /chemin/koha-26.05.03.tar.gz --assets
node scripts/build-koha-styles.cjs --pack
```

L’extraction vérifie le SHA-256 de l’archive. Les CSS compilés sont conservés
à côté des sources ; ceux de ce dossier incorporent images et polices sous
forme de données pour l’iframe sandboxé sans requête externe.
Les huit fichiers Poppins référencés par le Sass professionnel sont absents de
l’archive : leurs règles `@font-face` sont retirées du CSS d’aperçu, ce qui
laisse agir les polices de secours de Koha. Les fichiers Noto Sans et les ressources
Font Awesome proviennent de l’archive. Voir `../debian/copyright`, la licence Koha,
la licence Font Awesome dans `../koha-tmpl/opac-tmpl/lib/fontawesome/` et les
licences de dépendances présentes ici.

## Limites

Styles principaux compilés sans Autoprefixer ni variante RTL du build Koha.
L’aperçu ajoute une marge, un fond blanc et un conteneur minimal pour le détail
ou la liste. Il ne reproduit pas une page Koha complète : absence de navigation,
scripts, widgets, préférences et données complémentaires préparées par Koha.
La police professionnelle peut différer. Les styles restent confinés à l’aperçu
Koha et le HTML brut reste celui de la XSLT.

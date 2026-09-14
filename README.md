# Site de SkanFact

Le site public de **SkanFact**, logiciel de devis, factures et gestion pour les petites entreprises
tunisiennes. Édité par SKANCYBER SECURITY SUARL.

👉 L'application elle-même vit dans le dépôt [saouthq/skanfact](https://github.com/saouthq/skanfact).

## Ce que c'est

Un site **statique** : quatre pages en HTML, une feuille de style, un petit fichier JavaScript.
Aucun framework, aucune étape de construction, aucune dépendance à installer. On ouvre un fichier
dans un navigateur et on voit le site — c'est la même philosophie que l'application.

```
index.html              la page principale
telecharger.html        le téléchargement, Mac et Windows
mentions-legales.html   mentions légales
confidentialite.html    ce que le site et l'application font de vos données
assets/style.css        toute la mise en forme
assets/site.js          menu, formulaire de contact, dernière version publiée
img/                    les captures de l'application, en deux tailles
```

## Modifier un texte

Ouvrez le fichier `.html` concerné, changez la phrase, enregistrez, et poussez sur `main` :
le site est mis à jour tout seul en une minute environ.

## Voir le site sur son ordinateur

Il suffit d'ouvrir `index.html` dans un navigateur. Pour que les liens entre pages se comportent
exactement comme en ligne, on peut aussi lancer un petit serveur local :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## La page de téléchargement se met à jour toute seule

`assets/site.js` interroge l'interface publique de GitHub pour connaître la dernière version publiée
de l'application, et pointe les boutons vers les bons fichiers (`.dmg` pour Mac, `.exe` pour
Windows, et les deux équivalents pour SkanFact Cabinet).

**Il n'y a donc rien à modifier ici quand une nouvelle version de l'application sort.** Si l'appel
échoue — pas de connexion, quota atteint — les boutons renvoient vers la page des versions et la
page reste utilisable : c'est volontaire.

## Les captures d'écran

Elles sont produites par le dépôt de l'application :

```bash
xvfb-run -a node test/e2e/captures-site.js   # dans saouthq/skanfact
```

Ce parcours charge le jeu d'exemple puis **masque ses deux marqueurs** — le bandeau « jeu
d'exemple » et le tampon sur les documents. Ils n'existent que parce que les données sont fictives :
les montrer sur le site donnerait une image fausse du produit, dans l'autre sens.

Les images sont ensuite réduites en deux tailles (1400 px et 720 px) et servies avec `srcset`.

## Ce qui reste à compléter

- Le **nom de domaine** (`skanfact.tn`) : une fois acheté, ajouter un fichier `CNAME` contenant le
  domaine et faire pointer les DNS vers GitHub Pages.
- L'adresse **contact@skanfact.tn**, à créer avec le domaine.
- Le **numéro de téléphone**, écrit `+216 XX XXX XXX` partout.
- Dans les mentions légales : le **numéro au registre national des entreprises** et le **capital
  social**, qui ne figurent pas sur la carte d'identification fiscale.

## Droits

© 2026 SKANCYBER SECURITY SUARL — tous droits réservés. Le contenu de ce dépôt (textes, mise en
page, captures) n'est pas réutilisable sans accord écrit.

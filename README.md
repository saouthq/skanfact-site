# Site de SkanFact

Le site public de **SkanFact**, logiciel de devis, factures et gestion pour les petites entreprises
tunisiennes. Édité par SKANCYBER SECURITY SUARL.

👉 L'application elle-même vit dans le dépôt [saouthq/skanfact](https://github.com/saouthq/skanfact).

## Ce que c'est

Un site **statique** : des pages en HTML, une feuille de style, un petit fichier JavaScript. Aucun
framework, aucune étape de construction, aucune dépendance à installer. On ouvre un fichier dans un
navigateur et on voit le site — c'est la même philosophie que l'application.

```
index.html              l'accueil : la promesse, les quatre portes, les prix
visite.html             la visite guidée : sept écrans, du devis à la déclaration
excel.html              « SkanFact ou Excel ? » — la page qu'on cherche quand on hésite
pour-votre-client.html  la page qu'un comptable envoie à son client
404.html                page introuvable (chemins ABSOLUS, voir plus bas)
facturation.html        devis, factures, avoirs, relances, clients
gestion.html            achats, stock, trésorerie, marges, paie, les 16 modules
tunisie.html            timbre fiscal, TVA, retenue à la source, clôture
comptables.html         SkanFact Cabinet, gratuite, et le dossier mensuel
tarifs.html             les trois offres et le tableau comparatif
questions.html          les questions fréquentes, classées
contact.html            le formulaire et les coordonnées
telecharger.html        le téléchargement, Mac et Windows
mentions-legales.html   mentions légales
confidentialite.html    ce que le site et l'application font de vos données
assets/style.css        toute la mise en forme, polices comprises
assets/site.js          menu, formulaire de contact, dernière version publiée
assets/polices/         les deux polices, servies depuis ce site
img/                    les captures de l'application, en deux tailles
```

## Une page par intention

Le site était **une seule longue page** dont les liens ne faisaient que défiler. Il a été découpé en
septembre 2026 : chaque sujet a désormais son adresse, son titre et sa description. C'est ce qui
permet à quelqu'un de partager un lien précis, et à Google de proposer la bonne page à la bonne
question — une page unique ne peut se positionner que sur une seule recherche.

**Aucune page ne se termine en cul-de-sac** : chacune finit par « Continuer la visite » (trois pages
voisines) puis par un rappel de l'essai.

Trois pages ont été ajoutées en septembre 2026, pour trois manques précis :

- **`visite.html`** — le seul moyen de voir SkanFact était d'installer 220 Mo d'application non
  signée, en passant outre un avertissement de sécurité. Beaucoup s'arrêtaient là. Sept écrans réels
  dans l'ordre d'une affaire : le devis, la facture, la relance, la trésorerie, la TVA, le dossier du
  comptable, le panneau du matin. Pas une liste de fonctions — il y en a déjà trois pages — mais
  l'**enchaînement**, qui ne se voit nulle part ailleurs.
- **`excel.html`** — le concurrent réel n'est pas un autre logiciel, c'est le classeur. La page dit
  les sept endroits où ça casse, et **ce qu'Excel fait mieux** : un tableau qui donne toujours raison
  à celui qui l'écrit ne se lit pas jusqu'au bout.
- **`pour-votre-client.html`** — tout le reste du site s'adresse au comptable ; rien ne lui donnait
  de quoi parler à **son** client. C'est pourtant toute la stratégie : le cabinet est le canal, pas
  la cible. Page courte exprès — elle s'ouvre depuis un lien WhatsApp, sur un téléphone. La page
  Comptables la propose avec un bouton « copier le lien ».

## Modifier un texte

Ouvrez le fichier `.html` concerné, changez la phrase, enregistrez, et poussez sur `main` : le site
est mis à jour tout seul en une minute environ.

⚠️ **L'en-tête et le pied de page sont recopiés dans chaque fichier.** Si vous ajoutez une entrée au
menu ou changez l'adresse du pied, il faut le faire dans *toutes* les pages — c'est le prix à payer
pour un site sans étape de construction. La page courante, elle, se marque toute seule
(`assets/site.js` compare l'adresse aux liens du menu) : il n'y a rien à indiquer à la main.

Pour vérifier qu'aucune page n'a divergé :

```bash
for f in *.html; do sed -n '/<header/,/<\/header>/p' "$f" | md5sum; done | sort -u | wc -l
# doit afficher 1 (la 404 a son propre en-tête réduit : elle n'entre pas dans le compte)
```

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

Règle apprise : une balise `<img>` qui porte ses attributs `width` et `height` **doit** recevoir
`height: auto` en CSS. Sans quoi la largeur se réduit avec l'écran pendant que la hauteur reste
celle de l'attribut, et toutes les captures sont étirées en hauteur — ça ne se voit sur aucune
relecture du code, seulement en mesurant `getBoundingClientRect()` dans un vrai navigateur.

## Les polices sont servies depuis ce site

`assets/polices/` contient les quatre fichiers `woff2` (Bricolage Grotesque et Lexend, sous-ensembles
latin et latin-ext), et les `@font-face` sont en tête de `assets/style.css`. Ce sont des polices
**variables** : un seul fichier couvre toute la plage de graisses, d'où `font-weight: 600 800` plutôt
qu'un bloc par graisse.

Deux raisons de ne plus passer par Google, dans cet ordre : la feuille de Google était une requête
**bloquante** vers un tiers avant le premier pixel de texte, et l'adresse IP de chaque visiteur
partait chez lui sans qu'on le lui ait demandé — sur un site dont l'argument est « vos données
restent chez vous ».

188 Ko en tout, préchargés pour les deux fichiers `latin`. Depuis, l'audit mesure la page avec les
**vraies** polices : tant que Google était bloqué dans l'environnement de test, tout était mesuré
avec des polices de substitution, donc à des largeurs fausses.

## La page 404

`404.html` est servie par GitHub Pages pour **n'importe quelle** adresse manquante — et l'adresse
affichée reste celle qui manquait. Ses chemins sont donc **absolus** (`/skanfact-site/assets/…`) :
avec des chemins relatifs, `assets/style.css` serait cherché dans le dossier inexistant de l'adresse
demandée, et la page arriverait sans style ni logo. **Ces chemins sont à reprendre le jour du
domaine** (`/skanfact-site/` → `/`), en même temps que les `og:url` et les canoniques.

## Le formulaire de contact

Il poste sur le **relais Cloudflare déjà déployé** pour les mises à jour, qui a désormais une route
`/contact`. Rien ne part chez un service tiers — ce serait démentir la promesse du site sur la page
même où l'on demande de nous faire confiance.

Une seule ligne à remplir dans `assets/site.js` :

```js
var RELAIS_CONTACT = '';     // ← l'adresse du relais, suivie de /contact
```

**Tant qu'elle est vide, le formulaire fonctionne quand même** : il repasse par le logiciel de
messagerie du visiteur, et il le dit. Même chose si le relais répond mal ou met plus de douze
secondes. On ne perd jamais un message parce qu'un service est en panne. Le reste — clés, variables,
vérification — est dans `worker/README.md` du dépôt de l'application.

## Audit UI/UX de septembre 2026

Onze pages mesurées dans un vrai navigateur, à quatre largeurs (1440, 1024, 768, 380) : débordement
élément par élément, contraste de **tout** le texte (pas seulement des boutons), taille des cibles au
doigt, taille de police, longueur de ligne, images, liens, hiérarchie des titres, étiquettes de
formulaire, identifiants en double, entêtes de page. 256 constats au départ, zéro à l'arrivée.

Les règles apprises, à ne pas recasser :

- **Un gris « secondaire » reste du texte.** `--gris-clair` valait `#8b9995` : **2,96 sur blanc et
  2,75 sur crème**, quand il en faut 4,5. Il portait le fil d'Ariane, l'adresse du pied, le nom du
  fichier à télécharger et les « — » du tableau des offres — sur les onze pages. Personne ne l'avait
  vu parce que ça se lit encore *presque*. Il vaut `#667470` (4,89 et 4,53). Même histoire sur le
  vert avec `#7fa6a0` (3,79) remplacé par `#9fc3bd` (5,31), déjà employé partout ailleurs.
- **Un en-tête collant casse toutes les ancres.** Sans `scroll-padding-top`, « Aller au contenu » —
  dont c'est l'unique raison d'être — déposait le haut du contenu **derrière** la barre de 71 px.
- **Une pastille vide reste une pastille.** Un seul des deux systèmes reçoit « Votre système » :
  l'autre gardait un ovale vert de 24×8 px, visible par tout le monde. `:empty { display: none }`.
- **Une image de partage en chemin relatif n'est résolue par aucun réseau social.** `og:image`
  valait `img/accueil.jpg` : tout lien SkanFact partagé sur WhatsApp, Facebook ou LinkedIn arrivait
  **sans aperçu**. Les adresses de partage sont absolues, et elles changeront le jour du domaine —
  c'est le seul endroit à reprendre, avec le `CNAME`.
- **Une marque de faute qui ne s'efface pas devient un mensonge.** Le champ refusé restait orange une
  fois rempli. Et déplacer le curseur sans rien dire ne renseigne personne : le refus porte une
  phrase (`role="alert"`, `aria-invalid`), pas seulement une couleur.
- **Un tableau comparatif se lit avant d'être expliqué.** La colonne « Essai » alignait quatorze
  « Oui » face aux « — » d'Indépendant : l'offre gratuite paraissait la meilleure. L'explication
  existait — *sous* le tableau, après la mauvaise impression. Elle est passée au-dessus, et la
  colonne porte sa durée dans son en-tête.
- **Deux pages ne peuvent pas répondre deux choses.** « Puis-je l'installer sur deux ordinateurs ?
  Oui » contredisait la page des tarifs, où Indépendant couvre un poste.

L'outil vit dans le dossier de travail (`audit/audit.mjs`, `audit/preuve.mjs`). **Chaque correctif se
prouve en réintroduisant son défaut** : `preuve.mjs` remet les trois défauts mesurables et vérifie
que le contrôle tombe. Un contrôle qui reste vert avec le défaut ne prouve rien.

## Ce qui reste à compléter

- Le **nom de domaine** (`skanfact.tn`) : une fois acheté, ajouter un fichier `CNAME` contenant le
  domaine et faire pointer les DNS vers GitHub Pages. Ajouter alors `robots.txt` et `sitemap.xml`
  (pas avant : ils doivent porter l'adresse définitive). **Reprendre aussi les `og:url` et
  `link rel=canonical` des onze pages** : ils portent l'adresse GitHub Pages, et une canonique qui
  désigne une autre adresse que celle qu'on sert annule le bénéfice du domaine.
- L'adresse **contact@skanfact.tn**, à créer avec le domaine.
- Le **numéro de téléphone**, écrit `+216 XX XXX XXX` partout.
- **Brancher le formulaire** : déployer la route `/contact` du relais (voir `worker/README.md`) puis
  remplir `RELAIS_CONTACT` dans `assets/site.js`. Tant que ce n'est pas fait, le formulaire retombe
  sur le logiciel de messagerie du visiteur — ce qui ne marche pas depuis un webmail sur téléphone.
- Un **compteur de visites** qui respecte la promesse du site : sans cookie et sans bandeau.
  [GoatCounter](https://www.goatcounter.com) (gratuit) ou [Plausible](https://plausible.io). Une
  seule ligne à poser avant `</head>` **des 14 pages**, une fois le compte créé :
  `<script data-goatcounter="https://VOTRECODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>`.
  Sans ça, on ne sait pas quelle page amène les téléchargements — donc on ne sait pas quoi améliorer.
- **Un paiement en ligne** (Paymee, Konnect ou Flouci) : aujourd'hui l'achat passe par une facture et
  un virement, ce qui est correct mais ajoute deux jours entre la décision et la licence.
- Dans les mentions légales : le **numéro au registre national des entreprises** et le **capital
  social**, qui ne figurent pas sur la carte d'identification fiscale.

## Droits

© 2026 SKANCYBER SECURITY SUARL — tous droits réservés. Le contenu de ce dépôt (textes, mise en
page, captures) n'est pas réutilisable sans accord écrit.

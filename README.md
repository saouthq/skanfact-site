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
visite.html             la visite guidée : sept étapes, du devis à la déclaration
excel.html              « SkanFact ou Excel ? » — la page qu'on cherche quand on hésite
nouveautes.html         ce qui a changé, version par version (API GitHub + repli écrit)
guides.html             le sommaire des guides
guide-facture-tunisie.html    ce qu'une facture doit contenir
guide-timbre-fiscal.html      le timbre fiscal, et le piège de la devise
guide-tva-tunisie.html        les taux et la déclaration mensuelle
guide-retenue-source.html     la retenue à la source et son attestation
guide-facture-electronique.html  ce qu'est l'e-facture, et où en est son intégration
guide-devis-proforma.html     devis, proforma, bon de commande, bon de livraison
guide-relance-impaye.html     relancer une facture impayée
robots.txt · sitemap.xml      ce qui guide les moteurs (à régénérer au changement de domaine)
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
  signée, en passant outre un avertissement de sécurité. Beaucoup s'arrêtaient là. Sept étapes, sur des écrans réels,
  dans l'ordre d'une affaire : le devis, la facture, la relance, la trésorerie, la TVA, le dossier du
  comptable, le panneau du matin. Pas une liste de fonctions — il y en a déjà trois pages — mais
  l'**enchaînement**, qui ne se voit nulle part ailleurs.
- **`excel.html`** — le concurrent réel n'est pas un autre logiciel, c'est le classeur. La page dit
  les sept endroits où ça casse, et **ce qu'Excel fait mieux** : un tableau qui donne toujours raison
  à celui qui l'écrit ne se lit pas jusqu'au bout.
- **`nouveautes.html`** — plusieurs versions sortent par semaine et un visiteur n'en voyait rien :
  « Notes de version » l'envoyait sur GitHub, ce qui est technique et le fait quitter le site.
  C'est pourtant la seule preuve **honnête** dont on dispose : pas de témoignage inventé, pas de
  compteur d'utilisateurs — un produit qui bouge toutes les semaines. La liste vient de l'API des
  releases, mais **les six dernières sont écrites en dur dans la page** : une page qui dépend d'une
  API est une page qui peut être vide. Vérifié sur cinq chemins — JavaScript coupé, API réelle,
  quota atteint, liste vide, et des notes contenant du HTML et une URL crue.
  ⚠️ **Conséquence à connaître : le titre d'une entrée du `CHANGELOG.md` devient du texte public.**
  La première phrase en gras de chaque version s'affiche ici telle quelle.
  **Les versions écrites en dur se RÉGÉNÈRENT** : `node outils/nouveautes.mjs` (puis
  `node outils/typo.mjs`) après chaque publication stable. Écrites à la main, elles périmaient à
  chaque publication — le 23/09/2026 un audit extérieur a lu « 10.0.0 » sur un site dont
  l'application était en 10.8.0. Le script applique la même règle de titre que `site.js`, et il
  est idempotent. *(Depuis une session Claude : `NODE_USE_ENV_PROXY=1 node outils/nouveautes.mjs`,
  sinon le `fetch` de Node ne passe pas le mandataire.)*
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

## L'audit du site

```bash
node outils/audit.mjs        # 27 pages × 4 largeurs, dans un vrai Chromium
```

Il sert le site **à la racine**, comme il est servi en vrai depuis que `skanfact.tn` est en
place — jusqu'au 15/09/2026 c'était sous `/skanfact-site/`. Le préfixe n'est pas un détail : la
404 est la seule page qui vise en absolu, et servie sous le mauvais préfixe elle s'affiche
**nue**, sans feuille de style ni logo, sans qu'une erreur soit levée. D'où le contrôle
« la page s'affiche nue », qui mesure que le style a vraiment chargé. Il ouvre ensuite chaque
page à quatre largeurs et **mesure** : contraste texte/fond, boutons dont le fond se confond avec celui de leur bloc,
débordements, titres et descriptions, adresses canoniques, `og:image` en chemin relatif, images
sans texte de remplacement, balisage JSON-LD, liens morts, erreurs JavaScript. Il se termine sur
un code d'erreur s'il reste un constat grave.

**Pourquoi il est dans ce dépôt** : il a vécu trois sessions dans un dossier de travail
temporaire, effacé à chaque fois — donc réécrit de mémoire à chaque fois, et chaque réécriture
reperdait ce que la précédente avait appris. Un contrôle qu'on doit réécrire pour s'en servir
n'est pas un contrôle. (Même raison que `test/e2e/harnais.js` dans le dépôt de l'application.)

Deux pièges qu'il a fallu lui apprendre, et qu'il ne faut pas lui retirer :

- **Les fonds semi-transparents se COMPOSENT.** `.btn-clair` est un blanc à 14 % posé sur le vert
  foncé. Pris tel quel, il se compare à du blanc pur : contraste 1,00, et **cent constats qui
  n'existent pas**. On empile les couches jusqu'au premier fond opaque, comme le fait le
  navigateur. Un dégradé ou une image de fond : on ne peut pas dire honnêtement quelle couleur
  est sous le texte, donc on se tait plutôt que d'inventer un chiffre.
- **Une erreur de chargement n'est pas une erreur de la page.** Le mandataire de l'environnement
  de développement bloque `api.github.com` ; la page le prévoit et retombe sur un lien. Signaler
  ce blocage à chaque passage noierait les vraies erreurs JavaScript.

Il vérifie aussi le **plan du site, dans les deux sens** : ce que `sitemap.xml` annonce doit
exister, porter sa canonique et ne pas être en `noindex` ; et toute page indexable doit y
figurer. Depuis que Google le lit (15/09/2026), une adresse morte devient une erreur qui remonte
dans la Search Console, et une page oubliée du plan est une page que personne ne trouve — sans
qu'aucune erreur ne soit levée nulle part.

Et il se prouve comme le reste : en **remettant** un défaut (remettre `var(--safran)` sur
`.lc .num` fait remonter 24 constats). Un contrôle qui ne peut pas échouer est pire que pas de
contrôle.

## Le menu du téléphone

Signalé par le propriétaire : « il y a trop d'onglets, donc le défilement se passe sur la page
et pas dans le menu burger ». Mesuré : **800 px de menu** sous un en-tête de 72, sur un
téléphone qui en offre 640. Le bas — dont le bouton « Essayer 30 jours » — était hors de
l'écran, et le seul moyen de l'atteindre était de faire défiler **la page**, donc d'emporter
l'en-tête avec elle.

Deux moitiés, et il faut les deux :

- **Le menu se plafonne et défile chez lui.** `max-height: calc(100dvh - var(--h-entete))`,
  `overflow-y: auto`, et surtout `overscroll-behavior: contain` — sans cette dernière, arriver
  au bout du menu passe le doigt à la page derrière, qui se met à défiler sous un menu ouvert.
  `dvh` et pas `vh` : sur un téléphone la barre d'adresse se replie, et `vh` garde la hauteur
  de la page dépliée, soit une centaine de pixels de trop. Une ligne `vh` reste au-dessus comme
  repli.
- **Le sous-menu redevient un volet.** Il était déplié d'office (« rien ne se cache »), ce qui
  était tenable à sept entrées ; à neuf, plus rien ne tenait. Replié, le menu passe de 800 px à
  **360** et tient sur tous les téléphones. Un volet replié n'est pas une page cachée : il porte
  son nom, son chevron, son état au clavier — c'est exactement ce que fait déjà le grand écran.

`--h-entete` existe pour que la hauteur de l'en-tête ne soit écrite qu'une fois : elle sert à la
réserve de défilement des ancres **et** à la hauteur disponible du menu. Deux nombres qui doivent
rester égaux et qui ne se voient pas l'un l'autre finissent par diverger.

`outils/audit.mjs` mesure désormais les deux états, volet replié et volet ouvert, à chaque
largeur de téléphone : le dépassement, le défilement qui fuit vers la page, et le bouton d'essai
atteignable. Prouvé en remettant le défaut — 52 constats remontent.

## Les captures d'écran

Elles sont produites par le dépôt de l'application :

```bash
xvfb-run -a node test/e2e/captures-site.js   # dans saouthq/skanfact
```

Ce parcours charge le jeu d'exemple puis **masque ses deux marqueurs** — le bandeau « jeu
d'exemple » et le tampon sur les documents. Ils n'existent que parce que les données sont fictives :
les montrer sur le site donnerait une image fausse du produit, dans l'autre sens.

Les images sont ensuite réduites en deux tailles et servies avec `srcset` :

```bash
node outils/images.mjs <dossier des PNG> [nom…]     # écrit img/<nom>.jpg et img/<nom>@small.jpg
```

Deux profils, et ils viennent des attributs `width` des pages, pas d'un goût : une capture
d'écran **entière** part à 1400 px (720 en petit), un **panneau recadré** à 900 (620). Les
réduire au même format donnerait soit des panneaux flous, soit des écrans inutilement lourds.
L'outil n'agrandit jamais, et il imprime les dimensions à recopier dans les attributs `width` et
`height`. Aucune dépendance : le redimensionnement se fait dans le Chromium déjà installé, par un
`<canvas>` — le moteur même qui affichera les images.

### Une vignette doit dire ce que son texte dit

Signalé par le propriétaire sur l'accueil : « le texte dit une chose et la photo dit autre
chose ». Trois cas, et ils ne se voient qu'en regardant l'image **à côté** de sa phrase :

- La carte promettait « le jour où le solde passe sous zéro » au-dessus d'une courbe qui ne
  passe **jamais** sous zéro. C'est l'état du stock qui est là maintenant : il montre
  littéralement l'étagère, l'emplacement, le coût moyen et l'article passé sous son seuil.
- La déclaration de TVA était photographiée sur le **mois en cours**, à la moitié : 42 000 DT
  collectés contre 189 240 DT déductibles, soit une entreprise qui aurait acheté quatre fois et
  demie ce qu'elle a vendu. Arithmétiquement juste, commercialement absurde — personne ne se
  reconnaît là-dedans. On photographie un **mois complet**.
- La carte « Votre comptable » promettait « un bouton lui envoie tout » au-dessus de la liste de
  ce qui **manque** au dossier. Elle montre désormais ce que le paquet contient.

Et les textes de remplacement (`alt`) suivent : ils décrivaient l'ancienne image, donc ils
étaient faux — pour la seule personne qui n'a qu'eux.

Règle apprise : une balise `<img>` qui porte ses attributs `width` et `height` **doit** recevoir
`height: auto` en CSS. Sans quoi la largeur se réduit avec l'écran pendant que la hauteur reste
celle de l'attribut, et toutes les captures sont étirées en hauteur — ça ne se voit sur aucune
relecture du code, seulement en mesurant `getBoundingClientRect()` dans un vrai navigateur.

## La séquence « du devis à la facture »

Dix images du **vrai parcours**, prises en pilotant l'application pour de bon :

```bash
xvfb-run -a node test/e2e/sequence-site.js   # dans saouthq/skanfact
```

Elles vivent dans `img/seq-01.jpg` … `seq-10.jpg`, et sont posées sur l'accueil et sur la visite
guidée. **Sans JavaScript, le balisage est une liste de dix figures légendées** — une visite
guidée parfaitement lisible, simplement plus longue ; le script la replie en lecteur. C'est ce
qui garantit aussi que chaque image a un texte de remplacement utile : il est écrit pour être lu
seul.

Pourquoi des images et pas une vidéo : à ce compte-là (dix états d'un écran), une vidéo pèse plus
lourd, ne se lit pas au clavier, et n'a pas de légende. Ici chaque vue porte sa phrase, et une
seule des dix descend du serveur au chargement de la page.

Deux règles que le parcours a apprises, et qui sont écrites dans son code :

- **Filmer à 1440 px, pas à 1280.** Avec la colonne d'aperçu ouverte, les colonnes QTÉ et P.U. de
  l'éditeur tombent à une trentaine de pixels et **tronquent** leur contenu : « 12 » s'affiche
  « 1 ». Une image qui montre une quantité fausse à côté d'un total juste ne se rattrape par
  aucune légende. Constaté sur l'image, pas déduit.
- **Le numéro de version est masqué.** Il se graverait dans des images qui vivront des mois, et
  annoncerait une version périmée à côté de la page Téléchargement, qui, elle, est à jour.

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

Le site a **deux** formulaires — nous écrire (`contact.html`) et demander une clé d'activation
(`acheter.html`) — et ils passent par le **même** gestionnaire : un second, recopié, serait la
garantie que l'un des deux perde un correctif. Il ne connaît d'eux que ce que leur balisage
déclare : `data-envoi` (le genre de message), `data-sujet` (l'objet du message de secours), et
`required` sur les champs exigés. Les intitulés affichés partent avec le message, si bien qu'un
champ ajouté demain arrive tout seul dans l'email **sans redéployer le relais**.

Une seule ligne à remplir dans `assets/site.js` :

```js
var RELAIS_CONTACT = '';     // ← l'adresse du relais, suivie de /contact
```

**Tant qu'elle est vide, le formulaire fonctionne quand même** : il repasse par le logiciel de
messagerie du visiteur, et il le dit. Même chose si le relais répond mal ou met plus de douze
secondes. On ne perd jamais un message parce qu'un service est en panne. Le reste — clés, variables,
vérification — est dans `worker/README.md` du dépôt de l'application.

## La mesure d'audience

Une seule ligne à remplir dans `assets/site.js` :

```js
var MESURE = '';             // ← le nom du compte GoatCounter
```

[GoatCounter](https://www.goatcounter.com) est gratuit pour un site comme celui-ci, ne dépose
aucun cookie, ne conserve pas les adresses IP et n'attribue aucun identifiant : il compte des
pages vues. Créer le compte prend deux minutes ; le nom choisi est ce qui se colle ci-dessus.

**Tant que la ligne est vide, aucune requête n'est faite** vers qui que ce soit — un site ne doit
pas se mettre à appeler quelqu'un d'autre parce qu'on a oublié de finir un réglage. Et « Do Not
Track » est respecté : le compteur n'est alors pas chargé du tout.

**Le piège, et il est important** : la page Confidentialité promet « aucun outil de mesure
d'audience ». Un réglage qui rend une phrase de confidentialité fausse est un défaut, pas une
imprécision. Les deux paragraphes concernés portent donc `data-mesure="non"` et
`data-mesure="oui"`, et **c'est le même code qui décide** lequel s'affiche et si le compteur
tourne. Ils ne peuvent donc pas se contredire — y compris sans JavaScript, où il n'y a pas de
compteur et où c'est la version « aucun » qui s'affiche.

## Le référencement — ce qui a été fait, et la règle

Le site expliquait bien le produit à quelqu'un qui connaissait déjà la marque. Il ne répondait à
**aucune** question de recherche.

- **Les titres portaient la marque d'abord.** « Tarifs — SkanFact », « Questions fréquentes —
  SkanFact » : aucun ne contenait « logiciel de facturation », la phrase que les gens tapent.
  La requête vient maintenant en premier, la marque à la fin.
- **`robots.txt` et `sitemap.xml`** existent. Le sitemap **exclut les pages en `noindex`** :
  les annoncer tout en demandant de ne pas les indexer serait contradictoire. Il se régénère à
  la main ou par `outils-bascule-domaine.sh` le jour du domaine.
- **Données structurées** : `Organization` + `SoftwareApplication` sur l'accueil, `BreadcrumbList`
  sur chaque page intérieure, `FAQPage` sur `questions.html` — et sur elle seule, deux pages qui
  le portent se faisant concurrence. Le balisage FAQ est **extrait du HTML visible**, jamais
  réécrit à côté : une réponse enjolivée dans le balisage est une pénalité, pas une optimisation.
- **Sept guides** (`guide-*.html`) répondent aux questions informationnelles — mentions d'une
  facture, timbre fiscal, TVA, retenue à la source, facture électronique, les quatre pièces qui
  entourent la facture, et la relance d'un impayé. Chacun porte un balisage `Article` avec une
  date **visible** : une date qui ne vit que dans le balisage est une date que personne ne peut
  vérifier, ni un lecteur ni un moteur. L'auteur déclaré est la société, jamais une personne
  inventée — c'est exactement ce qu'une vérification cherche.

**La règle à ne pas casser : une page = une requête.** `tunisie.html` est une page PRODUIT (« SkanFact
applique ces règles ») ; les guides sont INFORMATIONNELS (« voici comment la règle marche »). Deux
intentions différentes, donc deux pages. Les confondre, c'est se faire concurrence à soi-même et ne
monter sur aucune des deux. Les deux se renvoient l'une à l'autre, dans les deux sens.

**Et la règle de fond sur le contenu fiscal :** on n'affirme QUE ce que l'application affirme déjà,
avec la même réserve qu'elle (`À VÉRIFIER avec ton comptable`, visible sur chaque guide). Aucun
article de code invoqué, aucune échéance, aucune pénalité chiffrée — ce sont exactement les éléments
qu'on ne peut pas sourcer, et se tromper dessus coûterait plus cher que tout le trafic gagné.

## Le bouton fantôme — un défaut que le contraste ne voit pas

Huit boutons `btn-vert` posés sur des blocs vert foncé : **fond identique à celui du conteneur**.
Le texte était blanc, donc parfaitement lisible — le contrôle de contraste passait sans rien dire.
Mais un bouton dont le fond se confond avec son bloc et qui n'a pas de bordure n'est plus un
bouton : rien ne dit qu'on peut cliquer. C'est la règle « un bouton sans bordure ni couleur n'est
pas un bouton », apprise sur l'application du cabinet, jamais portée au site.

La règle : **sur un fond vert foncé, le bouton principal est safran et le second clair** — c'est
déjà ce que fait `.bande-fin`. `btn-vert` et `btn-creux` sont faits pour un fond clair.

L'audit mesure désormais, pour chaque `.btn`, l'écart entre son fond composé et celui de son
conteneur, et le refuse sous 18 quand il n'a pas non plus de bordure visible. Prouvé en
réintroduisant un `btn-vert` sur un bloc vert : le contrôle tombe.

## Le site et l'application dérivent — comment le vérifier

Le 14/09/2026, l'application est passée en **8.0.0** et le site vendait encore le modèle d'avant.
`src/licence.js` fait foi : la clé porte l'**offre** et le **matricule fiscal**, et rien d'autre.

Ce qui était faux, et qu'il ne faut pas réintroduire :

- **« 1 poste / 3 postes »**, présent à cinq endroits plus les données structurées. Cette notion
  n'existe nulle part dans la clé. Une licence est rattachée au matricule fiscal de la société : elle
  s'active sur ses postes et refuse de s'activer sur le dossier d'une autre société.
- **« — » sur les cinq modules réservés à Entreprise.** Le code dit exactement l'inverse :
  `reserves` ferme la **création**, *jamais la lecture*. En Indépendant, Achats, Stock,
  Immobilisations, Trésorerie et Paie restent lisibles, imprimables et exportables. Le « — » disait
  « vous n'avez pas ça » et jetait l'argument « jamais de données en otage » — celui qui vend.
  D'où la cellule `.compare .lecture`, qui n'est ni un oui ni un non.
- **Le numéro de version de repli** du pied, resté à 7.29.0 alors que la 8.0.0 était publiée.

Le contrôle qui prend dix secondes, à refaire après chaque version majeure de l'application :

```bash
curl -s https://api.github.com/repos/saouthq/skanfact/releases/latest | grep tag_name
grep -rn "poste\|Lecture seule\|data-version" *.html | head
```

Règle apprise : **le site est une promesse, le code est la vérité.** Quand l'application change de
modèle commercial, la page Tarifs ment jusqu'à ce que quelqu'un aille lire `src/licence.js`.

## L'audit commercial du 23/09/2026 — ce qui était vrai, et ce qui ne l'était pas

Skander a donné le site à une IA en lui demandant de le lire en visiteur ordinaire. Quarante-sept
sections. Chaque constat a été relu dans le code AVANT d'être retenu (règle du dépôt de
l'application : *un audit qui invente une qualité peut inventer un défaut*).

**Faux — l'IA a lu le HTML brut, sans JavaScript :**

- « contradiction carte bancaire / Konnect » : les deux paragraphes `data-paiement="non|oui"` sont
  dans la page, et `site.js` n'en montre qu'un selon ce que répond `GET /v1/achat/tarifs`. Un
  visiteur n'en voit jamais deux. Même mécanisme que `data-mesure` pour GoatCounter, que l'IA a
  aussi pris pour une contradiction.
- « version 10.0.0 » : le numéro vient de l'API GitHub. Seule la liste de repli de `nouveautes.html`
  était périmée — vrai à moitié, donc, et c'est ce qui a fait écrire `outils/nouveautes.mjs`.
- « placeholders dans les mentions légales » : il n'y en a pas. Les quatre `À COMPLÉTER` sont dans
  `conditions-vente.html`, en `noindex` et liée nulle part, et ils attendent Skander (`A-FAIRE.md`
  du dépôt de l'application).

**Vrai, et corrigé :**

- « Le plus pris » sur l'offre Indépendant sans un seul chiffre pour le prouver → « Pour facturer
  seul ». **Un ruban affirme ; il se démontre ou il se retire.**
- « Ce qui n'existe nulle part ailleurs », « qu'aucun autre logiciel ne fait » → des phrases
  vérifiables (« Notre différence », « le lien entre les deux applications »). Un absolu qu'on ne
  peut pas prouver coûte plus qu'il ne vend.
- « Sept écrans » et « dix écrans » sur la même page : la visite compte sept ÉTAPES, la séquence
  filmée dix écrans. Les deux mots vivent désormais chacun à sa place, sur les huit pages qui les
  citent.
- Les phrases de `tarifs.html` sur le règlement étaient écrites en dur sur le virement, pendant
  qu'`acheter.html` avait déjà ses jumelles : le jour où la carte s'ouvre, Tarifs aurait menti.
  Les jumelles sont posées partout où le mode de règlement est nommé — et la phrase sous le bouton
  d'achat suit le mode choisi (`data-regl-aide`), parce que « rien n'est prélevé » est vrai par
  virement et faux au clic qui ouvre Konnect.
- Le héros vendait le mécanisme (« un fichier chiffré part chez votre cabinet ») avant le
  bénéfice. Il dit maintenant ce qu'on fait avec, l'étiquette porte « 30 jours gratuits » au-dessus
  de la ligne de flottaison, le second bouton montre le logiciel, et la bande sous le héros porte
  quatre BÉNÉFICES au lieu de quatre faits. Une section « Avant, et avec SkanFact » suit les
  quatre cartes — six lignes, chacune un écran réel.
- Le prix mensuel et le TTC : Tarifs les avait ; l'accueil ne montrait que le HT.
- L'avertissement Windows/macOS était expliqué en petit SOUS les étapes d'installation ; il est
  expliqué AVANT, dans un encadré — un avertissement se lit avant le geste (règle 9.4.2 de
  l'application).
- La FAQ répondait aux questions qu'on se pose ; elle répond maintenant aussi à celles qui font
  renoncer : récupérer ses données, la fin de la licence, changer d'offre, imprimer et envoyer,
  démarrer depuis Excel (sans promettre un import qui n'existe pas), et comment on est accompagné.
- Chaque guide propose une fois, au milieu, après avoir répondu (`.guide-cta`) — jamais avant.
- « Demander une démonstration » existait pour les cabinets seulement ; `contact.html?demo=1`
  coche la case pour tout le monde.

**Vrai, et pas à nous :** témoignages et chiffres réels (on n'en invente pas), la signature des
exécutables, GoatCounter, le RNE et le capital, un lien de parrainage par cabinet mesurable — tout
est dans `A-FAIRE.md`, côté application. **Refusé :** une page « Pourquoi SkanFact ? » de plus (la
bande et « Avant / avec » font ce travail sur l'accueil, et une page neuve, c'est un sitemap et
quarante en-têtes de plus).

Règle apprise : **une IA qui lit le site le lit sans JavaScript**, comme un robot. Ce que le
script cache reste dans la page, et un lecteur de ce genre y voit deux vérités. Les jumelles
restent le bon mécanisme (la page se tient sans script) — mais on sait maintenant qui les lira
toutes les deux, et on ne s'étonne plus du constat.

## Trois regards, le 23/09/2026 — expert-comptable, gérant de PME, commercial

Trois lectures indépendantes, chacune dans la peau d'un visiteur, et **avec** JavaScript cette
fois. Chaque « c'est faux » a été revérifié dans le code des applications avant d'être corrigé. Le
rapport complet a été remis à Skander ; voici ce qu'il a changé ici.

**Le plus grave : la confidentialité disait le contraire du code.** « Pendant l'essai, aucune
identité ne part », « Rien ne nous dit si vous ouvrez le logiciel » : faux depuis la 8.4.0 de
l'application. Les deux applications signalent leur présence toutes les quatre heures, essai
compris — clé, identifiant du poste, **nom de l'ordinateur**, système, version. Les trois lectures
l'ont trouvé chacune de leur côté. `confidentialite.html`, `vos-donnees.html` (bloc
`#signal-presence`), la FAQ et l'accueil le disent désormais champ par champ ; la politique porte
sa date de modification.

**Faux, et corrigé :**

- « Un ZIP ordinaire que votre comptable ouvre même sans SkanFact » : vrai seulement sans cabinet
  appairé. Appairé, le paquet est chiffré pour lui seul. Cinq pages nuancées.
- « La licence part de la date d'activation » (acheter.html et conditions-vente.html) : elle part de
  l'émission, c'est-à-dire du paiement.
- L'accueil vendait encore Achats avec l'offre Entreprise, et la FAQ, Tunisie et le guide annonçaient
  des taux de retenue de 1,5 à 15 % — l'application en propose onze, de 0,5 à 25 %, plus la saisie
  libre.
- La facture électronique « en cours d'intégration » : rien n'est construit. Quatre pages, et la
  phrase « portent toutes les mentions » retirée.
- Le matricule « exigé, l'application refuse » : c'est un avertissement.
- L'application du cabinet « ne renvoie rien » : elle renvoie des questions et la clôture.
- L'empreinte « garantit que le dossier vient bien de lui » : elle garantit que les pièces ne
  partent que chez le cabinet ; c'est la signature du client qui prouve l'origine.
- Le quota « sur les dossiers que vous choisissez » : il porte sur tous.
- La lecture de photo « éteinte par défaut » : elle est en pause.
- Un iPhone s'annonce « like Mac OS X » : la page de téléchargement lui montrait la carte Mac comme
  « Votre système ». Un téléphone est maintenant reconnu en premier, et reçoit un bloc « envoyez-vous
  le lien » (email ou WhatsApp) au lieu d'un installateur qu'il ne peut pas ouvrir.

**Ce qui vendait mal, et corrigé :** le tableau des offres sur téléphone ne montrait que la colonne
Essai (retirée sous 640 px) ; « Option » sans explication ; « C'est vous [qui vous trompez] » sur la
page Excel ; les titres de `comptables.html` et `contact.html` sans mot recherché ; le haut de la
page Cabinet qui proposait d'installer un logiciel non signé avant de proposer une démonstration ;
« Pour facturer seul », qui ne disait pas s'il s'agissait d'un salarié ou d'un poste ; quatre
questions de FAQ qui manquaient (deux sociétés, le comptable sans SkanFact, la reprise d'un autre
logiciel, les données des clients chez le cabinet) ; l'avis de l'Ordre, attendu, désormais dit ; la
liasse, qui n'a encore été confrontée à aucune liasse réelle, désormais dite ; un champ facultatif
« Comment nous avez-vous connus ? » dans les deux formulaires (`site.js` collecte maintenant les
`select`).

**Pas à nous** (dans `A-FAIRE.md`, côté application) : les conditions de vente, la signature des
exécutables, un téléphone ou WhatsApp, le nom et la photo du fondateur, un témoignage réel du
cabinet pilote, GoatCounter, et deux décisions de produit — envoyer ou non le nom de l'ordinateur,
et faire partir la licence du paiement ou de la fin de l'essai.

Règle apprise : **une page de confidentialité se relit contre le code à chaque version qui ajoute
une sortie réseau.** Le signal de présence est arrivé en 8.4.0 ; la page, écrite avant, a menti
pendant vingt versions sans que personne la relise.

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

- Le **nom de domaine** `skanfact.tn` est **acheté chez OVH** (commande 258885149 du 14/09/2026,
  avec la zone DNS, l'hébergement et Zimbra pour `contact@skanfact.tn`) et attend sa livraison.
  Le jour où il répond, la bascule se fait dans cet ordre — **et pas avant**, parce qu'un fichier
  `CNAME` posé trop tôt fait cesser de servir `saouthq.github.io` alors que le domaine ne répond pas
  encore :

  1. chez OVH, faire pointer le domaine vers GitHub Pages — les adresses exactes sont sur
     [la page de GitHub](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site),
     qui fait foi ; **ne toucher ni aux `MX` ni au `TXT` SPF**, sinon `contact@skanfact.tn`
     (Zimbra) cesse de recevoir, et ça ne se voit pas tout de suite ;
  2. vérifier que le domaine répond **avant** de continuer (`dig skanfact.tn +short`, ou simplement
     l'ouvrir dans un navigateur) ;
  3. puis, dans le dépôt : `./outils-bascule-domaine.sh . skanfact.tn`

  Le script pose le fichier `CNAME`, réécrit les `og:url`, `og:image` et `link rel=canonical` des
  pages, reprend les chemins **absolus** de `404.html`, le lien à remettre aux clients dans
  `comptables.html`, et écrit `robots.txt` et `sitemap.xml` avec l'adresse définitive (les pages
  en `noindex` en sont exclues — les annoncer tout en demandant de ne pas les indexer serait
  contradictoire). Il a été vérifié sur une copie : 16 pages servies, 13 adresses au sitemap,
  aucune trace de l'ancienne adresse, audit à zéro constat.

  **L'ordre compte.** Le fichier `CNAME` fait cesser de servir `saouthq.github.io`, qui redirige
  alors vers le domaine : posé avant que le DNS réponde, il met le site hors ligne. Enfin, cocher
  « Enforce HTTPS » dans les réglages Pages du dépôt une fois le certificat émis (quelques minutes
  à quelques heures).

  GitHub redirige ensuite `saouthq.github.io/skanfact-site/` vers le domaine : ce qui aura été
  indexé d'ici là n'est pas perdu.
- L'adresse **contact@skanfact.tn**, à créer avec le domaine.
- Le **numéro de téléphone**, écrit `+216 XX XXX XXX` partout.
- **Brancher le formulaire** : déployer la route `/contact` du relais (voir `worker/README.md`) puis
  remplir `RELAIS_CONTACT` dans `assets/site.js`. Tant que ce n'est pas fait, le formulaire retombe
  sur le logiciel de messagerie du visiteur — ce qui ne marche pas depuis un webmail sur téléphone.
- **Inscrire le site à la Search Console de Google** (et à Bing Webmaster Tools) et y soumettre
  `sitemap.xml`. Sans ça, l'indexation prend des semaines au lieu de jours, et surtout on ne voit
  **jamais** sur quelles requêtes le site sort ni à quelle position — c'est-à-dire qu'on travaille
  le référencement à l'aveugle. À faire une fois le domaine branché, avec l'adresse définitive.
- **Créer le compte GoatCounter** (gratuit, deux minutes) et coller son nom dans `var MESURE`
  de `assets/site.js` — voir « La mesure d'audience » plus haut. Le mécanisme est posé et la page
  Confidentialité s'accorde toute seule ; il ne manque que le compte. Sans ça, on ne sait pas
  quelle page amène les téléchargements, donc on ne sait pas quoi améliorer.
- **Un paiement en ligne** (Konnect est celui envisagé, ou Paymee ou Flouci) : aujourd'hui l'achat passe par la
  page `acheter.html`, une facture et
  un virement, ce qui est correct mais ajoute deux jours entre la décision et la licence.
- Dans les mentions légales : le **numéro au registre national des entreprises** et le **capital
  social**, qui ne figurent pas sur la carte d'identification fiscale.

## Droits

© 2026 SKANCYBER SECURITY SUARL — tous droits réservés. Le contenu de ce dépôt (textes, mise en
page, captures) n'est pas réutilisable sans accord écrit.

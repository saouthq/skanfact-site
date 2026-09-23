# Site de SkanFact — consignes pour Claude

Le site public de SkanFact (`https://skanfact.tn`). Propriétaire : Skander Ben Amor (saouthq), qui
communique en français, tutoiement, et **ne tape pas de commandes** : Claude fait le travail en
autonomie — modifications, commit, push, vérifications. L'application elle-même vit dans
`saouthq/skanfact` ; son `CLAUDE.md` y porte les règles du logiciel.

Le `README.md` décrit ce qu'est le site, page par page. Ce fichier-ci ne porte que les règles de
travail — ce qu'il ne faut pas casser.

## La règle qui coûte cher si on l'oublie

**Toute page ajoutée, renommée ou supprimée impose de régénérer `sitemap.xml`.**

```sh
sh outils-sitemap.sh .
```

Et c'est à faire **dans le même commit** que la page, jamais « plus tard ».

Pourquoi ça compte : une page absente du sitemap est en ligne et parfaitement visible — elle
fonctionne, elle s'affiche, rien ne la signale. Elle est simplement trouvée par les moteurs
beaucoup plus tard, ou pas du tout. C'est un fichier engendré une fois qui dérive ensuite en
silence, et c'est très exactement le genre de défaut que ce projet a appris à traquer : rien ne
plante, rien n'apparaît nulle part, et on ne s'en aperçoit que des mois après.

Le script exclut de lui-même les pages en `noindex` et la 404 : les annoncer dans un sitemap tout
en demandant de ne pas les indexer serait contradictoire.

`robots.txt` n'a pas besoin d'être régénéré — il ne porte que l'adresse du sitemap, qui ne change
pas.

## Ce qui est automatique, et ce qui ne l'est pas

**Automatique :** GitHub Pages sert directement la branche `main`. Un push met le site à jour tout
seul en une minute environ. Il n'y a aucun workflow, aucune étape de construction, rien à lancer.

**Pas automatique :** le sitemap (ci-dessus), et **la liste des versions écrite dans
`nouveautes.html`** — `node outils/nouveautes.mjs` après chaque publication stable de l'application,
puis `node outils/typo.mjs`. Le numéro du pied et de Téléchargement, lui, vient de l'API GitHub et n'a
rien à faire ; la liste de repli, si. Une liste écrite à la main a affiché 10.0.0 pendant huit
versions (voir README, « L'audit commercial du 23/09/2026 »).

## Le domaine

Le site vit sur **`skanfact.tn`** depuis le 15/09/2026. Trois conséquences à ne pas défaire :

- **`CNAME` doit rester à la racine**, avec `skanfact.tn` dedans. C'est le seul fichier que GitHub
  Pages lit pour savoir quel domaine servir ; le supprimer renvoie le site sur
  `saouthq.github.io/skanfact-site/` et casse toutes les adresses partagées.
- **Les adresses absolues** (`og:url`, `og:image`, `rel="canonical"`) pointent sur
  `https://skanfact.tn/`. Une canonique qui désigne une autre adresse que celle qu'on sert annule
  le bénéfice du domaine, **et rien ne le signale**. Une page neuve se copie donc sur une page
  existante, jamais sur un modèle d'avant la bascule.
- **`404.html` porte des chemins ABSOLUS depuis la racine** (`/assets/style.css`, et non
  `assets/style.css`). C'est nécessaire : elle est servie pour n'importe quelle adresse manquante,
  à n'importe quelle profondeur. Des chemins relatifs la laisseraient sans style ni logo — sur la
  seule page où le visiteur est déjà perdu.

`outils-bascule-domaine.sh` a fait ce déménagement et **ne resservira jamais**. Il est gardé comme
trace de ce qui a été touché, pas comme outil.

## Écrire dans ce site

- **Pas de framework, pas d'étape de construction, aucune dépendance.** Du HTML, une feuille de
  style, un petit fichier JavaScript. On ouvre un fichier dans un navigateur et on voit le site —
  même philosophie que l'application.
- **Le contenu fiscal engage.** Les guides parlent de TVA, de timbre fiscal et de retenue à la
  source : tout chiffre ou toute règle se signale par « À VÉRIFIER avec ton comptable », comme dans
  l'application.
- **Ne jamais réintroduire « SKANCYBER » ni le matricule dans le contenu des pages** au-delà des
  mentions légales, où l'éditeur doit légalement figurer.
- **Toute phrase qui nomme le mode de règlement vit en DEUX jumelles** `data-paiement="non"` et
  `data-paiement="oui" hidden` (`acheter.html`, `tarifs.html`) : c'est `site.js` qui montre la bonne,
  d'après ce que répond l'API. Une phrase écrite en dur sur le virement ment le jour où la carte
  s'ouvre. Même règle pour `data-mesure` (GoatCounter) et `data-regl-aide` (sous le bouton d'achat).
  Et `[hidden] { display: none !important }` est global dans `style.css` : un `display` posé un jour
  sur `.chapeau` ferait sinon réapparaître les deux jumelles, en silence.
- **Rien d'absolu qu'on ne peut pas prouver** : pas de « le plus pris » sans chiffre, pas de « nulle
  part ailleurs », pas de témoignage ni de compteur inventé. Un audit extérieur l'a reproché le
  23/09/2026, et il avait raison.
- **Les prix affichés sur `tarifs.html` doivent correspondre à ceux de l'application** (offres
  Indépendant et Entreprise). Deux endroits qui annoncent deux prix, c'est le genre de
  contradiction qu'un client voit avant nous.

- **Ce qui sort de l'ordinateur se décrit champ par champ, et se relit contre le code.** Le
  signal de présence (8.4.0 de l'application) a vécu vingt versions sous une page qui affirmait
  « rien ne part ». Toute version de l'application qui ajoute, retire ou change un champ envoyé à
  un serveur (`annoncerPlateforme` dans les deux `main.js`) impose de relire `confidentialite.html`,
  `vos-donnees.html#signal-presence`, la FAQ « Envoyez-vous quelque chose sur internet ? » et le
  bloc « Le code est public » de l'accueil.

## Vérifier avant de pousser

Il n'y a pas de tests automatiques ici. Ce qui tient lieu de contrôle :

1. `grep -rl 'saouthq.github.io' *.html` doit ne **rien** rendre.
2. Toute page neuve doit être au `sitemap.xml` (donc : script régénéré).
3. La page ouverte dans un navigateur, à **400 px de large** aussi : le site se lit surtout au
   téléphone.

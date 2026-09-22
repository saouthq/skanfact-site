# Les bancs de captures

Ces trois programmes lancent **SkanFact** et **SkanFact Cabinet**, les photographient, et
produisent les images de ce site.

```
npm run captures            # l'application entreprise : 10 écrans + 12 recadrages
npm run captures:cabinet    # le Cabinet : portefeuille, tenue, recadrages
npm run captures:sequence   # le parcours devis → facture → PDF, en dix images
```

Les PNG atterrissent dans `dist-captures/` (ignoré par Git). On les transforme ensuite :

```
node outils/images.mjs dist-captures/site      # JPEG 4:4:4 + WebP, deux tailles, manifeste
node outils/picture.mjs                        # les pages passent en <picture>
node outils/audit.mjs                          # 28 pages × 4 largeurs, doit finir à 0/0
```

## Pourquoi ils vivent ici

Ils ont vécu dans `test/e2e/` du dépôt de l'application jusqu'au **22/09/2026**. Ils ont déménagé
sur décision de Skander : **ce dépôt ne doit jamais écrire dans celui de l'application**, qui est
tenu par une autre session. Les images du site sont l'affaire du site.

`app.js` trouve le dépôt de l'application et lui emprunte son harnais (`test/e2e/harnais.js`) —
en **lecture seule**. Il ne le copie pas : une copie divergerait au premier ajustement, et c'est
la faute que ce projet réapprend depuis la 6.8.0. Si le dépôt n'est pas rangé à côté de celui-ci :

```
SKANFACT_APP=/chemin/vers/skanfact npm run captures
```

La sortie par défaut est `dist-captures/` **de ce dépôt**. Le harnais de l'application propose la
sienne (`dist-e2e/` chez elle) : on ne l'utilise pas, ce serait écrire chez quelqu'un d'autre.

## Ce qu'ils garantissent

Chaque banc **échoue** plutôt que de rendre une image fausse : un panneau annoncé et introuvable,
un onglet qui n'existe pas, un filtre posé sur le mauvais journal arrêtent le parcours. Une image
silencieusement périmée est pire qu'une image absente.

Ils masquent aussi ce qui n'existe que parce que la machine du test est une installation neuve sur
Linux : le bandeau du jeu d'exemple, la pastille « exemple » de chaque ligne, le tampon EXEMPLE,
le message passager, le numéro de version, la pastille d'essai — et les **barres de défilement**,
qui étaient sur une vingtaine de captures avant le 22/09/2026.

Enfin, un recadrage tombe sur une **limite de ligne** (`hauteurNette`) : couper à une hauteur
ronde tranche la dernière ligne d'un tableau en deux, et l'image donne l'impression d'un bug.

## Le fichier `branche-application.patch`

L'historique complet de ce qui vivait sur la branche `claude/sharp-tesla-t7f94u` du dépôt de
l'application, avant sa suppression : trois commits, `git am` les rejoue tels quels. Gardé pour
que rien ne soit perdu si l'autre session veut reprendre ces correctifs de son côté.

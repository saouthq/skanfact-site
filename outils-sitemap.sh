#!/bin/sh
# Régénère sitemap.xml à partir des pages réellement présentes.
#
# À lancer dans le MÊME commit que toute page ajoutée, renommée ou supprimée — voir CLAUDE.md.
#
# Pourquoi il existe : une page absente du sitemap est en ligne et parfaitement visible. Elle
# fonctionne, elle s'affiche, rien ne la signale — elle est simplement trouvée par les moteurs
# beaucoup plus tard, ou pas du tout. C'est un fichier engendré une fois qui dérive ensuite en
# silence, et ça ne se voit jamais en regardant le site.
#
# Il est né le 15/09/2026 en sortant la partie sitemap de outils-bascule-domaine.sh, qui était un
# script à usage unique : la génération, elle, doit resservir à chaque page ajoutée.
#
#   sh outils-sitemap.sh .
set -e
DOSSIER="${1:-.}"
DOMAINE="${2:-skanfact.tn}"
[ -d "$DOSSIER" ] || { echo "usage: outils-sitemap.sh <dossier> [domaine]"; exit 1; }
cd "$DOSSIER"

NOUVEAU="https://$DOMAINE/"

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  # index d'abord, puis les autres par ordre alphabétique ; les pages en noindex sont exclues,
  # les annoncer dans un sitemap tout en demandant de ne pas les indexer est contradictoire.
  for f in index.html $(ls *.html | grep -v '^index.html$' | grep -v '^404.html$'); do
    grep -q 'name="robots" content="noindex"' "$f" && continue
    case "$f" in index.html) u="$NOUVEAU" ;; *) u="$NOUVEAU$f" ;; esac
    printf '  <url><loc>%s</loc></url>\n' "$u"
  done
  echo '</urlset>'
} > sitemap.xml

PAGES=$(ls *.html | wc -l | tr -d ' ')
AU_SITEMAP=$(grep -c '<url>' sitemap.xml)
echo "pages HTML   : $PAGES"
echo "au sitemap   : $AU_SITEMAP  (404 et pages noindex exclues)"

# Le contrôle qui rattrape l'oubli d'hier autant que celui d'aujourd'hui : toute page indexable
# doit être dans le sitemap. Sans lui, ce script se contenterait d'écrire un fichier sans jamais
# dire s'il est complet.
MANQUE=0
for f in *.html; do
  [ "$f" = "404.html" ] && continue
  grep -q 'name="robots" content="noindex"' "$f" && continue
  [ "$f" = "index.html" ] && continue
  grep -q "<loc>$NOUVEAU$f</loc>" sitemap.xml || { echo "MANQUE au sitemap : $f"; MANQUE=1; }
done
[ "$MANQUE" = "0" ] || exit 1
echo "aucune page indexable ne manque."

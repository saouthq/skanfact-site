#!/bin/sh
# Bascule le site de saouthq.github.io/skanfact-site/ vers un domaine à soi.
#
# Script à UN SEUL USAGE : une fois la bascule faite, il ne sert plus à rien et peut être
# supprimé. Il existe parce que la bascule se fait à la main en six endroits, dont deux pièges
# qui ne se voient pas :
#   - la 404 porte des chemins ABSOLUS (elle est servie pour n'importe quelle adresse manquante) ;
#     les oublier la laisse sans style ni logo, sur la seule page où le visiteur est déjà perdu ;
#   - une canonique qui désigne une autre adresse que celle qu'on sert annule le bénéfice du
#     domaine, et rien ne le signale.
# Vérifié sur une copie du site le 14/09/2026 : 16 pages servies, 13 adresses au sitemap,
# aucune trace de l'ancienne adresse, et l'audit repasse à zéro constat.
# À NE LANCER QU'APRÈS que le DNS pointe sur GitHub : le fichier CNAME fait cesser de servir
# l'ancienne adresse, qui redirige alors vers un domaine qui ne répond pas encore.
set -e
DOSSIER="$1"
DOMAINE="${2:-skanfact.tn}"
[ -d "$DOSSIER" ] || { echo "usage: bascule.sh <dossier> [domaine]"; exit 1; }
cd "$DOSSIER"

ANCIEN="https://saouthq.github.io/skanfact-site/"
NOUVEAU="https://$DOMAINE/"

# 1. Le fichier que GitHub Pages lit pour savoir quel domaine servir.
printf '%s\n' "$DOMAINE" > CNAME

# 2. Les adresses absolues : og:url, og:image, canonical, et le lien à remettre aux clients.
#    Une canonique qui désigne une autre adresse que celle qu'on sert annule le bénéfice du domaine.
for f in *.html; do
  [ "$f" = "404.html" ] && continue
  sed -i "s|$ANCIEN|$NOUVEAU|g" "$f"
done

# 3. La 404 porte des chemins ABSOLUS depuis la racine du site — c'est nécessaire, elle est servie
#    pour n'importe quelle adresse manquante. Sur un domaine à soi, la racine n'est plus
#    /skanfact-site/ mais /.
sed -i "s|/skanfact-site/|/|g" 404.html

# 4. robots.txt et sitemap.xml : ils doivent porter l'adresse définitive, donc maintenant.
cat > robots.txt <<ROBOTS
User-agent: *
Allow: /

Sitemap: ${NOUVEAU}sitemap.xml
ROBOTS

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

echo "CNAME      : $(cat CNAME)"
echo "pages      : $(ls *.html | wc -l | tr -d ' ') fichiers"
echo "sitemap    : $(grep -c '<url>' sitemap.xml) adresses"
echo "restes     : $(grep -rho 'saouthq.github.io[^\"<) ]*' *.html robots.txt sitemap.xml | sort -u | tr '\n' ' ')"

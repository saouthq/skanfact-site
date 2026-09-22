// Envelopper chaque capture dans un `<picture>` et remettre ses mesures d'aplomb.
//
//   node outils/picture.mjs            — réécrit les pages
//   node outils/picture.mjs --essai    — dit ce qu'il changerait, sans rien écrire
//
// Trois défauts, tous MESURÉS le 22/09/2026, que ce fichier corrige et empêche de revenir :
//
//   1. Aucune page ne proposait le WebP, alors qu'il pèse 40 à 49 % de moins À NETTETÉ ÉGALE
//      (vérifié en agrandissant la même zone : les halos du JPEG autour des lettres ont disparu).
//      Un `<picture>` le propose et garde le JPEG en repli : rien ne casse chez personne.
//   2. Des `srcset` annonçaient des tailles que les fichiers n'avaient pas — `c-journal.jpg` était
//      donné pour 900 w alors qu'il fait 1267 px. Un navigateur ne peut pas choisir juste avec un
//      catalogue faux. Les descripteurs viennent désormais du MANIFESTE, jamais d'une saisie.
//   3. Les dix images de la séquence n'avaient AUCUN srcset : un téléphone téléchargeait 1440 px
//      pour les afficher sur 346. C'est la plus grosse dépense inutile du site.
//
// Les attributs qu'on ne touche pas (alt, loading, fetchpriority, decoding, class) restent sur
// le `<img>`, qui reste le seul élément que le CSS et les tests visent.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const essai = process.argv.includes('--essai');
const tailles = JSON.parse(await readFile(path.join(RACINE, 'img', 'tailles.json'), 'utf8'));

// La largeur d'affichage, en pixels CSS. Elle décide du `sizes`, et donc de la variante que le
// navigateur ira chercher. On garde celle que la page déclarait déjà quand elle en avait une :
// elle a été mesurée dans un vrai navigateur, et la réinventer ici la ferait diverger.
const SIZES_DEFAUT = '(max-width: 900px) 100vw, 1136px';

let touchées = 0, enveloppées = 0, corrigées = 0;
for (const f of (await readdir(RACINE)).filter(x => x.endsWith('.html')).sort()) {
  const avant = await readFile(path.join(RACINE, f), 'utf8');
  let après = avant;

  // IDEMPOTENCE. Lancé deux fois — ce qui arrive dès qu'on recapture — la première version
  // enveloppait un `<img>` DÉJÀ dans un `<picture>` : 57 `<picture>` imbriqués, que le navigateur
  // tolère en silence. On déballe donc d'abord, systématiquement, puis on remballe. Un outil qui
  // n'est juste qu'au premier lancement n'est pas un outil.
  // On déballe de l'intérieur vers l'extérieur, donc en BOUCLE : un `replace` ne passe qu'une
  // fois, et il laisserait la coquille extérieure d'un emballage double.
  for (let garde = 0; garde < 8; garde++) {
    const avantDéballage = après;
    après = après.replace(/[ \t]*<picture>\s*(?:<source\b[^>]*>\s*)*(<img\b[^>]*>)\s*<\/picture>[ \t]*\n?/g,
      (tout, img) => {
        const ind = (/^([ \t]*)/.exec(tout) || ['', ''])[1];
        return `${ind}${img}\n`;
      });
    if (après === avantDéballage) break;
  }

  après = après.replace(/(\s*)<img\b([^>]*)>/g, (tout, blanc, attrs) => {
    const lire = (k) => { const m = new RegExp(`${k}="([^"]*)"`).exec(attrs); return m ? m[1] : null; };
    const src = lire('src');
    if (!src || !src.startsWith('img/')) return tout;              // le logo, les pictogrammes SVG
    const base = src.replace(/^img\//, '').replace(/\.(jpe?g|png)$/i, '');
    const grand = tailles[`${base}.jpg`], petit = tailles[`${base}@small.jpg`];
    const webpG = tailles[`${base}.webp`], webpP = tailles[`${base}@small.webp`];
    if (!grand || !webpG) return tout;                             // pas une capture traitée

    const descripteurs = (ext) => {
      const p = ext === 'webp' ? webpP : petit, g = ext === 'webp' ? webpG : grand;
      const liste = [];
      if (p && p.w < g.w) liste.push(`img/${base}@small.${ext} ${p.w}w`);
      liste.push(`img/${base}.${ext} ${g.w}w`);
      return liste.join(', ');
    };

    const sizes = lire('sizes') || SIZES_DEFAUT;
    // width/height viennent du FICHIER, pas de ce qui était écrit : c'est ce couple qui réserve
    // la place avant le chargement, et un ratio faux fait sauter la page sous les yeux.
    let restant = attrs
      .replace(/\s*srcset="[^"]*"/g, '')
      .replace(/\s*sizes="[^"]*"/g, '')
      .replace(/\s*width="[^"]*"/g, '')
      .replace(/\s*height="[^"]*"/g, '')
      .replace(/\s+/g, ' ').trim();
    if (lire('width') !== String(grand.w) || lire('height') !== String(grand.h)) corrigées++;

    const ind = blanc.replace(/^\n?/, '');
    enveloppées++;
    return `${blanc}<picture>`
      + `\n${ind}  <source type="image/webp" srcset="${descripteurs('webp')}" sizes="${sizes}">`
      + `\n${ind}  <img ${restant} srcset="${descripteurs('jpg')}" sizes="${sizes}"`
      + ` width="${grand.w}" height="${grand.h}">`
      + `\n${ind}</picture>`;
  });

  if (après !== avant) {
    touchées++;
    if (!essai) await writeFile(path.join(RACINE, f), après);
    console.log(`${essai ? 'changerait' : 'réécrit  '} ${f}`);
  }
}
console.log(`\n${enveloppées} images enveloppées dans ${touchées} pages`
  + ` · ${corrigées} couples width/height remis sur les vraies dimensions`
  + (essai ? '\n(--essai : rien n\'a été écrit)' : ''));

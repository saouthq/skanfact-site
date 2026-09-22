// Réduire les captures et les servir à la bonne taille, dans le bon format.
//
//   node outils/images.mjs <dossier des PNG> [nom…]     — tous, ou seulement ceux nommés
//   node outils/images.mjs --verifier                   — ne produit rien : contrôle l'existant
//
// Pourquoi ce fichier est DANS le dépôt : comme l'audit, il vivait dans un dossier de travail
// temporaire. À chaque session on le réécrivait, et on redevinait les largeurs — qui sont
// pourtant écrites dans les attributs `width` des pages.
//
// ---------------------------------------------------------------------------------------------
// Ce que la version d'avant faisait, et pourquoi ça ne suffisait pas.
//
// Elle redimensionnait dans le Chromium déjà installé, par un `<canvas>`, et enregistrait en JPEG
// à 0,82. C'était séduisant — aucune dépendance — et c'était faux sur trois points, tous MESURÉS
// sur les images du site (22/09/2026) :
//
//   1. Le sous-échantillonnage de chrominance. `canvas.toDataURL('image/jpeg')` écrit du 4:2:0 :
//      la couleur est enregistrée à un pixel sur quatre. Sur une photo, personne ne le voit ; sur
//      une CAPTURE D'ÉCRAN, où tout est du texte fin et des filets d'un pixel, le vert des
//      pastilles bave sur le blanc et les chiffres se brouillent. Nos images sont toutes des
//      captures : on force donc le 4:4:4.
//   2. Le format. Le WebP rend les mêmes images pour 43 % de moins (359 ko → 206 ko sur cinq
//      captures représentatives). C'est la plus grosse économie du site, et elle ne coûte rien :
//      le JPEG reste là en repli dans un `<picture>`.
//   3. L'encodeur. mozjpeg gagne encore 15 à 25 % sur l'encodeur de Chromium à qualité égale, et
//      le JPEG progressif s'affiche en plusieurs passes au lieu d'apparaître ligne à ligne.
//
// D'où la seule dépendance de ce dépôt : `sharp` (libvips). Elle ne sert qu'ici — le site, lui,
// n'a toujours aucune dépendance et se sert tel quel.
// ---------------------------------------------------------------------------------------------
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = path.join(RACINE, 'img');
const MANIFESTE = path.join(DOSSIER, 'tailles.json');

const req = createRequire(import.meta.url);
let sharp;
try { sharp = req('sharp'); } catch {
  console.error('\n`sharp` est introuvable. Il ne sert qu\'aux outils, jamais au site :\n  npm install\n');
  process.exit(4);
}

// Deux profils, et ils viennent des attributs `width` des pages — pas d'un goût personnel.
// Une capture d'écran ENTIÈRE est large et s'affiche sur toute la colonne ; un panneau recadré
// fait moins de 1000 px et s'affiche dans une carte. Les réduire au même format donnerait soit
// des panneaux flous, soit des écrans inutilement lourds.
const PROFILS = [
  { seuil: 1000, grand: 1400, petit: 720 },   // écran entier
  { seuil: 0, grand: 900, petit: 620 },       // panneau recadré
];

// 80 et non 82 : à 4:4:4 la qualité perçue monte, donc on peut redescendre d'un cran et rendre
// les octets gagnés. Vérifié à l'œil sur les chiffres d'un tableau de factures.
const JPEG = { quality: 80, mozjpeg: true, progressive: true, chromaSubsampling: '4:4:4' };
const WEBP = { quality: 80, effort: 6 };

const ko = (n) => Math.round(n / 1024) + ' ko';

async function produire(src, base) {
  const entree = await readFile(src);
  const meta = await sharp(entree).metadata();
  const profil = PROFILS.find(p => meta.width >= p.seuil);
  const tailles = [
    { suffixe: '', largeur: Math.min(profil.grand, meta.width) },
    { suffixe: '@small', largeur: Math.min(profil.petit, meta.width) },
  ];
  const produits = [];
  for (const t of tailles) {
    // `withoutEnlargement` : on ne fabrique JAMAIS de pixels. Une source plus petite que la
    // taille voulue ressort telle quelle, et le manifeste dira sa vraie largeur — c'est ce qui
    // empêche un `srcset` d'annoncer une taille que le fichier n'a pas.
    const réduit = sharp(entree).resize({ width: t.largeur, withoutEnlargement: true });
    for (const [ext, options, méthode] of [['jpg', JPEG, 'jpeg'], ['webp', WEBP, 'webp']]) {
      const sortie = path.join(DOSSIER, `${base}${t.suffixe}.${ext}`);
      const tampon = await réduit.clone()[méthode](options).toBuffer();
      await writeFile(sortie, tampon);
      const m = await sharp(tampon).metadata();
      produits.push({ fichier: path.basename(sortie), largeur: m.width, hauteur: m.height, octets: tampon.length });
    }
  }
  return produits;
}

// Le manifeste : la largeur RÉELLE de chaque fichier produit. C'est lui que l'audit relit pour
// vérifier qu'aucun `srcset` n'annonce une taille inventée — le défaut trouvé le 22/09/2026, où
// deux images de 1267 px étaient déclarées à 900 w et ne pouvaient donc jamais être choisies.
async function écrireManifeste() {
  const table = {};
  for (const f of (await readdir(DOSSIER)).sort()) {
    if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
    try {
      const m = await sharp(path.join(DOSSIER, f)).metadata();
      const s = await stat(path.join(DOSSIER, f));
      table[f] = { w: m.width, h: m.height, octets: s.size };
    } catch { /* un fichier illisible se signale ailleurs */ }
  }
  await writeFile(MANIFESTE, JSON.stringify(table, null, 1) + '\n');
  return table;
}

if (process.argv[2] === '--verifier') {
  const table = await écrireManifeste();
  // Les images d'aperçu social (`og:image`) restent en JPEG et c'est VOULU : les robots de
  // Facebook, LinkedIn et WhatsApp ne lisent pas tous le WebP, et une vignette qui ne s'affiche
  // pas vaut moins que quelques kilo-octets gagnés. On ne les réclame donc pas ici.
  const pages = await readdir(RACINE);
  const social = new Set();
  for (const f of pages.filter(x => x.endsWith('.html'))) {
    const t = await readFile(path.join(RACINE, f), 'utf8');
    for (const m of t.matchAll(/og:image" content="[^"]*?img\/([^"\/]+)"/g)) social.add(m[1]);
  }
  const sansWebp = Object.keys(table).filter(f => /\.jpe?g$/i.test(f)
    && !social.has(f) && !table[f.replace(/\.jpe?g$/i, '.webp')]);
  console.log(`${Object.keys(table).length} fichiers dans img/, manifeste écrit.`);
  if (sansWebp.length) console.log(`sans variante WebP : ${sansWebp.join(', ')}`);
  else console.log('chaque JPEG a sa variante WebP.');
  process.exit(0);
}

const source = process.argv[2];
if (!source) {
  console.error('usage : node outils/images.mjs <dossier des PNG> [nom…]\n'
    + '        node outils/images.mjs --verifier');
  process.exit(2);
}
const voulus = process.argv.slice(3);
// Un PNG est une source SANS perte : c'est ce qu'on veut, et c'est ce que produisent les deux
// bancs de captures. `sequence-site.js`, lui, enregistre déjà en JPEG — on l'accepte, mais on le
// DIT : réencoder du JPEG en JPEG ajoute une génération de perte, même à qualité haute.
const ACCEPTÉS = /\.(png|jpe?g)$/i;
const entrées = (await readdir(source)).filter(f => ACCEPTÉS.test(f))
  .filter(f => !voulus.length || voulus.includes(f.replace(ACCEPTÉS, '')));
if (!entrées.length) { console.error(`aucun PNG à traiter dans ${source}`); process.exit(3); }

let avant = 0, après = 0;
for (const f of entrées.sort()) {
  const base = f.replace(ACCEPTÉS, '');
  if (!/\.png$/i.test(f)) console.log(`  (source déjà en JPEG : ${f} — une génération de perte en plus)`);
  const anciens = ['', '@small'].map(s => path.join(DOSSIER, `${base}${s}.jpg`))
    .filter(existsSync);
  // Le poids du GRAND format d'avant : c'est lui qu'on compare au grand format d'après. Diviser
  // le total par deux serait faux pour une image qui n'avait pas encore de variante `@small`
  // (les dix `seq-*`) : on l'aurait fait passer pour deux fois plus lourde qu'elle n'était.
  const poidsAvant = anciens.length && !anciens[0].includes('@small')
    ? (await stat(anciens[0])).size : 0;
  const produits = await produire(path.join(source, f), base);
  // Ce qui compte n'est PAS le poids du dossier : un visiteur ne télécharge qu'UNE variante par
  // image — la plus légère que son navigateur comprenne, à la taille de son écran. On mesure donc
  // ce qui part sur le réseau (le WebP grand format), pas ce qui dort dans le dépôt. Comparer
  // deux fichiers d'avant à quatre fichiers d'après ferait annoncer « 148 % de plus » là où le
  // visiteur, lui, reçoit 40 % de moins.
  const servi = produits.find(p => p.fichier.endsWith('.webp') && !p.fichier.includes('@small'));
  // Et on ne compare QUE ce qui existait avant : ajouter une image neuve au total « après »
  // ferait passer un ajout pour une régression.
  if (poidsAvant) { avant += poidsAvant; après += servi.octets; }
  const dit = produits.map(p => `${p.fichier} ${p.largeur}px ${ko(p.octets)}`).join(' · ');
  console.log(`${base.padEnd(18)} servi ${poidsAvant ? ko(poidsAvant) + ' →' : ''} ${ko(servi.octets)}   ${dit}`);
}
await écrireManifeste();
console.log(`\n${entrées.length} images. Ce qu'un visiteur TÉLÉCHARGE (le grand format) :`
  + ` ${avant ? ko(avant) + ' → ' : ''}${ko(après)}`
  + (avant ? `  (${Math.round((1 - après / avant) * 100)} % de moins)` : ''));
console.log('Le dossier img/ grossit, lui : il porte désormais le JPEG de repli ET le WebP.');

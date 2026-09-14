// Réduire les captures en deux tailles et les servir en JPEG.
//
// Les captures sortent du dépôt de l'application en PNG, à la taille de l'écran photographié.
// Telles quelles elles pèsent trois à quatre fois trop lourd, et un navigateur de téléphone
// télécharge une image de 1180 px pour l'afficher sur 360. D'où deux tailles et un `srcset`.
//
//   node outils/images.mjs <dossier des PNG> [nom…]     — tous, ou seulement ceux nommés
//
// Pourquoi ce fichier est DANS le dépôt : comme l'audit, il vivait dans un dossier de travail
// temporaire. À chaque session on le réécrivait, et on redevinait les largeurs — qui sont
// pourtant écrites dans les attributs `width` des pages.
//
// Il n'y a aucune dépendance : le redimensionnement se fait dans le Chromium déjà installé,
// par un `<canvas>`. C'est le même moteur qui affichera les images.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ENDROITS = [
  path.join(process.cwd(), 'node_modules', 'playwright'),
  path.join(process.cwd(), '..', 'skanfact', 'node_modules', 'playwright'),
  '/opt/node22/lib/node_modules/playwright'
];
async function playwright() {
  try { return await import('playwright'); } catch { /* pas installé ici */ }
  const req = createRequire(import.meta.url);
  for (const p of ENDROITS) { try { return req(p); } catch { /* suivant */ } }
  console.error('\nPlaywright est introuvable :\n  npm i -D playwright\n');
  process.exit(4);
}
function chromiumInstalle() {
  for (const base of ['/opt/pw-browsers', process.env.PLAYWRIGHT_BROWSERS_PATH].filter(Boolean)) {
    let noms = [];
    try { noms = readdirSync(base); } catch { continue; }
    for (const n of noms.filter(n => /^chromium(-\d+)?$/.test(n)).sort().reverse()) {
      const exe = path.join(base, n, 'chrome-linux', 'chrome');
      if (existsSync(exe)) return exe;
    }
  }
  return undefined;
}

// Deux profils, et ils viennent des attributs `width` des pages — pas d'un goût personnel.
// Une capture d'écran ENTIÈRE est large (1440) et s'affiche sur toute la colonne ; un panneau
// recadré fait environ 870 et s'affiche dans une carte. Les réduire au même format donnerait
// soit des panneaux flous, soit des écrans inutilement lourds.
const PROFILS = [
  { seuil: 1000, grand: 1400, petit: 720 },   // écran entier
  { seuil: 0, grand: 900, petit: 620 }        // panneau recadré
];
const QUALITE = 0.82;

const source = process.argv[2];
if (!source) { console.error('usage : node outils/images.mjs <dossier des PNG> [nom…]'); process.exit(2); }
const voulus = process.argv.slice(3);

const { chromium } = await playwright();
const navigateur = await chromium.launch({ args: ['--no-sandbox'], executablePath: chromiumInstalle() });
const page = await navigateur.newPage();

const fichiers = (await readdir(source)).filter(f => f.endsWith('.png'))
  .filter(f => !voulus.length || voulus.includes(path.basename(f, '.png')));
if (!fichiers.length) { console.error('aucun PNG à traiter dans ' + source); process.exit(3); }

for (const f of fichiers) {
  const nom = path.basename(f, '.png');
  const octets = await readFile(path.join(source, f));
  const dataUri = 'data:image/png;base64,' + octets.toString('base64');

  const sorties = await page.evaluate(async ({ dataUri, PROFILS, QUALITE }) => {
    const img = new Image();
    img.src = dataUri;
    await img.decode();
    const profil = PROFILS.find(p => img.naturalWidth > p.seuil);
    const rendre = (largeur) => {
      // On n'AGRANDIT jamais : une capture de 869 px rendue à 900 serait floue pour rien.
      const l = Math.min(largeur, img.naturalWidth);
      const h = Math.round(img.naturalHeight * l / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = l; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, l, h);
      return { data: c.toDataURL('image/jpeg', QUALITE), largeur: l, hauteur: h };
    };
    return { grand: rendre(profil.grand), petit: rendre(profil.petit) };
  }, { dataUri, PROFILS, QUALITE });

  for (const [suffixe, r] of [['', sorties.grand], ['@small', sorties.petit]]) {
    const cible = path.join('img', nom + suffixe + '.jpg');
    await writeFile(cible, Buffer.from(r.data.split(',')[1], 'base64'));
    console.log(`  ${cible}  ${r.largeur}×${r.hauteur}`);
  }
  console.log(`✓ ${nom}  — dans les pages : width="${sorties.grand.largeur}" height="${sorties.grand.hauteur}"`);
}

await navigateur.close();

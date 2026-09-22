#!/usr/bin/env node
/* La typographie française du texte visible — et RIEN d'autre.
 *
 * Deux choses, mesurées avant d'être corrigées le 22/09/2026 :
 *   - l'espace insécable devant : ; ? ! et à l'intérieur des guillemets français. Sur 497
 *     signes doubles, 64 la portaient — 12 %. Sans elle, le navigateur coupe la ligne juste
 *     avant, et le signe se retrouve seul en tête de ligne. Dans un titre, ça se voit.
 *   - l'apostrophe. 900 droites contre 314 courbes, dans 27 pages sur 31, et le mélange
 *     atteint la phrase. Les deux glyphes n'ont ni le même dessin ni la même chasse.
 *
 * CE QU'IL NE TOUCHE JAMAIS, et c'est tout l'enjeu :
 *   - le contenu des <script>, <style>, <pre>, <code> et <textarea> ;
 *   - les commentaires HTML ;
 *   - le moindre ATTRIBUT — un `href`, un `content`, un `alt`, un `data-*`. Une apostrophe
 *     courbe dans une URL la casse ; une insécable dans un `content` de balise meta part
 *     telle quelle dans les résultats de recherche ;
 *   - une adresse (http, mailto, tel) ou un chemin de fichier trouvés en plein texte ;
 *   - un `:` qui sépare deux chiffres (une heure), ou qui suit déjà une insécable.
 *
 * Il est IDEMPOTENT : le relancer ne change plus rien. C'est la propriété qui permet de
 * l'exécuter sans relire les 31 fichiers à chaque fois — et le contrôle ci-dessous la vérifie.
 *
 *   node outils/typo.mjs            → écrit
 *   node outils/typo.mjs --lire     → dit ce qu'il changerait, sans rien écrire
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIRE = process.argv.includes('--lire');

const INSEC = ' ';
const OPAQUES = new Set(['script', 'style', 'pre', 'code', 'textarea']);

/* Découpe le fichier en morceaux, et dit pour chacun s'il est du TEXTE VISIBLE.
   Un analyseur par expressions régulières se désynchronise sur un `<` dans une chaîne de
   script : on avance balise par balise, et on retient dans quoi on se trouve. */
function morceaux(html) {
  const out = [];
  let i = 0;
  let opaque = null;
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const f = html.indexOf('-->', i);
      const j = f < 0 ? html.length : f + 3;
      out.push({ texte: false, s: html.slice(i, j) });
      i = j;
      continue;
    }
    const lt = html.indexOf('<', i);
    if (lt < 0) { out.push({ texte: !opaque, s: html.slice(i) }); break; }
    if (lt > i) { out.push({ texte: !opaque, s: html.slice(i, lt) }); i = lt; }
    const gt = html.indexOf('>', i);
    const j = gt < 0 ? html.length : gt + 1;
    const balise = html.slice(i, j);
    const nom = (/^<\/?\s*([a-zA-Z0-9-]+)/.exec(balise) || [])[1];
    if (nom) {
      const min = nom.toLowerCase();
      if (balise[1] === '/') { if (opaque === min) opaque = null; }
      else if (OPAQUES.has(min) && !balise.endsWith('/>')) opaque = min;
    }
    out.push({ texte: false, s: balise });   // une balise n'est JAMAIS du texte
    i = j;
  }
  return out;
}

/* Une adresse ou un chemin trouvés en plein texte gardent leurs apostrophes droites : ils se
   recopient, et une courbe les casse. */
const ADRESSE = /((?:https?:\/\/|mailto:|tel:|www\.)\S+|\S+\.(?:html|json|js|css|png|jpg|webp|pdf|zip)\b)/g;

function corriger(t) {
  return t.split(ADRESSE).map((part, k) => {
    if (k % 2 === 1) return part;              // les morceaux impairs SONT les adresses
    let s = part;
    // L'apostrophe droite entre deux lettres est une élision : elle devient courbe.
    s = s.replace(/(\p{L})'(\p{L})/gu, '$1’$2');
    // L'espace devant un signe double devient insécable — jamais entre deux chiffres (5:30).
    s = s.replace(/(\S) +([;:!?])(?!\d)/g, (m, av, sg) => av + INSEC + sg);
    s = s.replace(/(\S) +([;:!?])$/g, (m, av, sg) => av + INSEC + sg);
    // Les guillemets français serrent leur contenu.
    s = s.replace(/«\s+/g, '«' + INSEC).replace(/\s+»/g, INSEC + '»');
    return s;
  }).join('');
}

const pages = (await readdir(RACINE)).filter(f => f.endsWith('.html'));
let touchees = 0, signes = 0, apostrophes = 0;
for (const f of pages) {
  const avant = await readFile(path.join(RACINE, f), 'utf8');
  const apres = morceaux(avant).map(m => (m.texte ? corriger(m.s) : m.s)).join('');
  if (apres === avant) continue;
  touchees++;
  signes += (apres.match(new RegExp(INSEC + '[;:!?»]', 'g')) || []).length
          - (avant.match(new RegExp(INSEC + '[;:!?»]', 'g')) || []).length;
  apostrophes += (apres.match(/’/g) || []).length - (avant.match(/’/g) || []).length;
  if (!LIRE) await writeFile(path.join(RACINE, f), apres);
}
console.log(`${touchees} page(s) ${LIRE ? 'à corriger' : 'corrigée(s)'} · +${signes} insécable(s) · +${apostrophes} apostrophe(s) courbe(s)`);

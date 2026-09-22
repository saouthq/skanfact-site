#!/usr/bin/env node
/* La liste des versions ÉCRITE dans nouveautes.html — celle qu'on voit sans JavaScript, et
 * celle que lit un robot, un lecteur d'aperçu, ou une IA à qui l'on donne le site.
 *
 * Pourquoi elle existe : la page charge la vraie liste depuis l'API GitHub, mais une page qui
 * dépend d'une API est une page qui peut être vide. Sept versions sont donc écrites en dur.
 * Pourquoi ce script existe : écrites À LA MAIN, elles périment à chaque publication — le
 * 23/09/2026 un audit extérieur a lu « 10.0.0 » sur un site dont l'application était en 10.8.0,
 * et c'est très exactement le genre de défaut qui casse la confiance : rien ne plante, la page
 * est belle, et elle ment. Une saisie répétée finit toujours par ne plus se faire.
 *
 * Il applique LA MÊME règle que assets/site.js (le titre d'une version est la première phrase
 * en gras de ses notes, une URL crue devient « … ») : ce que le visiteur lit avec ou sans
 * JavaScript est identique. Une divergence entre les deux se verrait au premier rechargement.
 *
 *   node outils/nouveautes.mjs            → réécrit la liste dans nouveautes.html
 *   node outils/nouveautes.mjs --lire     → affiche ce qu'il écrirait, sans toucher au fichier
 *
 * À lancer après chaque publication stable de l'application, avec `outils/typo.mjs` derrière :
 * les titres viennent du CHANGELOG et peuvent porter une apostrophe droite. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = path.join(RACINE, 'nouveautes.html');
const DEPOT = 'saouthq/skanfact';
const COMBIEN = 7;
const LIRE = process.argv.includes('--lire');

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
  'septembre', 'octobre', 'novembre', 'décembre'];
const enClair = iso => { const p = iso.slice(0, 10).split('-'); return `${+p[2]} ${MOIS[+p[1] - 1]} ${p[0]}`; };
const ech = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

/* Même règle que `resumeDe` dans assets/site.js — si l'une change, l'autre change. */
function resumeDe(corps) {
  const b = String(corps || '').trim();
  const m = b.match(/^\*\*([\s\S]+?)\*\*/);
  let t = m ? m[1] : b.split('\n\n')[0];
  t = t.replace(/https?:\/\/\S+/g, '…').replace(/[*`_]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > 190 ? t.slice(0, 187).replace(/\s\S*$/, '') + '…' : t;
}

const rep = await fetch(`https://api.github.com/repos/${DEPOT}/releases?per_page=20`,
  { headers: { Accept: 'application/vnd.github+json' } });
if (!rep.ok) { console.error(`GitHub répond ${rep.status} : rien n'est écrit.`); process.exit(2); }
const vraies = (await rep.json()).filter(r => !r.prerelease && !r.draft).slice(0, COMBIEN);
if (!vraies.length) { console.error('Aucune version stable publiée : rien n\'est écrit.'); process.exit(2); }

const lignes = vraies.map((r, i) => {
  const v = (r.tag_name || '').replace(/^v/, '');
  return [
    `        <li class="version${i === 0 ? ' derniere' : ''}">`,
    `          <div class="v-num">${ech(v)}${i === 0 ? '<span class="v-neuf">dernière</span>' : ''}</div>`,
    '          <div class="v-corps">',
    `            <p class="v-quoi">${ech(resumeDe(r.body))}</p>`,
    `            <p class="v-quand"><time datetime="${ech((r.published_at || '').slice(0, 10))}">${ech(enClair(r.published_at || ''))}</time> · <a href="${ech(r.html_url)}" rel="noopener">Notes complètes</a></p>`,
    '          </div>',
    '        </li>'
  ].join('\n');
}).join('\n');

const html = await readFile(PAGE, 'utf8');
const debut = html.indexOf('<ol class="versions" id="versions">');
const fin = html.indexOf('      </ol>', debut);
if (debut < 0 || fin < 0) { console.error('nouveautes.html : la liste <ol id="versions"> est introuvable.'); process.exit(3); }
const avant = html.slice(0, debut + '<ol class="versions" id="versions">'.length) + '\n';
const neuf = avant + lignes + '\n' + html.slice(fin);

if (neuf === html) { console.log(`nouveautes.html est déjà à jour (dernière : ${vraies[0].tag_name}).`); process.exit(0); }
if (LIRE) { console.log(lignes); console.log(`\n(--lire : rien n'est écrit ; dernière ${vraies[0].tag_name})`); process.exit(0); }
await writeFile(PAGE, neuf);
console.log(`nouveautes.html réécrit : ${vraies.length} versions, la dernière est ${vraies[0].tag_name}.`);

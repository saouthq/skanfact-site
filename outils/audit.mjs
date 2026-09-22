// L'audit du site : on ouvre les 29 pages dans un vrai navigateur, à quatre largeurs, et on
// MESURE. La leçon que ce projet réapprend à chaque fois : un défaut de cascade CSS ne se voit
// pas à la relecture — un en-tête aligné à droite qui ne l'est pas, un bouton vert sur fond
// vert, un texte à 2,9 de contraste. Le HTML est juste, c'est la feuille de style qui décide.
//
// Pourquoi ce fichier est DANS le dépôt : il a vécu trois sessions dans un dossier de travail
// temporaire, effacé à chaque fois. Un contrôle qu'on doit réécrire pour s'en servir n'est pas
// un contrôle. (Même raison que `test/e2e/harnais.js` dans le dépôt de l'application.)
//
//   node outils/audit.mjs            — sert le site sur un port local et l'examine
//
// Playwright n'est pas une dépendance du site (le site n'en a aucune, et c'est voulu) : on le
// cherche là où il peut être — y compris dans la copie de travail de l'application, à côté.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDROITS = [
  'playwright',
  path.join(RACINE, 'node_modules', 'playwright'),
  path.join(RACINE, '..', 'skanfact', 'node_modules', 'playwright'),
  '/opt/node22/lib/node_modules/playwright',
  '/usr/lib/node_modules/playwright'
];

// `import()` ne résout PAS un dossier comme le fait `require` : `import('/…/playwright')` échoue
// là où `require('/…/playwright')` trouve son `index.js`. On passe donc par `createRequire` pour
// les chemins du disque, et on garde l'import nu pour le cas où le paquet serait installé ici.
async function playwright() {
  try { return await import('playwright'); } catch { /* pas installé dans le site */ }
  const req = createRequire(import.meta.url);
  for (const p of ENDROITS.slice(1)) {
    try { return req(p); } catch { /* on essaie le suivant */ }
  }
  console.error('\nPlaywright est introuvable. L\'audit ouvre un vrai navigateur et en a besoin :\n'
    + '  npm i -D playwright\n');
  process.exit(4);
}

// On sert le site EXACTEMENT comme il est servi en vrai, sinon la page 404 — la seule qui vise
// en absolu — est examinée dans des conditions qui n'existent pas.
//
// Jusqu'au 15/09/2026 c'était `/skanfact-site/`, le préfixe de GitHub Pages. Depuis que
// `skanfact.tn` est en place, le site vit à la RACINE : `/assets/style.css` désigne enfin ce
// qu'il prétend désigner. Servir encore sous l'ancien préfixe laissait la 404 sans feuille de
// style ni logo pendant l'audit, sur la seule page où le visiteur est déjà perdu — et l'audit
// n'en disait rien, puisqu'il ne vérifiait pas que le style avait chargé. C'est réparé
// ci-dessous : on mesure désormais que la page 404 est bien HABILLÉE.
const PREFIXE = '/';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json'
};

const LARGEURS = [
  { nom: 'téléphone', width: 390, height: 844 },
  { nom: 'tablette', width: 768, height: 1024 },
  { nom: 'portable', width: 1280, height: 800 },
  { nom: 'bureau', width: 1600, height: 1000 }
];

// ---------------------------------------------------------------- le contraste
// Formule WCAG. Le seuil est 4,5 pour un texte ordinaire, 3 pour un grand texte (18,66 px en
// gras, ou 24 px). On ne juge pas l'esthétique : on attrape ce qui ne se lit pas.
function canal(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function luminance([r, g, b]) { return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b); }
function contraste(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function rgb(s) {
  const m = String(s).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return { c: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
}

async function servir(port) {
  const serveur = createServer(async (req, res) => {
    let chemin = decodeURIComponent(req.url.split('?')[0]);
    if (!chemin.startsWith(PREFIXE)) { res.writeHead(404).end('hors préfixe'); return; }
    chemin = chemin.slice(PREFIXE.length) || 'index.html';
    if (chemin.endsWith('/')) chemin += 'index.html';
    const fichier = path.join(RACINE, chemin);
    if (!fichier.startsWith(RACINE)) { res.writeHead(403).end(); return; }
    try {
      const corps = await readFile(fichier);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(fichier)] || 'application/octet-stream' });
      res.end(corps);
    } catch {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      res.end(await readFile(path.join(RACINE, '404.html')).catch(() => 'introuvable'));
    }
  });
  await new Promise(r => serveur.listen(port, '127.0.0.1', r));
  return serveur;
}

const { chromium } = await playwright();
const PORT = 8781;
const serveur = await servir(PORT);
const pages = (await readdir(RACINE)).filter(f => f.endsWith('.html')).sort();
// Le Chromium installé sur la machine n'est pas toujours celui que la version de Playwright
// réclame : elle cherche alors un dossier qui n'existe pas et s'arrête sur « run npx playwright
// install », ce qui n'est ni possible ni souhaitable ici. On prend celui qui est là.
const INSTALLES = ['/opt/pw-browsers', process.env.PLAYWRIGHT_BROWSERS_PATH].filter(Boolean);
function chromiumInstalle() {
  for (const base of INSTALLES) {
    let noms = [];
    try { noms = readdirSync(base); } catch { continue; }
    for (const n of noms.filter(n => /^chromium(-\d+)?$/.test(n)).sort().reverse()) {
      const exe = path.join(base, n, 'chrome-linux', 'chrome');
      if (existsSync(exe)) return exe;
    }
  }
  return undefined;   // Playwright cherchera le sien
}
const navigateur = await chromium.launch({ args: ['--no-sandbox'], executablePath: chromiumInstalle() });
const constats = [];
const dit = (gravite, page, largeur, quoi) => constats.push({ gravite, page, largeur, quoi });

for (const largeur of LARGEURS) {
  const ctx = await navigateur.newContext({ viewport: { width: largeur.width, height: largeur.height } });
  const onglet = await ctx.newPage();
  const erreurs = [];
  onglet.on('pageerror', e => erreurs.push(String(e)));
  onglet.on('console', m => {
    const t = m.text();
    if (m.type() !== 'error') return;
    if (/Failed to load resource|net::ERR_/.test(t)) return;
    erreurs.push(t);
  });

  for (const f of pages) {
    erreurs.length = 0;
    await onglet.goto(`http://127.0.0.1:${PORT}${PREFIXE}${f}`, { waitUntil: 'domcontentloaded' });
    await onglet.waitForTimeout(220);

    const releve = await onglet.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
        // Un élément dont un ANCÊTRE est déporté hors de l'écran (lien d'évitement, piège à
        // robots) n'est pas un défaut : c'est le procédé. On remonte donc la chaîne.
        for (let p = el; p; p = p.parentElement) {
          const pr = p.getBoundingClientRect();
          if (pr.right < -500 || pr.bottom < -500) return false;
        }
        return true;
      };
      // Le fond RÉEL, et c'est plus subtil qu'il n'y paraît : le site pose des fonds
      // SEMI-TRANSPARENTS (`.btn-clair` est un blanc à 14 %, posé sur le vert foncé). Prendre
      // cette couleur telle quelle revient à comparer du texte blanc à du blanc — contraste
      // 1,00, et cent constats qui n'existent pas. Il faut COMPOSER les couches jusqu'au
      // premier fond opaque, comme le fait le navigateur.
      // Un dégradé ou une image de fond : on ne sait pas dire quelle couleur est sous le
      // texte, et inventer un chiffre serait pire que se taire — on renvoie null, et
      // l'appelant s'abstient.
      const fond = (el) => {
        const couches = [];
        for (let p = el; p; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (s.backgroundImage && s.backgroundImage !== 'none') return null;
          const m = String(s.backgroundColor).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
          if (!m) continue;
          const a = m[4] === undefined ? 1 : +m[4];
          if (a === 0) continue;
          couches.push([+m[1], +m[2], +m[3], a]);
          if (a >= 0.999) break;
        }
        let r = 255, g = 255, b = 255;   // la page, sous tout le reste
        for (let i = couches.length - 1; i >= 0; i--) {
          const [cr, cg, cb, ca] = couches[i];
          r = cr * ca + r * (1 - ca);
          g = cg * ca + g * (1 - ca);
          b = cb * ca + b * (1 - ca);
        }
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
      };

      const textes = [];
      document.querySelectorAll('p, li, a, h1, h2, h3, h4, span, b, button, td, th, figcaption, label, legend').forEach(el => {
        if (!el.textContent.trim() || !visible(el)) return;
        // On ne juge que les éléments qui portent EUX-MÊMES du texte : sinon on mesure la
        // couleur d'un conteneur, qui n'en affiche aucun.
        const propre = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
        if (!propre) return;
        const s = getComputedStyle(el);
        if (fond(el) === null) return;   // dégradé ou image : impossible à juger honnêtement
        textes.push({
          texte: el.textContent.trim().slice(0, 48), couleur: s.color, fond: fond(el),
          taille: parseFloat(s.fontSize), gras: (parseInt(s.fontWeight, 10) || 400) >= 600
        });
      });

      // Un bouton dont le fond se confond avec celui de son bloc, et qui n'a pas de bordure,
      // n'est plus un bouton — même si son texte, lui, est parfaitement lisible.
      const boutons = [];
      document.querySelectorAll('a.btn, button.btn').forEach(el => {
        if (!visible(el)) return;
        const s = getComputedStyle(el);
        const bord = ['Top', 'Right', 'Bottom', 'Left']
          .some(c => parseFloat(s['border' + c + 'Width']) > 0.4 && !/rgba\(0, 0, 0, 0\)/.test(s['border' + c + 'Color']));
        boutons.push({
          texte: el.textContent.trim().slice(0, 40), sien: fond(el),
          autour: fond(el.parentElement), bord
        });
      });

      // Ce qui déborde par la droite. Les tableaux et les figures qui défilent portent la
      // classe `.scroll-x` : c'est le marqueur explicite du projet, on l'exclut lui, pas tout
      // ce qui se trouve dans un conteneur défilant (une exclusion trop large désarme le
      // contrôle en silence).
      const debordent = [];
      document.querySelectorAll('body *').forEach(el => {
        if (!visible(el) || el.closest('.scroll-x')) return;
        const r = el.getBoundingClientRect();
        if (r.right > document.documentElement.clientWidth + 1) {
          debordent.push((el.tagName + '.' + (el.className || '')).slice(0, 60));
        }
      });

      const liens = Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.getAttribute('href'))
        .filter(h => h && !/^(https?:|mailto:|tel:|#)/.test(h));
      const images = Array.from(document.querySelectorAll('img'))
        .filter(i => !i.hasAttribute('alt'))
        .map(i => i.getAttribute('src'));
      const jsonld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => s.textContent);

      // Une grille qui laisse UNE tuile seule sur sa dernière rangée se lit comme un accident :
      // c'est ce que `repeat(auto-fill, minmax(210px, 1fr))` faisait de six cartes à 1440 px —
      // cinq, puis une. Le défaut ne se voit pas dans le HTML, qui est juste ; il se MESURE,
      // comme un en-tête mal aligné ou un bouton hors de l'écran. On compare donc les abscisses
      // réelles des tuiles, sans rien présumer du nombre de colonnes.
      const grilles = [];
      for (const g of document.querySelectorAll('.modules, .cartes-mini, .trio, .trois')) {
        const tuiles = [...g.children].filter(e => e.getBoundingClientRect().width > 1);
        if (tuiles.length < 3) continue;
        const rangees = new Map();
        for (const t of tuiles) {
          const y = Math.round(t.getBoundingClientRect().top);
          rangees.set(y, (rangees.get(y) || 0) + 1);
        }
        const compte = [...rangees.values()];
        grilles.push({ nom: g.className, total: tuiles.length, rangees: compte });
      }

      return {
        textes, boutons, debordent, liens, images, jsonld, grilles,
        titre: (document.querySelector('title') || {}).textContent || '',
        desc: (document.querySelector('meta[name=description]') || {}).content || '',
        canonique: (document.querySelector('link[rel=canonical]') || {}).href || '',
        noindex: /noindex/.test((document.querySelector('meta[name=robots]') || {}).content || ''),
        h1: document.querySelectorAll('h1').length,
        og: (document.querySelector('meta[property="og:image"]') || {}).content || '',
        largeurDoc: document.documentElement.scrollWidth,
        vue: document.documentElement.clientWidth,
        // La feuille de style a-t-elle VRAIMENT chargé ? Une page dont le CSS ne résout pas
        // s'affiche quand même — nue, et sans une erreur. C'est le piège des chemins absolus
        // de la 404 : ils ne se voient qu'en regardant, ou en mesurant comme ici.
        habillee: getComputedStyle(document.body).fontFamily.includes('Lexend')
          && getComputedStyle(document.body).margin !== '8px'
      };
    });

    for (const e of erreurs) dit('grave', f, largeur.nom, 'erreur JavaScript : ' + e.slice(0, 120));

    // ------------------------------------------------------------- le menu du burger
    // Signalé par le propriétaire : « il y a trop d'onglets, donc le défilement se passe sur la
    // page et pas dans le menu ». Le menu faisait 800 px sous un en-tête de 72, sur un téléphone
    // qui en offre 640 : « Essayer 30 jours » était hors de l'écran, et le seul moyen de
    // l'atteindre était de faire défiler LA PAGE — donc d'emporter l'en-tête avec elle.
    // Deux entrées de plus dans le menu suffisent à le recasser, et rien ne le dirait : on
    // mesure donc les deux états, volet replié ET volet ouvert, à chaque largeur de téléphone.
    if (largeur.width <= 900 && await onglet.$('#burger')) {
      // Les volets du menu. Il y en a DEUX depuis la 10.0.0 — « Pour l'entreprise » et « Pour
      // les cabinets » — et ils ne s'ouvrent jamais ensemble : ouvrir l'un referme l'autre,
      // parce que deux panneaux ouverts se recouvrent. On mesure donc le menu replié, puis
      // une fois par volet, et le pire cas décide. Ce test visait `#btn-fonc` par son
      // identifiant : le jour où ce bouton a été renommé, il a annoncé que le volet « ne
      // s'ouvrait pas » sur vingt-cinq pages — un test qui nomme un élément se relit quand
      // l'élément change, avant de conclure à une régression.
      const volets = await onglet.evaluate(() =>
        [...document.querySelectorAll('.sous .lien-menu')]
          .map(b => ({ id: b.id, nom: (b.textContent || '').trim().replace(/\s+/g, ' ') })));

      for (const volet of [null, ...volets]) {
        const m = await onglet.evaluate(async (quelVolet) => {
          const attendre = () => new Promise(r => setTimeout(r, 220));
          const burger = document.getElementById('burger');
          const nav = document.getElementById('nav-site');
          if (nav.classList.contains('ouvert')) { burger.click(); await attendre(); }
          burger.click();
          await attendre();
          if (quelVolet && quelVolet.id) {
            const b = document.getElementById(quelVolet.id);
            if (b) { b.click(); await attendre(); }
          }
          const r = nav.getBoundingClientRect();
          const cta = nav.querySelector('a.btn');
          const c = cta && cta.getBoundingClientRect();
          const s = getComputedStyle(nav);
          const res = {
            depasse: Math.round(r.bottom - window.innerHeight),
            defilable: nav.scrollHeight > nav.clientHeight + 1,
            retient: s.overscrollBehaviorY === 'contain' || s.overscrollBehaviorY === 'none',
            ctaDansLeMenu: !!(c && c.bottom <= r.bottom + 1 + (nav.scrollHeight - nav.clientHeight)),
            volet: !!document.querySelector('.sous.ouvert')
          };
          burger.click();
          return res;
        }, volet);

        const quoi = volet ? `volet « ${volet.nom} » ouvert` : 'volet replié';
        if (volet && !m.volet) {
          dit('grave', f, largeur.nom, `menu : le volet « ${volet.nom} » ne s'ouvre pas`);
        }
        if (m.depasse > 1) {
          dit('grave', f, largeur.nom,
            `menu (${quoi}) : il dépasse de l'écran de ${m.depasse} px — le bas est hors de portée`);
        }
        if (m.defilable && !m.retient) {
          dit('grave', f, largeur.nom,
            `menu (${quoi}) : il défile, mais le défilement passe à la page derrière (overscroll-behavior)`);
        }
        if (!m.ctaDansLeMenu) {
          dit('grave', f, largeur.nom, `menu (${quoi}) : le bouton d'essai n'est pas atteignable dans le menu`);
        }
      }
    }

    for (const t of releve.textes) {
      const c = rgb(t.couleur), d = rgb(t.fond);
      if (!c || !d || c.a < 0.95) continue;
      const r = contraste(c.c, d.c);
      const seuil = (t.taille >= 24 || (t.taille >= 18.66 && t.gras)) ? 3 : 4.5;
      if (r < seuil) {
        dit('grave', f, largeur.nom,
          `contraste ${r.toFixed(2)} (seuil ${seuil}) — « ${t.texte} »`);
      }
    }
    for (const b of releve.boutons) {
      const s = rgb(b.sien), a = rgb(b.autour);
      if (!s || !a || s.a < 0.95) continue;
      if (!b.bord && contraste(s.c, a.c) < 1.25) {
        dit('grave', f, largeur.nom, `bouton invisible (fond confondu, sans bordure) — « ${b.texte} »`);
      }
    }
    for (const g of releve.grilles) {
      if (g.rangees.length > 1 && g.rangees[g.rangees.length - 1] === 1 && g.rangees[0] > 1) {
        dit('moyen', f, largeur.nom,
          `grille « ${g.nom} » : ${g.total} tuiles, la dernière reste seule sur sa rangée`);
      }
    }
    if (!releve.habillee) {
      dit('grave', f, largeur.nom, 'la feuille de style n’a pas chargé : la page s’affiche nue');
    }
    if (releve.largeurDoc > releve.vue + 1) {
      dit('grave', f, largeur.nom, `la page déborde de ${releve.largeurDoc - releve.vue} px`);
    }
    for (const d of releve.debordent.slice(0, 3)) {
      dit('moyen', f, largeur.nom, 'sort par la droite : ' + d);
    }

    // Les contrôles qui ne dépendent pas de la largeur : une seule fois.
    if (largeur === LARGEURS[0]) {
      if (!releve.titre) dit('grave', f, '—', 'aucun titre');
      else if (releve.titre.length > 65) dit('moyen', f, '—', `titre de ${releve.titre.length} caractères`);
      if (!releve.desc) dit('grave', f, '—', 'aucune description');
      else if (releve.desc.length > 165) dit('moyen', f, '—', `description de ${releve.desc.length} caractères`);
      if (releve.h1 !== 1) dit('grave', f, '—', `${releve.h1} titres de niveau 1`);
      if (!releve.canonique && !releve.noindex) dit('grave', f, '—', 'aucune adresse canonique');
      if (releve.og && !/^https?:/.test(releve.og)) dit('grave', f, '—', 'og:image en chemin relatif');
      for (const src of releve.images) dit('grave', f, '—', 'image sans texte de remplacement : ' + src);
      for (const j of releve.jsonld) {
        try { JSON.parse(j); } catch (e) { dit('grave', f, '—', 'balisage JSON-LD invalide : ' + e.message); }
      }
      for (const l of releve.liens) {
        let cible = l.split('#')[0];
        if (!cible) continue;
        // La page 404 vise en ABSOLU (`/skanfact-site/…`) : elle peut être servie depuis
        // n'importe quelle adresse du site, donc un chemin relatif y serait faux. On retire le
        // préfixe avant de chercher le fichier, sinon six liens valides passent pour morts.
        if (cible.startsWith(PREFIXE)) cible = cible.slice(PREFIXE.length);
        else if (cible.startsWith('/')) cible = cible.slice(1);
        if (!existsSync(path.join(RACINE, cible))) dit('grave', f, '—', 'lien mort : ' + l);
      }
    }
  }
  await ctx.close();
}

await navigateur.close();
serveur.close();

// ------------------------------------------------------------------ le plan du site
// Depuis le 15/09/2026, Google LIT ce fichier : une adresse morte ou une page indexable qui n'y
// figure pas n'est plus une négligence sans conséquence. Le contrôle se fait dans les deux sens
// — ce que le plan annonce doit exister, et ce qui existe doit être annoncé — parce qu'un plan
// incomplet ne se remarque jamais : il ne produit aucune erreur, seulement des pages que
// personne ne trouve.
{
  const BASE = 'https://skanfact.tn/';
  const plan = await readFile(path.join(RACINE, 'sitemap.xml'), 'utf8');
  const adresses = [...plan.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  if (!adresses.length) dit('grave', 'sitemap.xml', '—', 'aucune adresse dans le plan du site');

  const listees = new Set();
  for (const u of adresses) {
    if (!u.startsWith(BASE)) { dit('grave', 'sitemap.xml', '—', 'adresse hors domaine : ' + u); continue; }
    const f = u.slice(BASE.length) || 'index.html';
    listees.add(f);
    if (!existsSync(path.join(RACINE, f))) {
      dit('grave', 'sitemap.xml', '—', 'adresse sans page : ' + u);
      continue;
    }
    const html = await readFile(path.join(RACINE, f), 'utf8');
    if (/name="robots"[^>]*noindex/.test(html)) {
      dit('grave', 'sitemap.xml', '—', `page en noindex mais annoncée au plan : ${f}`);
    }
    const can = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    // Une canonique qui désigne une AUTRE adresse que celle du plan annule le bénéfice des deux :
    // on demande l'indexation d'une page qui, elle, en désigne une autre.
    if (can && can !== u) dit('grave', 'sitemap.xml', '—', `canonique ≠ plan : ${f} → ${can}`);
  }
  for (const f of pages) {
    if (f === '404.html' || listees.has(f)) continue;
    const html = await readFile(path.join(RACINE, f), 'utf8');
    if (!/name="robots"[^>]*noindex/.test(html)) {
      dit('grave', 'sitemap.xml', '—', `page indexable absente du plan : ${f}`);
    }
  }
}

const graves = constats.filter(c => c.gravite === 'grave');
for (const c of constats) {
  console.log(`${c.gravite === 'grave' ? '✗' : '·'} ${c.page} [${c.largeur}] ${c.quoi}`);
}
console.log(`\n${pages.length} pages × ${LARGEURS.length} largeurs — `
  + `${graves.length} grave(s), ${constats.length - graves.length} moyen(s)`);
process.exit(graves.length ? 1 : 0);

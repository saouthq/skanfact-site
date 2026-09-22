// --------------------------------------------------------------------------------------------
// Ce banc vivait dans `test/e2e/` du dépôt de l'APPLICATION. Il a déménagé ici le 22/09/2026 :
// le dépôt de l'application est tenu par une autre session, et celui-ci ne doit jamais y écrire.
// Les images du site sont l'affaire du site. Le banc LIT l'application (il la lance et la
// photographie) et n'y écrit rien — `outils/captures/app.js` la trouve et emprunte son harnais.
//
//   node outils/captures/<ce fichier> [dossier de sortie]
// --------------------------------------------------------------------------------------------
// Les captures destinées au SITE WEB, pas à l'audit.
//
// Différence avec `captures.js` : ici on photographie ce que voit un utilisateur qui a ses propres
// données. Le jeu de démonstration sert de matière (il est réaliste et couvre tous les écrans), mais
// ses deux marqueurs — le bandeau « jeu d'exemple » et le tampon EXEMPLE sur les documents — sont
// masqués : ils n'existent que parce que les données sont fictives, et les montrer sur un site
// donnerait une image FAUSSE du produit, dans l'autre sens.
//
//   xvfb-run -a node test/e2e/captures-site.js [dossier de sortie]
const { playwright, RACINE, ELECTRON, journal, surveiller, dossierCaptures } = require('./app.js').harnais;
const { _electron: electron } = playwright();
const path = require('path');
const fs = require('fs');
const os = require('os');

// Les écrans qui servent à vendre : chacun doit prouver quelque chose à quelqu'un qui hésite.
const ECRANS = [
  { nom: 'accueil', route: 'dashboard' },
  { nom: 'factures', route: 'factures' },
  { nom: 'relances', route: 'relances' },
  { nom: 'clients', route: 'clients' },
  { nom: 'tresorerie', route: 'tresorerie', onglet: 'prevision' },
  { nom: 'comptable', route: 'compta', onglet: 'cabinet' },
  { nom: 'tva', route: 'compta', onglet: 'tva' },
  { nom: 'marges', route: 'marges' },
  { nom: 'stock', route: 'stock' },
  { nom: 'paie', route: 'paie', onglet: 'bulletins' },
];

// Les RECADRAGES. Une capture de fenêtre entière réduite à 530 px sur un site ne se lit pas :
// on devine une interface, on ne lit aucun chiffre. Ces vues-là ne montrent qu'un panneau, pris
// sur une fenêtre plus étroite — le texte y reste lisible une fois posé dans une colonne de site.
// Un panneau annoncé et introuvable fait ÉCHOUER le parcours : un recadrage silencieusement
// sauté donnerait une image périmée sans que personne le sache.
const DETAILS = [
  { nom: 'd-todo', route: 'dashboard', titre: 'À faire', haut: 430 },
  { nom: 'd-factures', route: 'factures', selecteur: '#view table.list', haut: 430 },
  { nom: 'd-relances', route: 'relances', selecteur: '#view table.list', haut: 300 },
  { nom: 'd-tresorerie', route: 'tresorerie', onglet: 'prevision', titre: 'Courbe du solde', haut: 400 },
  // La TVA se photographie sur un mois COMPLET. Prise sur le mois en cours, à la moitié, elle
  // montrait 42 000 DT collectés contre 189 240 DT déductibles — une entreprise qui aurait acheté
  // quatre fois et demie ce qu'elle a vendu, et un crédit de TVA de 147 240 DT. C'est
  // arithmétiquement juste et commercialement absurde : personne ne se reconnaît là-dedans.
  { nom: 'd-tva', route: 'compta', onglet: 'tva', titre: 'Déclaration de TVA', haut: 400, mois: '08' },
  { nom: 'd-manque', route: 'compta', onglet: 'cabinet', titre: 'Ce qui manque', haut: 330 },
  // Le paquet qu'on ENVOIE, et pas seulement ce qui lui manque : la page d'accueil promet « un
  // bouton lui envoie tout », et montrait la liste des trous du dossier.
  // L'onglet Cabinet masque le sélecteur de la page (`#c-period`) et pose le sien : il porte un
  // mois complet, `2026-08`, pas seulement son numéro.
  // On cadre sur le TABLEAU du contenu, pas sur le panneau entier : celui-ci commence par le
  // sélecteur de mois et par un avertissement (« ce mois n'est pas clôturé »), qui prendraient un
  // tiers de l'image pour dire une réserve — alors que ce que la page d'accueil promet, c'est ce
  // que le paquet CONTIENT.
  { nom: 'd-paquet', route: 'compta', onglet: 'cabinet', selecteur: '#c-body table.list.compact',
    haut: 430, mois: '2026-08', moisSel: '#cab-month' },
  { nom: 'd-marges', route: 'marges', titre: 'Affaires', haut: 330 },
  { nom: 'd-stock', route: 'stock', titre: 'État du stock', haut: 420 },
  { nom: 'd-paie', route: 'paie', onglet: 'bulletins', titre: 'Bulletins du mois', haut: 380 },
  { nom: 'd-clients', route: 'clients', selecteur: '#view table.list', haut: 420 },
  // La FICHE d'un client, pas la liste : c'est elle que la page Devis et factures promet.
  // On prend le deuxième client, le premier étant celui dont l'historique est le plus mince.
  { nom: 'd-fiche-client', route: 'clients', ouvrir: 'tr.clickable[data-cid]',
    titre: 'Documents', haut: 430 },
];

// La fenêtre des recadrages est plus étroite que celle des captures d'écran complètes : un panneau
// de 870 px posé dans une colonne de 620 px reste lisible, un panneau de 1130 px ne l'est plus.
// Couper un tableau à une hauteur ronde tranche sa dernière ligne en deux, et l'image donne
// l'impression d'un bug plutôt que d'un cadrage. On descend donc jusqu'au dernier bas de ligne
// qui tient dans la hauteur voulue, avec une marge de 12 px pour le filet. Si aucune ligne n'y
// tient — un panneau sans tableau, une courbe — on garde la hauteur demandée.
function hauteurNette(boite, voulue) {
  const plafond = Math.min(boite.height, voulue);
  const bas = (boite.bas || []).map(b => b - boite.y).filter(h => h <= plafond);
  return bas.length ? Math.max(...bas) + 12 : plafond;
}

const LARGE_ECRAN = { width: 1440, height: 900 };
const LARGE_DETAIL = { width: 1180, height: 820 };

const SANS_MARQUEURS = `
  /* Les barres de défilement de Linux, grises et fléchées comme celles de Windows 98. Elles
     n'existent que parce que la machine du test n'est ni un Mac ni le poste du lecteur : macOS
     n'affiche les siennes qu'au moment où l'on fait défiler, et elles se superposent au contenu
     sans le décaler. Photographiées, elles restent pour toujours et datent l'image. Trouvé le
     22/09/2026 par l'audit des images : elles étaient sur une vingtaine de captures, bord droit
     ou bord bas, et personne ne les avait vues. */
  * { scrollbar-width: none !important; }
  *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
  .demo-banner { display: none !important; }
  .stamp { display: none !important; }
  /* Le message passager du chargement — « Jeu de démonstration chargé » — s'était cuit dans
     la capture des factures et s'est retrouvé sur la page d'accueil du site. Un marqueur qui
     ne dure que huit secondes à l'écran dure pour toujours sur une image. */
  #toast { display: none !important; }
  /* Le numéro de version se graverait dans des images qui vivront des mois : elles annonceraient
     une version périmée à côté de la page Téléchargement, qui, elle, est à jour. La règle vivait
     dans sequence-site.js seulement — une règle apprise d'un côté se vérifie de l'autre. */
  #app-version { visibility: hidden !important; }
  /* La pastille d'essai (8.0.1). Même famille que les deux premières, et la règle de ce fichier
     la couvrait déjà sans la nommer : elle n'existe que parce que la machine du test est une
     installation neuve. Un client qui a payé sa licence ne la voit pas — la montrer figerait
     « Essai — 30 jours » pour toujours sur une image censée montrer le produit. Ce script est
     antérieur à la 8.0.0 : la pastille n'existait pas quand sa règle a été écrite. */
  #lic-banner { display: none !important; }
`;

(async () => {
  const j = journal();
  const bac = [];
  const sortie = process.argv[2] || require('./app.js').sortie('site');
  fs.mkdirSync(sortie, { recursive: true });
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'skanfact-site-'));

  const app = await electron.launch({
    args: ['--no-sandbox', `--user-data-dir=${userData}`, RACINE],
    executablePath: ELECTRON,
    env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
  });
  const win = await app.firstWindow();
  surveiller(win, 'site', bac);
  await win.setViewportSize(LARGE_ECRAN);

  // L'assistant, déroulé avec une société plausible : c'est son nom qui apparaîtra sur les documents
  // photographiés. On reconnaît chaque écran à ce qu'il contient, jamais à son rang.
  await win.waitForSelector('#setup');
  for (let garde = 0; garde < 15 && await win.$('#setup'); garde++) {
    if (await win.$('#sf-form input[name=name]')) {
      await win.fill('#sf-form input[name=name]', 'Atelier Ben Salah SUARL');
      await win.fill('#sf-form input[name=matricule]', '1234567X/A/M/000');
      await win.fill('#sf-form textarea[name=address]', 'Rue de Carthage\n2080 Ariana');
    }
    if (await win.$('[data-act="batiment"]')) {
      await win.click('[data-act="batiment"]');
      await win.waitForSelector('[data-act="batiment"].sel');
    }
    await win.click('#sf-next');
    await win.waitForTimeout(120);
  }
  await win.waitForFunction(() => !document.querySelector('#setup'));
  j.ok('assistant terminé');

  await win.evaluate(() => { location.hash = '#/parametres'; });
  await win.waitForSelector('#set-tabs');
  await win.click('#set-tabs button[data-tab="donnees"]');
  await win.waitForSelector('#load-demo');
  await win.click('#load-demo');
  const ok = await win.waitForSelector('#modal-root #ok', { timeout: 2500 }).catch(() => null);
  if (ok) await ok.click();
  await win.waitForFunction(() => !document.querySelector('#modal-root').children.length);
  await win.waitForFunction(() => location.hash === '#/dashboard');
  j.ok('jeu de démonstration chargé');

  await win.addStyleTag({ content: SANS_MARQUEURS });

  for (const e of ECRANS) {
    await win.evaluate(r => { location.hash = '#/' + r; }, e.route);
    await win.waitForSelector('#view h1');
    if (e.onglet) {
      const t = await win.$(`[data-tab="${e.onglet}"]`);
      if (t && await t.isVisible().catch(() => false)) {
        await t.click({ timeout: 1500 }).catch(() => {});
      }
    }
    await win.waitForTimeout(350);
    await win.addStyleTag({ content: SANS_MARQUEURS });
    await win.screenshot({ path: path.join(sortie, e.nom + '.png') });
  }
  j.ok(`${ECRANS.length} écrans`);

  // L'éditeur : c'est l'image du hero. L'aperçu vit dans une iframe, et le tampon y est dessiné —
  // il faut donc masquer dans la frame, pas seulement dans la page.
  // Un devis NEUF est vide : il ne montre rien. On ouvre une pièce existante du jeu, en cliquant
  // la première ligne de la liste comme le ferait un utilisateur.
  await win.evaluate(() => { location.hash = '#/devis'; });
  await win.waitForSelector('#view table.list tbody tr');
  await win.click('#view table.list tbody tr');
  await win.waitForSelector('#f-head');
  await win.waitForTimeout(500);
  await win.addStyleTag({ content: SANS_MARQUEURS });
  for (const f of win.frames()) {
    await f.addStyleTag({ content: SANS_MARQUEURS }).catch(() => {});
  }
  await win.waitForTimeout(250);
  await win.screenshot({ path: path.join(sortie, 'editeur.png') });
  j.ok('éditeur');

  // ------------------------------------------------------------- les recadrages
  await win.setViewportSize(LARGE_DETAIL);
  await win.waitForTimeout(250);

  for (const d of DETAILS) {
    await win.evaluate(r => { location.hash = '#/' + r; }, d.route);
    await win.waitForSelector('#view h1');
    // Certaines vues ne s'atteignent qu'en OUVRANT une ligne : la fiche d'un client, par exemple,
    // vit sous `#/client/<id>` et l'identifiant n'est connu qu'une fois la liste dessinée. Le
    // site promettait « une fiche qui raconte toute la relation » au-dessus d'une capture de la
    // LISTE des clients — trouvé le 22/09/2026, et invisible tant qu'on ne regarde pas l'image.
    if (d.ouvrir) {
      const alle = await win.evaluate((sel) => {
        const tr = document.querySelector(sel);
        if (!tr) return false;
        location.hash = '#/client/' + tr.dataset.cid;
        return true;
      }, d.ouvrir);
      if (!alle) throw new Error(`« ${d.nom} » : aucune ligne ne correspond à ${d.ouvrir}`);
      // On attend que l'adresse ait VRAIMENT changé : `#view h1` existe déjà sur la liste, donc
      // l'attendre ne prouve rien et on photographierait la page de départ.
      await win.waitForFunction(() => location.hash.startsWith('#/client/'), null, { timeout: 5000 });
      await win.waitForTimeout(500);
    }
    if (d.onglet) {
      const t = await win.$(`[data-tab="${d.onglet}"]`);
      if (t && await t.isVisible().catch(() => false)) await t.click({ timeout: 1500 }).catch(() => {});
    }
    // Le mois de la page Comptabilité. Annoncé et introuvable, il fait ÉCHOUER le parcours : une
    // capture prise sur le mauvais mois ne se voit pas — elle est juste fausse.
    if (d.mois) {
      const quel = d.moisSel || '#c-month';
      const sel = await win.$(quel);
      if (!sel) throw new Error(`« ${d.nom} » : le sélecteur de mois ${quel} est introuvable`);
      await sel.selectOption(d.mois);
      await win.waitForTimeout(400);
    }
    await win.waitForTimeout(400);
    await win.addStyleTag({ content: SANS_MARQUEURS });

    const trouve = await win.evaluate((d) => {
      document.querySelectorAll('[data-cadre]').forEach(e => e.removeAttribute('data-cadre'));
      let el = null;
      if (d.selecteur) {
        el = document.querySelector(d.selecteur);
      } else {
        el = Array.from(document.querySelectorAll('#view .panel')).find((p) => {
          const t = p.querySelector('h2, h3, .panel-head');
          return t && t.textContent.includes(d.titre);
        });
      }
      if (!el) return false;
      el.setAttribute('data-cadre', '1');
      el.scrollIntoView({ block: 'start' });
      // `block: 'start'` colle le haut de l'élément au haut de la zone défilante — c'est-à-dire
      // SOUS l'en-tête collant du tableau, qui recouvre alors sa première ligne. Sur « ce que
      // contient le paquet », la ligne « Pièces de vente émises (PDF joints) » disparaissait ;
      // sur la liste des factures, la première ligne arrivait coupée en deux. Rien ne le signale :
      // l'image est simplement fausse d'une ligne. On redescend de quoi dégager l'en-tête.
      const zone = document.querySelector('#view');
      if (zone) zone.scrollBy(0, -70);
      return true;
    }, d);
    if (!trouve) throw new Error(`recadrage « ${d.nom} » : ${d.selecteur || d.titre} introuvable sur #/${d.route}`);

    await win.waitForTimeout(250);
    const boite = await (await win.$('[data-cadre]')).boundingBox();
    if (!boite) throw new Error(`recadrage « ${d.nom} » : boîte introuvable`);
    // Où finissent les LIGNES du tableau encadré. Une hauteur ronde tranche la dernière en deux,
    // et sur le site le tableau paraît coupé par accident — c'est la première chose qu'on voit.
    boite.bas = await win.evaluate(() => {
      const el = document.querySelector('[data-cadre]');
      if (!el) return [];
      const haut = el.getBoundingClientRect().top;
      return [...el.querySelectorAll('tbody tr, tr')]
        .map(tr => tr.getBoundingClientRect().bottom)
        .filter(b => b > haut).sort((a, b) => a - b);
    });
    await win.screenshot({
      path: path.join(sortie, d.nom + '.png'),
      clip: {
        x: Math.max(0, boite.x), y: Math.max(0, boite.y),
        width: Math.min(boite.width, LARGE_DETAIL.width - Math.max(0, boite.x)),
        height: Math.round(hauteurNette(boite, Math.min(d.haut, LARGE_DETAIL.height - Math.max(0, boite.y)))),
      },
    });
  }
  j.ok(`${DETAILS.length} recadrages`);

  await app.close();
  if (bac.length) { console.error('\nERREURS JS :\n' + bac.join('\n')); process.exit(1); }
  console.log(`\n>>> CAPTURES SITE OK — ${sortie}`);
  process.exit(0);
})().catch(e => { console.error('\n✗ ' + e.message); process.exit(1); });

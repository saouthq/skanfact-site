// --------------------------------------------------------------------------------------------
// Ce banc vivait dans `test/e2e/` du dépôt de l'APPLICATION. Il a déménagé ici le 22/09/2026 :
// le dépôt de l'application est tenu par une autre session, et celui-ci ne doit jamais y écrire.
// Les images du site sont l'affaire du site. Le banc LIT l'application (il la lance et la
// photographie) et n'y écrit rien — `outils/captures/app.js` la trouve et emprunte son harnais.
//
//   node outils/captures/<ce fichier> [dossier de sortie]
// --------------------------------------------------------------------------------------------
// Les captures de SkanFact CABINET destinées au SITE WEB.
//
// Pourquoi ce fichier existe : le site vend depuis la 10.0.0 un logiciel de tenue complet, et il
// n'avait pas UNE image de lui. Les 44 captures du site montrent toutes l'application entreprise.
// On affirmait « votre comptable ne ressaisit plus rien » sans jamais montrer l'écran où les
// écritures du client arrivent — c'est-à-dire sans montrer le produit.
//
// Le jumeau de `captures-site.js`, mêmes règles :
//   - le jeu d'exemple sert de matière, mais ses marqueurs sont masqués (le bandeau « ces dossiers
//     sont fictifs », le message passager, le numéro de version qui périmerait l'image) ;
//   - un écran annoncé et introuvable fait ÉCHOUER le parcours, il n'est jamais sauté en silence —
//     une capture manquante laisse l'ancienne en place, et personne ne s'en aperçoit.
//
// Le dossier photographié est celui qui porte un EXERCICE ENTIER (douze paquets, 10.0.0) : une
// balance sur trois mois ne prouve rien, et une liasse sur huit mois n'est pas une liasse.
//
//   xvfb-run -a node test/e2e/captures-cabinet-site.js [dossier de sortie]
const { playwright, RACINE, ELECTRON, journal, surveiller, dossierCaptures } = require('./app.js').harnais;
const { _electron: electron } = playwright();
const path = require('path');
const fs = require('fs');
const os = require('os');

// Le client dont le livre porte l'exercice complet. Reconnu par son NOM dans la liste, jamais par
// son rang : le jeu d'exemple se réordonne, et une capture prise sur le mauvais dossier ne se voit
// pas — elle est juste fausse.
const DOSSIER = 'Menuiserie Trabelsi';

// Les écrans du portefeuille — ce que le comptable voit avant d'ouvrir un dossier.
const PORTEFEUILLE = [
  { nom: 'cab-production', hash: '#/production' },
  { nom: 'cab-dossiers', hash: '#/dossiers' },
  { nom: 'cab-echeances', hash: '#/echeances' },
  { nom: 'cab-relances', hash: '#/relances' },
];

// Les écrans de tenue, dans l'ordre du mois d'un comptable. `onglet` est celui de `#c-tabs`.
const TENUE = [
  { nom: 'cab-journal', onglet: 'journal' },
  { nom: 'cab-grand-livre', onglet: 'grand-livre' },
  { nom: 'cab-balance', onglet: 'balance' },
  { nom: 'cab-saisie', onglet: 'saisie' },
  { nom: 'cab-banque', onglet: 'banque' },
  { nom: 'cab-declaration', onglet: 'declaration' },
  { nom: 'cab-lettrage', onglet: 'lettrage' },
  { nom: 'cab-revision', onglet: 'revision' },
  { nom: 'cab-liasse', onglet: 'liasse' },
  { nom: 'cab-exercice', onglet: 'exercice' },
];

// Les RECADRAGES : une fenêtre de 1440 px réduite à 560 px dans une colonne de site ne se lit pas.
// Ces vues-là ne montrent qu'un tableau, prises sur une fenêtre plus étroite.
const DETAILS = [
  { nom: 'c-production', hash: '#/production', selecteur: '#view table.list', haut: 400 },
  { nom: 'c-portefeuille', hash: '#/dossiers', selecteur: '#view table.list', haut: 420 },
  // Le journal des VENTES, pas « tous les journaux » : en tête du livre viennent les à-nouveaux,
  // huit lignes de report qui ne parlent de rien. Ce que le site doit montrer, ce sont les
  // factures du client devenues des écritures — avec le nom du tiers en face.
  { nom: 'c-journal', onglet: 'journal', selecteur: '#view table.list', haut: 430, journal: 'VT' },
  { nom: 'c-balance', onglet: 'balance', selecteur: '#view table.list', haut: 420 },
  { nom: 'c-liasse', onglet: 'liasse', selecteur: '#view table.list', haut: 430 },
  { nom: 'c-saisie', onglet: 'saisie', selecteur: '#view table.list', haut: 380 },
];

// Couper un tableau à une hauteur ronde tranche sa dernière ligne en deux, et l'image donne
// l'impression d'un bug plutôt que d'un cadrage. On descend donc jusqu'au dernier bas de ligne
// qui tient dans la hauteur voulue, avec une marge de 12 px pour le filet. Si aucune ligne n'y
// tient — un tableau d'une seule ligne très haute — on garde la hauteur demandée plutôt que de
// rendre une image vide.
function hauteurNette(boite, voulue) {
  const plafond = Math.min(boite.h, voulue);
  const bas = (boite.bas || []).map(b => b - boite.y).filter(h => h <= plafond);
  return bas.length ? Math.max(...bas) + 12 : plafond;
}

const LARGE_ECRAN = { width: 1440, height: 900 };
// Les recadrages du portefeuille tiennent dans 1180 px. Ceux de la COMPTABILITÉ, non : un
// livre-journal porte neuf colonnes et se termine par Débit et Crédit — c'est-à-dire par tout
// l'intérêt. Pris à 1180, le tableau défile horizontalement et le cadre coupe les montants ;
// l'image est jolie et ne prouve rien. On les prend donc à 1600.
const LARGE_DETAIL = { width: 1180, height: 820 };
const LARGE_COMPTA = { width: 1600, height: 900 };

// Ce qui n'existe que parce que la machine est une installation neuve avec des données fictives.
// Le laisser donnerait une image FAUSSE du produit, dans l'autre sens.
const SANS_MARQUEURS = `
  /* Les barres de défilement de Linux, grises et fléchées comme celles de Windows 98. Elles
     n'existent que parce que la machine du test n'est ni un Mac ni le poste du lecteur : macOS
     n'affiche les siennes qu'au moment où l'on fait défiler, et elles se superposent au contenu
     sans le décaler. Photographiées, elles restent pour toujours et datent l'image. Trouvé le
     22/09/2026 par l'audit des images : elles étaient sur une vingtaine de captures, bord droit
     ou bord bas, et personne ne les avait vues. */
  * { scrollbar-width: none !important; }
  *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
  /* « Ces 6 dossiers sont fictifs » — le bandeau du jeu d'exemple. */
  .banner { display: none !important; }
  /* La MÊME chose, ligne par ligne : la pastille « exemple » que drawProduction pose à côté
     du nom de chaque dossier de démonstration (app.js, l.demo). Le bandeau était masqué, pas
     elle — et elle est passée dans les captures du site. Un marqueur qui dit « ce n'est pas un
     vrai client » n'a rien à faire sur la page qui vend le produit. */
  td .badge, td .muted.small { display: none !important; }
  /* Le message passager : huit secondes à l'écran, pour toujours sur une image. */
  #toast { display: none !important; }
  /* Le numéro de version se graverait dans des images qui vivront des mois, et annoncerait une
     version périmée à côté de la page Téléchargement, qui, elle, est à jour. */
  #app-version, .app-version { visibility: hidden !important; }
`;

(async () => {
  const j = journal();
  const bac = [];
  const sortie = process.argv[2] || require('./app.js').sortie('cabinet-site');
  fs.mkdirSync(sortie, { recursive: true });
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'skanfact-cab-site-'));

  const app = await electron.launch({
    args: ['--no-sandbox', `--user-data-dir=${path.join(userData, 'cab')}`,
      path.join(RACINE, 'src', 'cabinet', 'main.js')],
    executablePath: ELECTRON,
    env: { ...process.env },
  });
  const win = await app.firstWindow();
  surveiller(win, 'cabinet-site', bac);
  await win.setViewportSize(LARGE_ECRAN);
  const pause = (ms = 350) => win.waitForTimeout(ms);
  const habiller = async () => { await win.addStyleTag({ content: SANS_MARQUEURS }); };

  // ------------------------------------------------------------------ la porte
  await win.waitForSelector('#lock-pw', { timeout: 25000 });
  await win.fill('#lock-pw', 'cabinet-demonstration-2026');
  if (await win.$('#lock-pw2')) await win.fill('#lock-pw2', 'cabinet-demonstration-2026');
  await win.click('#lock-go');
  await win.waitForSelector('#app', { state: 'visible', timeout: 25000 });
  await pause(900);
  j.ok('cabinet créé');

  // ------------------------------------------------------- l'assistant, avec un cabinet plausible
  // C'est son nom qui apparaîtra en haut de chaque capture. On reconnaît chaque écran à ce qu'il
  // CONTIENT, jamais à son rang : un écran inséré demain décalerait tous les autres.
  for (let garde = 0; garde < 15 && await win.$('#setup'); garde++) {
    const champs = await win.evaluate(() => [...document.querySelectorAll('#setup input, #setup textarea')]
      .filter(i => i.offsetParent).map(i => ({ id: i.id, type: i.type })));
    for (const c of champs) {
      if (!c.id || c.type === 'number' || c.type === 'checkbox') continue;
      // #w-clients est la zone où l'on COLLE une liste de clients. Y écrire le nom du cabinet le
      // crée comme son propre client, et le portefeuille s'ouvre sur un dossier absurde.
      if (/client/i.test(c.id)) continue;
      const v = /mail/i.test(c.id) ? 'contact@cabinet-bensalah.tn'
        : /tel|phone/i.test(c.id) ? '+216 71 000 000'
          : /matricule|mf/i.test(c.id) ? '1478523W/A/M/000'
            : 'Cabinet Ben Salah';
      await win.fill('#setup #' + c.id, v).catch(() => {});
    }
    const suivant = await win.evaluate(() => {
      const w = document.getElementById('setup'); if (!w) return null;
      const b = [...w.querySelectorAll('button')].filter(x => x.offsetParent)
        .find(x => /suivant|continuer|commencer|terminer|parti|démarrer|compris/i.test(x.textContent));
      return b ? (b.id || null) : null;
    });
    if (!suivant) break;
    await win.click('#setup #' + suivant).catch(() => {});
    await pause(600);
  }
  await pause(600);
  j.ok('assistant terminé');

  // ------------------------------------------------------------------ le jeu d'exemple
  await win.evaluate(() => { location.hash = '#/dossiers'; });
  await pause(800);
  if (await win.$('#demo-on')) {
    await win.click('#demo-on');
  } else {
    await win.evaluate(() => { location.hash = '#/reglages'; });
    await pause(700);
    await win.click('#set-tabs button[data-tab="app"]').catch(() => {});
    await pause(600);
    const b = await win.$('#r-demo-on');
    if (!b) throw new Error('aucun chemin pour charger le jeu d\'exemple');
    await b.click();
  }
  await win.waitForTimeout(6000);
  await win.waitForSelector('#view table.list tbody tr', { timeout: 25000 });
  j.ok('jeu d\'exemple chargé');

  // ------------------------------------------------- le portefeuille : ce qu'on voit avant d'ouvrir
  for (const e of PORTEFEUILLE) {
    await win.evaluate(h => { location.hash = h; }, e.hash);
    await win.waitForSelector('#view h1', { timeout: 10000 });
    await pause(650);
    await habiller();
    await win.screenshot({ path: path.join(sortie, e.nom + '.png') });
  }
  j.ok(`${PORTEFEUILLE.length} écrans de portefeuille`);

  // ------------------------------------------------------------------ le dossier, et son livre
  await win.evaluate(() => { location.hash = '#/dossiers'; });
  await win.waitForSelector('#view table.list tbody tr', { timeout: 10000 });
  const ouvert = await win.evaluate((nom) => {
    const tr = [...document.querySelectorAll('#view table.list tbody tr')]
      .find(t => (t.textContent || '').includes(nom));
    if (!tr) return null;
    tr.click();
    return true;
  }, DOSSIER);
  if (!ouvert) throw new Error(`le dossier « ${DOSSIER} » est introuvable dans le jeu d'exemple`);
  await win.waitForSelector('#d-tabs', { timeout: 10000 });
  await pause(700);

  await win.click('#d-tabs button[data-tab="comptabilite"]');
  await win.waitForSelector('#c-tabs', { timeout: 10000 });
  await pause(700);

  // Le livre n'existe pas tant que personne n'a lu les paquets. C'est précisément le geste que le
  // site doit montrer : les écritures du client ENTRENT dans le livre du cabinet.
  const aCreer = await win.$('#lv-relire');
  if (aCreer) {
    await aCreer.click();
    await pause(900);
    // La création demande confirmation (une fenêtre, pas un toast) : on répond, et on attend que
    // les onglets de tenue apparaissent — c'est LEUR présence qui prouve que le livre existe.
    for (let t = 0; t < 8; t++) {
      const ok = await win.$('#modal-root button.btn-primary, #modal-root #ok');
      if (!ok) break;
      await ok.click().catch(() => {});
      await pause(900);
    }
    await win.waitForSelector('#c-tabs button[data-tab="saisie"]', { timeout: 30000 });
    await pause(900);
  }
  const onglets = await win.evaluate(() =>
    [...document.querySelectorAll('#c-tabs button')].map(b => b.dataset.tab));
  j.ok('livre créé — onglets : ' + onglets.join(' · '));

  // L'adresse de la comptabilité de CE dossier. Les recadrages passent par le portefeuille
  // (`#/production`, `#/dossiers`) : sans elle, `#c-tabs` a disparu quand on y revient, et le
  // parcours accuse un onglet absent alors qu'on a simplement changé de page.
  const HASH_COMPTA = await win.evaluate(() => location.hash);
  const revenirAuDossier = async () => {
    if (await win.$('#c-tabs')) return;
    await win.evaluate(h => { location.hash = h; }, HASH_COMPTA);
    await win.waitForSelector('#c-tabs', { timeout: 10000 });
    await pause(700);
  };

  // ------------------------------------------------------------------ les écrans de tenue
  let pris = 0;
  for (const e of TENUE) {
    const b = await win.$(`#c-tabs button[data-tab="${e.onglet}"]`);
    if (!b) throw new Error(`« ${e.nom} » : l'onglet ${e.onglet} est absent de #c-tabs`);
    await b.click();
    await win.waitForSelector('#c-tabs', { timeout: 8000 });
    await pause(750);
    await habiller();
    await win.screenshot({ path: path.join(sortie, e.nom + '.png') });
    pris++;
  }
  j.ok(`${pris} écrans de tenue`);

  // ------------------------------------------------------------------ les recadrages
  for (const d of DETAILS) {
    await win.setViewportSize(d.hash ? LARGE_DETAIL : LARGE_COMPTA);
    await pause(300);
    if (d.hash) {
      await win.evaluate(h => { location.hash = h; }, d.hash);
      await win.waitForSelector('#view h1', { timeout: 10000 });
    } else {
      await revenirAuDossier();
      const b = await win.$(`#c-tabs button[data-tab="${d.onglet}"]`);
      if (!b) throw new Error(`« ${d.nom} » : l'onglet ${d.onglet} est introuvable`);
      await b.click();
    }
    await pause(700);
    // Un filtre annoncé et introuvable fait ÉCHOUER le parcours : posé sur le mauvais journal,
    // il ne se voit pas — l'image est simplement fausse.
    if (d.journal) {
      const sel = await win.$('#lv-journal');
      if (!sel) throw new Error(`« ${d.nom} » : le sélecteur de journal #lv-journal est introuvable`);
      await sel.selectOption(d.journal);
      await pause(600);
    }
    await habiller();

    // Le tableau peut être SOUS la ligne de flottaison (la liasse commence par son avertissement
    // et ses totaux) : un découpage calculé sans l'amener à l'écran tombe hors de l'image, et
    // Playwright refuse avec « clipped area is empty ». On le remonte, puis on relit sa position —
    // jamais l'inverse.
    const boite = await win.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      el.scrollIntoView({ block: 'start' });
      const zone = document.querySelector('#view') || document.scrollingElement;
      if (zone) zone.scrollBy(0, -70);   // l'en-tête collant recouvrait la première ligne
      const r = el.getBoundingClientRect();
      // Où finissent les LIGNES. Une hauteur fixe tranche la dernière en deux : sur le site, le
      // tableau paraît alors coupé par accident, et c'est la première chose qu'on voit. On rend
      // donc la liste des bas de ligne, et l'appelant coupe sur l'une d'elles.
      const bas = [...el.querySelectorAll('tbody tr, tr')]
        .map(tr => tr.getBoundingClientRect().bottom)
        .filter(b => b > r.top).sort((a, b) => a - b);
      return { x: Math.max(0, r.x - 14), y: Math.max(0, r.y - 14), w: r.width + 28, h: r.height + 28, bas };
    }, d.selecteur);
    if (!boite) throw new Error(`« ${d.nom} » : ${d.selecteur} est introuvable`);
    await pause(250);

    await win.screenshot({
      path: path.join(sortie, d.nom + '.png'),
      clip: {
        x: Math.round(boite.x), y: Math.round(boite.y),
        width: Math.round(Math.min(boite.w, (d.hash ? LARGE_DETAIL : LARGE_COMPTA).width - boite.x)),
        height: Math.round(hauteurNette(boite, d.haut)),
      },
    });
  }
  j.ok(`${DETAILS.length} recadrages`);

  await app.close();

  if (bac.length) {
    console.error('\nErreurs JS pendant les captures :\n' + bac.join('\n'));
    process.exit(1);
  }
  console.log('\nCaptures écrites dans ' + sortie);
})().catch(e => { console.error('ÉCHEC : ' + e.message); process.exit(1); });

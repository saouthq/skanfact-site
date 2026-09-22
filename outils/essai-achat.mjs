/* Le parcours d'achat, de bout en bout, contre un FAUX serveur.
   `node outils/essai-achat.mjs`  (Playwright requis : npm i -D playwright)

   Les quatre routes de https://api.skanfact.tn/v1/achat sont interceptées et répondues ici :
   on n'appelle jamais la vraie API, et on peut donc jouer les cas qu'on ne sait pas provoquer
   en vrai — le serveur muet, la carte fermée avec son motif, une commande inconnue.

   Chaque contrôle se prouve en réintroduisant son défaut : les quatre du 22/09/2026 sont
   nommés en tête de leur bloc. Un test qu'on n'a jamais fait tomber ne prouve rien. */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
/* Même résolution que l'audit : `import()` ne sait pas résoudre un DOSSIER, `require` si. */
const req = createRequire(import.meta.url);
let chromium = null;
for (const p of ['playwright',
                 path.join(RACINE, 'node_modules', 'playwright'),
                 path.join(RACINE, '..', 'skanfact', 'node_modules', 'playwright'),
                 '/opt/node22/lib/node_modules/playwright',
                 '/usr/lib/node_modules/playwright']) {
  try { chromium = req(p).chromium; break; } catch { /* on essaie le suivant */ }
}
if (!chromium) {
  console.error('\nPlaywright est introuvable : npm i -D playwright\n');
  process.exit(2);
}
/* Le chromium livré avec l'image, quand Playwright n'a pas téléchargé le sien. */
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium']
  .find(p => fs.existsSync(p));

const R = RACINE, PORT = 8127;
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.ico':'image/x-icon'};
const s=http.createServer((rq,rs)=>{let p=decodeURIComponent(rq.url.split('?')[0]); if(p==='/')p='/index.html'; const f=path.join(R,p);
 if(!f.startsWith(R)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);rs.end();return;}
 rs.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'}); rs.end(fs.readFileSync(f));});
await new Promise(r=>s.listen(PORT,'127.0.0.1',r));

let vert=0, rouge=0;
const dit=(ok,quoi,détail='')=>{ ok?vert++:rouge++; console.log(`${ok?'  ok ':'  ✗  '} ${quoi}${détail?'  — '+détail:''}`); };

const nav=await chromium.launch(EXE ? { executablePath: EXE } : {});

// `faux` : ce que l'API répond. `null` => la route n'existe pas (panne).
async function ouvrir(page, url, faux) {
  const posts = [];
  await page.route('**/*', r => {
    const u = r.request().url();
    // Le relais de contact : la commande y part d'abord, pour survivre à un échec de carte.
    if (u.includes('skanbenamor10.workers.dev')) {
      return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    }
    if (u.startsWith('https://api.skanfact.tn/')) {
      if (r.request().method() === 'POST') posts.push({ u, corps: r.request().postDataJSON() });
      const rep = faux(u, r.request().method());
      if (rep === null) return r.abort();
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rep) });
    }
    return u.includes('127.0.0.1') ? r.continue() : r.abort();
  });
  await page.goto(`http://127.0.0.1:${PORT}/${url}`, { waitUntil: 'networkidle' });
  return posts;
}

const BAREME_OUVERT = { ouvert: true, devise: 'TND', tva: 19, timbre: 1, remiseParrainage: 20,
  offres: [ { id:'independant', label:'Indépendant', ht:420, ttc:500.8 },
            { id:'entreprise',  label:'Entreprise',  ht:740, ttc:881.6 } ] };

console.log('\n— 1. Le barème du serveur écrase les prix écrits (390 -> 420) —');
{
  const ctx=await nav.newContext({viewport:{width:1440,height:900}}); const page=await ctx.newPage();
  await ouvrir(page, 'tarifs.html', () => BAREME_OUVERT);
  await page.waitForTimeout(250);
  const lu = await page.evaluate(()=>({
    ind: document.querySelector('[data-offre=independant] .v')?.textContent,
    ent: document.querySelector('[data-offre=entreprise] .v')?.textContent,
    ttcInd: document.querySelector('[data-offre=independant] [data-prix^="ttc:"]')?.textContent,
    attr: document.querySelector('[data-offre=independant] [data-prix^="ttc:"]')?.getAttribute('data-prix')
  }));
  dit(lu.ind==='420', 'le prix Indépendant devient 420', `lu : ${lu.ind}`);
  dit(lu.ent==='740', 'le prix Entreprise devient 740', `lu : ${lu.ent}`);
  dit(lu.attr==='ttc:420', 'la marque data-prix est réécrite', `lue : ${lu.attr}`);
  // 420 × 1,19 + 1 = 500,800  (calculé à la main, jamais recopié de la sortie)
  dit((lu.ttcInd||'').indexOf('500,800')===0, 'le TTC se recalcule sur le nouveau prix', `lu : ${lu.ttcInd}`);
  await ctx.close();
}

console.log('\n— 2. L’API muette : la page garde ses prix écrits —');
{
  const ctx=await nav.newContext({viewport:{width:1440,height:900}}); const page=await ctx.newPage();
  await ouvrir(page, 'tarifs.html', () => null);
  await page.waitForTimeout(250);
  const lu = await page.evaluate(()=>({
    ind: document.querySelector('[data-offre=independant] .v')?.textContent,
    ttc: document.querySelector('[data-offre=independant] [data-prix^="ttc:"]')?.textContent }));
  dit(lu.ind==='390', 'le prix écrit reste affiché', `lu : ${lu.ind}`);
  dit((lu.ttc||'').indexOf('465,100')===0, 'le TTC écrit reste juste', `lu : ${lu.ttc}`);
  await ctx.close();
}

console.log('\n— 3. ouvert:true allume la carte, ouvert:false la referme et DIT pourquoi —');
for (const [ouvert, raison] of [[true,''],[false,'Notre compte marchand est en cours de validation.']]) {
  const ctx=await nav.newContext({viewport:{width:1440,height:900}}); const page=await ctx.newPage();
  await ouvrir(page, 'acheter.html', () => ({ ...BAREME_OUVERT, ouvert, raison }));
  await page.waitForTimeout(250);
  const lu = await page.evaluate(()=>({
    regl: !document.getElementById('bloc-reglement')?.hidden,
    oui: !document.querySelector('[data-paiement=oui]')?.hidden,
    non: !document.querySelector('[data-paiement=non]')?.hidden,
    ferme: document.getElementById('paiement-ferme')?.hidden ? '' : document.getElementById('paiement-ferme')?.textContent,
    ht: document.querySelector('input[data-offre=independant]')?.getAttribute('data-ht') }));
  dit(lu.regl===ouvert, `le choix du règlement est ${ouvert?'visible':'masqué'}`);
  dit(lu.oui===ouvert && lu.non===!ouvert, 'la phrase de l’étape 3 suit l’état');
  dit(ouvert ? lu.ferme==='' : lu.ferme===raison, ouvert?'aucun motif affiché':'le motif du serveur s’affiche', lu.ferme);
  dit(lu.ht==='420', 'le décompte part du nouveau prix', `data-ht : ${lu.ht}`);
  await ctx.close();
}

console.log('\n— 4. La commande envoie l’identifiant, jamais le prix —');
{
  const ctx=await nav.newContext({viewport:{width:1440,height:900}}); const page=await ctx.newPage();
  const posts = await ouvrir(page, 'acheter.html', (u,m) =>
    m==='POST' ? { commande:'CMD-2026-0007', payUrl:'http://127.0.0.1:'+PORT+'/paiement-ok.html?commande=CMD-2026-0007&r=ok', montant:500.8, devise:'TND', parraine:false }
               : { ...BAREME_OUVERT, ouvert:true });
  await page.waitForTimeout(250);
  await page.evaluate(()=>{ document.querySelector('input[data-offre=entreprise]').checked = true; });
  // Tous les champs obligatoires : un refus de saisie n'envoie rien, et le test
  // conclurait « la route n'est pas branchée » sur un formulaire parfaitement juste.
  await page.fill('#raison','Atelier Ben Salah SUARL');
  await page.fill('#matricule','1234567A');
  await page.fill('#adresse','12 rue de Carthage, 1002 Tunis');
  await page.fill('#nom','Skander Ben Amor');
  await page.fill('#email','test@test.com');
  await page.check('[data-regl=carte]');
  await page.click('form button[type=submit]');
  await page.waitForTimeout(700);
  const env = posts.filter(p=>p.u.includes('/commander'))[0];
  dit(!!env, 'la commande part sur /v1/achat/commander');
  if (env) {
    dit(env.corps.offre==='entreprise', 'elle envoie l’identifiant de l’offre', JSON.stringify(env.corps.offre));
    const interdits = Object.keys(env.corps).filter(k=>/prix|montant|ttc|ht|remise/i.test(k));
    dit(interdits.length===0, 'elle n’envoie NI prix NI remise', interdits.join(', ')||'aucun champ de prix');
    dit(env.corps.nom==='Skander Ben Amor' && env.corps.email==='test@test.com', 'elle envoie qui achète');
  }
  await ctx.close();
}

console.log('\n— 5. La page de retour affiche la phrase du serveur, telle quelle —');
for (const [etat, phrase, titre] of [
  ['payee','Votre paiement de 500,800 DT est confirmé. La clé part par email.','Merci, votre paiement est passé.'],
  ['abandonnee','Le paiement a été abandonné. Rien ne vous a été débité.','Le paiement n’est pas allé au bout.'],
  ['inconnue','Nous ne retrouvons aucune commande sous cette référence.','Nous ne retrouvons pas cette commande.']]) {
  const ctx=await nav.newContext({viewport:{width:1440,height:900}}); const page=await ctx.newPage();
  await ouvrir(page, 'paiement-ok.html?commande=CMD-2026-0007&r=ok',
    (u)=> u.includes('/etat/') ? { etat, phrase, offre:'entreprise', montant:500.8, devise:'TND' } : BAREME_OUVERT);
  await page.waitForTimeout(300);
  const lu = await page.evaluate(()=>({
    h1: document.querySelector('main h1')?.textContent.trim(),
    etat: document.getElementById('etat-commande')?.hidden ? '' : document.getElementById('etat-commande')?.textContent.trim(),
    ref: document.getElementById('ref-paiement')?.hidden ? '' : document.getElementById('ref-paiement')?.textContent.trim(),
    chapeauxVisibles: [...document.querySelectorAll('main .chapeau')].filter(e=>!e.hidden).length }));
  dit(lu.etat===phrase, `[${etat}] la phrase s’affiche telle quelle`);
  dit(lu.h1===titre, `[${etat}] le titre suit l’état`, `lu : ${lu.h1}`);
  dit(lu.chapeauxVisibles===1, `[${etat}] le chapeau deviné s’efface`, `${lu.chapeauxVisibles} chapeau(x)`);
  dit((lu.ref||'').includes('CMD-2026-0007'), `[${etat}] la référence est citée`);
  await ctx.close();
}

console.log('\n— 6. La route d’état ne rend jamais la clé —');
{
  const ctx=await nav.newContext({viewport:{width:1440,height:900}}); const page=await ctx.newPage();
  await ouvrir(page, 'paiement-ok.html?commande=CMD-2026-0007&r=ok',
    (u)=> u.includes('/etat/') ? { etat:'payee', phrase:'Paiement confirmé.', cle:'SKAN1.NEDEVRAITPASSAFFICHER' } : BAREME_OUVERT);
  await page.waitForTimeout(300);
  const corps = await page.evaluate(()=>document.body.innerText);
  dit(corps.indexOf('SKAN1.')===-1, 'rien de la clé n’atteint la page', corps.indexOf('SKAN1.')===-1?'':'FUITE');
  await ctx.close();
}

console.log(`\n${vert} vert(s) · ${rouge} rouge(s)`);
await nav.close(); s.close();
process.exit(rouge ? 1 : 0);

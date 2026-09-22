// Où vit le dépôt de l'APPLICATION, et comment on lui emprunte son harnais.
//
// Les trois bancs de ce dossier photographient SkanFact et SkanFact Cabinet pour produire les
// images du site. Ils ont longtemps vécu dans `test/e2e/` du dépôt de l'application — c'est là
// qu'est le harnais qui sait lancer Electron. Ils ont déménagé ici le 22/09/2026, sur décision
// de Skander : le dépôt de l'application est tenu par une autre session, et ce dépôt-ci ne doit
// jamais y écrire. Les images du site sont l'affaire du site.
//
// On ne COPIE pas `harnais.js` : on le lit là où il est. Une copie divergerait au premier
// ajustement — c'est la règle que ce projet réapprend depuis la 6.8.0.
const fs = require('fs');
const path = require('path');

// Les endroits plausibles, du plus précis au plus général. `SKANFACT_APP` permet de le dire à la
// main quand le dépôt n'est pas rangé à côté.
const ENDROITS = [
  process.env.SKANFACT_APP,
  path.join(__dirname, '..', '..', '..', 'skanfact'),
  path.join(process.env.HOME || '/root', 'skanfact'),
].filter(Boolean);

function racineApplication() {
  for (const p of ENDROITS) {
    if (fs.existsSync(path.join(p, 'test', 'e2e', 'harnais.js'))) return path.resolve(p);
  }
  console.error('\nLe dépôt de l\'application est introuvable. Les bancs de captures le LISENT —\n'
    + 'ils n\'y écrivent jamais — pour lancer l\'application et la photographier.\n'
    + 'Cherché dans :\n  ' + ENDROITS.join('\n  ') + '\n'
    + 'Indique-le avec SKANFACT_APP=/chemin/vers/skanfact\n');
  process.exit(4);
}

const APP = racineApplication();

// La sortie par défaut du harnais est `dist-e2e/` DANS le dépôt de l'application. C'est une
// écriture chez quelqu'un d'autre : les captures du site n'ont rien à y faire, et la règle est
// « lecture seule ». Elles atterrissent donc ici, dans `dist-captures/` du dépôt du site.
const SITE = path.join(__dirname, '..', '..');
function sortie(nom) {
  const d = process.env.SHOTS || path.join(SITE, 'dist-captures', nom);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

module.exports = { APP, SITE, sortie, harnais: require(path.join(APP, 'test', 'e2e', 'harnais.js')) };

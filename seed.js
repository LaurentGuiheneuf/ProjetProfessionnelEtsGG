const bcrypt = require('bcrypt');
const db = require('./db');

const [nom, mdp, role = 'utilisateur'] = process.argv.slice(2);

if (!nom || !mdp || !['utilisateur', 'admin'].includes(role)) {
  console.error('Usage : node seed.js nom motdepasse [utilisateur|admin]');
  process.exit(1);
}

try {
  db.prepare('INSERT INTO utilisateur (nom, mot_de_passe_hache, role) VALUES (?, ?, ?)')
    .run(nom, bcrypt.hashSync(mdp, 12), role);
  console.log(`Compte créé : ${nom} (${role})`);
} catch (e) {
  if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') console.error('Ce nom existe déjà.');
  else throw e;
}
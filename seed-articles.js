const db = require('./db');

const articles = [
  ['3000000000014', 'Primaire époxy', 'Gris', 'Mat', 'Fabricant A'],
  ['3000000000021', 'Laque polyuréthane', 'Blanc', 'Satiné', 'Fabricant B'],
  ['3000000000038', 'Peinture poudre', 'Noir', 'Brillant', 'Fabricant A'],
];

const ins = db.prepare(
  'INSERT OR IGNORE INTO article (code_barre, nom, couleur, finition, fabricant) VALUES (?, ?, ?, ?, ?)'
);
articles.forEach(a => ins.run(...a));
console.log('Articles de test insérés.');
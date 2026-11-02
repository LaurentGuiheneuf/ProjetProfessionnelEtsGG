const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'stock.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS utilisateur (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE,
  mot_de_passe_hache TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('utilisateur','admin'))
);
CREATE TABLE IF NOT EXISTS article (
  code_barre TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  couleur TEXT NOT NULL,
  finition TEXT NOT NULL,
  fabricant TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS mouvement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_barre TEXT NOT NULL REFERENCES article(code_barre),
  quantite INTEGER NOT NULL CHECK (quantite <> 0),
  date TEXT NOT NULL DEFAULT (datetime('now')),
  utilisateur_id INTEGER NOT NULL REFERENCES utilisateur(id)
);
`);

// Migration : colonnes ajoutées pour l'historique et les corrections
const colonnes = db.prepare('PRAGMA table_info(mouvement)').all().map((c) => c.name);
if (!colonnes.includes('motif')) {
  db.exec('ALTER TABLE mouvement ADD COLUMN motif TEXT');
}
if (!colonnes.includes('correctif')) {
  db.exec('ALTER TABLE mouvement ADD COLUMN correctif INTEGER NOT NULL DEFAULT 0');
}

db.exec('CREATE INDEX IF NOT EXISTS idx_mouvement_code ON mouvement(code_barre)');
db.exec('CREATE INDEX IF NOT EXISTS idx_mouvement_date ON mouvement(date)');

module.exports = db;
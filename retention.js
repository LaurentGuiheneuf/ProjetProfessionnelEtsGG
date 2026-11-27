const fs = require('fs');
const path = require('path');
const db = require('./db');

const NOM_ANONYME = 'Ancien utilisateur';
const DELAI = '-1 year';   // mouvements, journal des suppressions, comptes désactivés
const PERIODE_JOURS = 7;   // fréquence d'exécution

db.exec(`
CREATE TABLE IF NOT EXISTS maintenance (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL
);
`);

function idAnonyme() {
  const u = db.prepare('SELECT id FROM utilisateur WHERE nom = ?').get(NOM_ANONYME);
  if (u) return u.id;
  const r = db.prepare(
    "INSERT INTO utilisateur (nom, mot_de_passe_hache, role, actif) VALUES (?, '!', 'utilisateur', 0)"
  ).run(NOM_ANONYME);
  return Number(r.lastInsertRowid);
}

function compter(anonId) {
  const mouvements = db.prepare(
    `SELECT COUNT(*) AS n FROM mouvement
     WHERE mouvement.date < datetime('now', ?) AND utilisateur_id <> ?`
  ).get(DELAI, anonId).n;
  const journal = db.prepare(
    `SELECT COUNT(*) AS n FROM journal_suppression
     WHERE journal_suppression.date < datetime('now', ?)`
  ).get(DELAI).n;
  const comptes = db.prepare(
    `SELECT COUNT(*) AS n FROM utilisateur
     WHERE actif = 0 AND desactive_le IS NOT NULL
       AND desactive_le < datetime('now', ?) AND id <> ?`
  ).get(DELAI, anonId).n;
  return { mouvements, journal, comptes };
}

const executer = db.transaction((anonId) => {
  const mouvements = db.prepare(
    `UPDATE mouvement SET utilisateur_id = ?
     WHERE mouvement.date < datetime('now', ?) AND utilisateur_id <> ?`
  ).run(anonId, DELAI, anonId).changes;

  const journal = db.prepare(
    `DELETE FROM journal_suppression
     WHERE journal_suppression.date < datetime('now', ?)`
  ).run(DELAI).changes;

  const anciens = db.prepare(
    `SELECT id FROM utilisateur
     WHERE actif = 0 AND desactive_le IS NOT NULL
       AND desactive_le < datetime('now', ?) AND id <> ?`
  ).all(DELAI, anonId);

  for (const { id } of anciens) {
    db.prepare('UPDATE mouvement SET utilisateur_id = ? WHERE utilisateur_id = ?').run(anonId, id);
    db.prepare('UPDATE journal_suppression SET utilisateur_id = ? WHERE utilisateur_id = ?').run(anonId, id);
    db.prepare('UPDATE article SET cree_par = NULL WHERE cree_par = ?').run(id);
    db.prepare('DELETE FROM utilisateur WHERE id = ?').run(id);
  }
  return { mouvements, journal, comptes: anciens.length };
});

function dernierPassage() {
  const l = db.prepare("SELECT valeur FROM maintenance WHERE cle = 'retention'").get();
  return l ? JSON.parse(l.valeur) : null;
}

function enregistrer(resultat) {
  db.prepare(
    `INSERT INTO maintenance (cle, valeur) VALUES ('retention', ?)
     ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur`
  ).run(JSON.stringify({ date: new Date().toISOString(), ...resultat }));
}

async function appliquer({ simulation = false, force = false } = {}) {
  if (!force && !simulation) {
    const dernier = dernierPassage();
    if (dernier) {
      const jours = (Date.now() - new Date(dernier.date).getTime()) / 86400000;
      if (jours < PERIODE_JOURS) return null; // pas encore l'heure
    }
  }

  const existant = db.prepare('SELECT id FROM utilisateur WHERE nom = ?').get(NOM_ANONYME);
  const aTraiter = compter(existant ? existant.id : -1);
  if (simulation) return { simulation: true, ...aTraiter };

  if (!aTraiter.mouvements && !aTraiter.journal && !aTraiter.comptes) {
    enregistrer(aTraiter);
    return aTraiter;
  }

  // Sauvegarde préventive : supprimée par la rotation de backup.ps1 (motif stock-*.db)
  const dossier = path.join(__dirname, 'sauvegardes');
  fs.mkdirSync(dossier, { recursive: true });
  const nom = `stock-avant-retention-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  await db.backup(path.join(dossier, nom));

  const resultat = executer(idAnonyme());
  enregistrer(resultat);
  console.log(
    `Rétention : ${resultat.mouvements} mouvement(s) anonymisé(s), ` +
    `${resultat.journal} ligne(s) de journal supprimée(s), ` +
    `${resultat.comptes} compte(s) supprimé(s).`
  );
  return resultat;
}

function planifier() {
  const lancer = () => appliquer().catch((e) => console.error('Rétention :', e));
  setTimeout(lancer, 60 * 1000).unref();            // 1 minute après le démarrage
  setInterval(lancer, 6 * 60 * 60 * 1000).unref();  // vérification toutes les 6 heures
}

// Utilisation en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  appliquer({ simulation: args.includes('--simulation'), force: args.includes('--maintenant') })
    .then((r) => {
      console.log(r ?? `Dernier passage il y a moins de ${PERIODE_JOURS} jours (ajoute --maintenant pour forcer).`);
      db.close();
    })
    .catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { appliquer, planifier, NOM_ANONYME };
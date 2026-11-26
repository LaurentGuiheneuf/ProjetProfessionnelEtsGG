const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db');
const crypto = require('crypto');

const app = express();

const CHAMPS = ['nom', 'couleur', 'finition', 'texture', 'fabricant'];

// Derrière un proxy HTTPS (hébergeur) : décommenter
// app.set('trust proxy', 1);

// --- Sécurité des en-têtes ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'wasm-unsafe-eval'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Sessions ---
if (!process.env.SESSION_SECRET) {
  console.error('Variable SESSION_SECRET manquante.');
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

// --- Resynchronisation de la session avec la base (rôle, statut) ---
const SQL_UTILISATEUR = db.prepare('SELECT id, role, actif FROM utilisateur WHERE id = ?');

app.use((req, res, next) => {
  if (!req.session.user) return next();
  const u = SQL_UTILISATEUR.get(req.session.user.id);
  if (!u || !u.actif) {
    delete req.session.user; // compte supprimé ou désactivé : déconnexion
    return next();
  }
  req.session.user.role = u.role; // changement de rôle appliqué immédiatement
  next();
});
// --- Protection CSRF ---
const METHODES_SURES = new Set(['GET', 'HEAD', 'OPTIONS']);

function origineAutorisee(req) {
  const site = req.get('sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'none';
  const origine = req.get('origin');
  if (origine) {
    try { return new URL(origine).host === req.get('host'); } catch { return false; }
  }
  return false; // ni Sec-Fetch-Site ni Origin : requête refusée
}

app.use((req, res, next) => {
  if (METHODES_SURES.has(req.method)) return next();

  if (!origineAutorisee(req))
    return res.status(403).json({ erreur: 'Origine de la requête refusée' });

  if (req.path === '/api/login') return next();

  const attendu = req.session.csrf;
  const recu = req.get('x-csrf-token');
  if (!attendu || typeof recu !== 'string')
    return res.status(403).json({ erreur: 'Jeton CSRF manquant' });

  const a = Buffer.from(attendu);
  const b = Buffer.from(recu);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return res.status(403).json({ erreur: 'Jeton CSRF invalide' });

  next();
});

// --- Middlewares d'accès ---
const exigerConnexion = (req, res, next) =>
  req.session.user ? next() : res.status(401).json({ erreur: 'Non connecté' });

app.get('/api/csrf', exigerConnexion, (req, res) => {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(32).toString('hex');
  res.set('Cache-Control', 'no-store');
  res.json({ token: req.session.csrf });
});

const exigerAdmin = (req, res, next) =>
  req.session.user?.role === 'admin'
    ? next()
    : res.status(403).json({ erreur: 'Accès refusé' });

// --- Authentification ---
const limiteurConnexion = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

app.post('/api/login', limiteurConnexion, async (req, res) => {
  const { utilisateur, password } = req.body;
  if (!utilisateur || !password)
    return res.status(400).json({ erreur: 'Champs manquants' });

  const u = db.prepare('SELECT * FROM utilisateur WHERE nom = ?').get(utilisateur);
  const ok = u && u.actif === 1 && await bcrypt.compare(password, u.mot_de_passe_hache);
  if (!ok) return res.status(401).json({ erreur: 'Identifiants invalides' });

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ erreur: 'Erreur serveur' });
    req.session.user = { id: u.id, role: u.role };
    res.json({ role: u.role });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// --- Stock actuel d'un article = somme des mouvements signés ---
const SQL_TOTAL = `
  SELECT COALESCE(SUM(quantite), 0) AS total
  FROM mouvement WHERE code_barre = ?`;

// --- Scan : infos d'un article + stock actuel ---
app.get('/api/articles/:code', exigerConnexion, (req, res) => {
  const code = normaliserCode(req.params.code);
  const article = db.prepare(
    'SELECT code_barre, nom, couleur, finition, texture, fabricant, actif FROM article WHERE code_barre = ?'
  ).get(code);
  if (!article) return res.status(404).json({ erreur: 'Article inconnu' });
  if (!article.actif) return res.status(404).json({ erreur: 'Article archivé' });

  const { actif, ...fiche } = article;
  fiche.stock = db.prepare(SQL_TOTAL).get(code).total;
  res.json(fiche);
});

// --- Enregistrement d'un mouvement (+ ajout / − utilisation) ---
const enregistrerMouvement = db.transaction((code, q, userId, motif = null, correctif = 0) => {
  const { total } = db.prepare(SQL_TOTAL).get(code);
  if (total + q < 0) throw new Error('STOCK_INSUFFISANT');

  db.prepare(
    'INSERT INTO mouvement (code_barre, quantite, utilisateur_id, motif, correctif) VALUES (?, ?, ?, ?, ?)'
  ).run(code, q, userId, motif, correctif);

  return total + q;
});

app.post('/api/mouvements', exigerConnexion, (req, res) => {
const code_barre = normaliserCode(req.body.code_barre);
const q = Number(req.body.quantite);

  if (!code_barre || !Number.isInteger(q) || q === 0)
    return res.status(400).json({ erreur: 'Données invalides' });

  const article = db.prepare('SELECT actif FROM article WHERE code_barre = ?').get(code_barre);
  if (!article) return res.status(404).json({ erreur: 'Article inconnu' });
  if (!article.actif) return res.status(409).json({ erreur: 'Article archivé' });

  try {
    const nouveauStock = enregistrerMouvement(code_barre, q, req.session.user.id);
    res.status(201).json({ stock: nouveauStock });
  } catch (e) {
    if (e.message === 'STOCK_INSUFFISANT')
      return res.status(409).json({ erreur: 'Quantité utilisée supérieure au stock disponible' });
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// --- Admin : validation ---

// --- Codes-barres : format fabricant (Code 128) ou EAN (8/12/13 chiffres) ---
const FORMAT_FABRICANT = /^\d{7}[A-Z]{2}\d{5}[A-Z]{2}36\d{5}$/;

function normaliserCode(brut) {
  return String(brut ?? '').trim().toUpperCase().replace(/^[#$]/, '').replace(/\s+/g, '');
}

function codeEanValide(code) {
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(code)) return false;
  const chiffres = code.split('').map(Number);
  const cle = chiffres.pop();
  const somme = chiffres
    .reverse()
    .reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (somme % 10)) % 10 === cle;
}

function codeValide(code) {
  return FORMAT_FABRICANT.test(code) || codeEanValide(code);
}

function lireArticle(body) {
  const a = {};
  for (const c of CHAMPS) {
    const v = typeof body[c] === 'string' ? body[c].trim() : '';
    if (!v || v.length > 100) return null;
    a[c] = v;
  }
  return a;
}

// --- Suggestions de saisie (comptes connectés, sans prix) ---
app.get('/api/suggestions', exigerConnexion, (req, res) => {
  const liste = (col) =>
    db.prepare(
      `SELECT DISTINCT ${col} AS v FROM article WHERE actif = 1 AND ${col} <> '' ORDER BY v COLLATE NOCASE`
    ).all().map((r) => r.v);
  res.json({
    nom: liste('nom'),
    couleur: liste('couleur'),
    finition: liste('finition'),
    texture: liste('texture'),
    fabricant: liste('fabricant'),
  });
});

// --- Création d'un article par un utilisateur (code inconnu au scan) ---
const limiteurCreation = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erreur: 'Trop de créations d\u2019articles. Réessaie plus tard.' },
});

app.post('/api/articles', exigerConnexion, limiteurCreation, (req, res) => {
  const code = normaliserCode(req.body.code_barre);
  const a = lireArticle(req.body);

  if (!codeValide(code))
    return res.status(400).json({ erreur: 'Code-barre invalide (format fabricant, ou EAN à clé correcte)' });
  if (!a)
    return res.status(400).json({ erreur: 'Champs manquants ou trop longs (100 caractères max)' });

  const existant = db.prepare('SELECT actif FROM article WHERE code_barre = ?').get(code);
  if (existant)
    return res.status(409).json({
      erreur: existant.actif
        ? 'Cet article existe déjà'
        : 'Cet article est archivé : demande à un administrateur de le restaurer',
    });

  try {
    const estAdmin = req.session.user.role === 'admin';
    db.prepare(
      `INSERT INTO article (code_barre, nom, couleur, finition, texture, fabricant, a_verifier, cree_par)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(code, a.nom, a.couleur, a.finition, a.texture, a.fabricant,
          estAdmin ? 0 : 1, req.session.user.id);
    res.status(201).json({ ok: true, code_barre: code });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

function lirePrix(valeur) {
  if (valeur === undefined || valeur === null || String(valeur).trim() === '')
    return { ok: true, centimes: null };
  const m = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(String(valeur).trim());
  if (!m) return { ok: false };
  return { ok: true, centimes: Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0')) };
}

// --- Admin : inventaire trié / filtré ---
const TRI_SQL = {
  nom: 'a.nom COLLATE NOCASE',
  couleur: 'a.couleur COLLATE NOCASE',
  finition: 'a.finition COLLATE NOCASE',
  texture: 'a.texture COLLATE NOCASE',
  fabricant: 'a.fabricant COLLATE NOCASE',
  quantite: 'quantite',
  prix: 'a.prix_centimes',
  valeur: 'valeur_centimes',
};

app.get('/api/admin/inventaire', exigerAdmin, (req, res) => {
  const colonne = Object.hasOwn(TRI_SQL, req.query.tri) ? TRI_SQL[req.query.tri] : TRI_SQL.nom;
  const ordre = req.query.ordre === 'desc' ? 'DESC' : 'ASC';
  const filtre = (cle) => `%${req.query[cle] ?? ''}%`;
  const actif = req.query.statut === 'archives' ? 0 : 1;
  const aVerifier = req.query.statut === 'verifier' ? 1 : 0;

  const lignes = db.prepare(`
    SELECT a.code_barre, a.nom, a.couleur, a.finition, a.texture, a.fabricant,
           a.prix_centimes, a.actif, a.a_verifier,
           COALESCE(SUM(m.quantite), 0) AS quantite,
           COUNT(m.id) AS mouvements,
           COALESCE(SUM(m.quantite), 0) * COALESCE(a.prix_centimes, 0) AS valeur_centimes
    FROM article a
    LEFT JOIN mouvement m ON m.code_barre = a.code_barre
    WHERE a.actif = ? AND (? = 0 OR a.a_verifier = 1)
      AND a.nom LIKE ? AND a.couleur LIKE ? AND a.finition LIKE ?
      AND a.texture LIKE ? AND a.fabricant LIKE ?
    GROUP BY a.code_barre
    ORDER BY ${colonne} ${ordre}
  `).all(actif, aVerifier, filtre('nom'), filtre('couleur'), filtre('finition'),
         filtre('texture'), filtre('fabricant'));

  res.json(lignes);
});

// --- Admin : créer un article (+ stock initial optionnel) ---
const creerArticle = db.transaction((code, a, prixCentimes, stockInitial, userId) => {
  db.prepare(
    `INSERT INTO article (code_barre, nom, couleur, finition, texture, fabricant, prix_centimes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(code, a.nom, a.couleur, a.finition, a.texture, a.fabricant, prixCentimes);
  if (stockInitial > 0) {
    db.prepare(
      'INSERT INTO mouvement (code_barre, quantite, utilisateur_id, motif) VALUES (?, ?, ?, ?)'
    ).run(code, stockInitial, userId, 'Stock initial');
  }
});

app.post('/api/admin/articles', exigerAdmin, (req, res) => {
  const code = normaliserCode(req.body.code_barre);
  const a = lireArticle(req.body);
  const prix = lirePrix(req.body.prix);
  const stockInitial = Number(req.body.stock_initial ?? 0);

  if (!codeValide(code))
    return res.status(400).json({ erreur: 'Code-barre invalide (8, 12 ou 13 chiffres, clé correcte)' });
  if (!a)
    return res.status(400).json({ erreur: 'Champs manquants ou trop longs (100 caractères max)' });
  if (!prix.ok)
    return res.status(400).json({ erreur: 'Prix invalide (ex. 12,50)' });
  if (!Number.isInteger(stockInitial) || stockInitial < 0)
    return res.status(400).json({ erreur: 'Stock initial invalide' });

  const existant = db.prepare('SELECT actif FROM article WHERE code_barre = ?').get(code);
  if (existant)
    return res.status(409).json({
      erreur: existant.actif
        ? 'Ce code-barre existe déjà'
        : 'Ce code-barre existe déjà (article archivé : restaure-le depuis la liste des archivés)',
    });

  try {
    creerArticle(code, a, prix.centimes, stockInitial, req.session.user.id);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// --- Admin : modifier un article (le code-barre ne change pas) ---
app.put('/api/admin/articles/:code', exigerAdmin, (req, res) => {
  const a = lireArticle(req.body);
  if (!a) return res.status(400).json({ erreur: 'Champs manquants ou trop longs (100 caractères max)' });
  const prix = lirePrix(req.body.prix);
  if (!prix.ok) return res.status(400).json({ erreur: 'Prix au kg invalide (ex. 12,50)' });

  const r = db.prepare(
    `UPDATE article SET nom = ?, couleur = ?, finition = ?, texture = ?, fabricant = ?,
                        prix_centimes = ?, a_verifier = 0
     WHERE code_barre = ?`
  ).run(a.nom, a.couleur, a.finition, a.texture, a.fabricant, prix.centimes, req.params.code);

  if (r.changes === 0) return res.status(404).json({ erreur: 'Article inconnu' });
  res.json({ ok: true });
});

// --- Admin : supprimer un article (refusé s'il a des mouvements) ---
app.delete('/api/admin/articles/:code', exigerAdmin, (req, res) => {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM mouvement WHERE code_barre = ?')
    .get(req.params.code);
  if (n > 0)
    return res.status(409).json({ erreur: 'Suppression impossible : des mouvements existent. Archive l’article.' });

  const r = db.prepare('DELETE FROM article WHERE code_barre = ?').run(req.params.code);
  if (r.changes === 0) return res.status(404).json({ erreur: 'Article inconnu' });
  res.json({ ok: true });
});


app.patch('/api/admin/articles/:code/archivage', exigerAdmin, (req, res) => {
  const { actif } = req.body;
  if (typeof actif !== 'boolean') return res.status(400).json({ erreur: 'Statut invalide' });

  const code = req.params.code;
  const article = db.prepare('SELECT actif FROM article WHERE code_barre = ?').get(code);
  if (!article) return res.status(404).json({ erreur: 'Article inconnu' });

  if (!actif) {
    const { total } = db.prepare(SQL_TOTAL).get(code);
    if (total !== 0)
      return res.status(409).json({
        erreur: `Archivage impossible : stock non nul (${total} kg). Passe-le à zéro par un mouvement correctif.`,
      });
  }

  db.prepare('UPDATE article SET actif = ? WHERE code_barre = ?').run(actif ? 1 : 0, code);
  res.json({ ok: true });
});

// --- Admin : suppression définitive d'un article ET de son historique ---
const supprimerDefinitivement = db.transaction((code, userId) => {
  const article = db.prepare('SELECT nom FROM article WHERE code_barre = ?').get(code);
  if (!article) return null;

  const { n, total } = db.prepare(
    'SELECT COUNT(*) AS n, COALESCE(SUM(quantite), 0) AS total FROM mouvement WHERE code_barre = ?'
  ).get(code);

  db.prepare(
    `INSERT INTO journal_suppression (code_barre, nom, mouvements, stock, utilisateur_id)
     VALUES (?, ?, ?, ?, ?)`
  ).run(code, article.nom, n, total, userId);

  db.prepare('DELETE FROM mouvement WHERE code_barre = ?').run(code);
  db.prepare('DELETE FROM article WHERE code_barre = ?').run(code);
  return { mouvements: n, stock: total };
});

app.post('/api/admin/articles/:code/suppression-definitive', exigerAdmin, (req, res) => {
  const code = req.params.code;
  if (normaliserCode(req.body.confirmation) !== code)
    return res.status(400).json({ erreur: 'Confirmation incorrecte : saisis le code-barre exact' });

  try {
    const r = supprimerDefinitivement(code, req.session.user.id);
    if (!r) return res.status(404).json({ erreur: 'Article inconnu' });
    res.json({ ok: true, ...r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// --- Admin : historique des mouvements (filtres + pagination) ---
const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LIMITE_PAGE = 50;

app.get('/api/admin/mouvements', exigerAdmin, (req, res) => {
  const conditions = [];
  const params = [];
  const texte = (cle) => String(req.query[cle] ?? '').trim();

  if (texte('code')) { conditions.push('m.code_barre LIKE ?'); params.push(`%${texte('code')}%`); }
  if (texte('nom')) { conditions.push('a.nom LIKE ?'); params.push(`%${texte('nom')}%`); }
  if (texte('utilisateur')) { conditions.push('u.nom LIKE ?'); params.push(`%${texte('utilisateur')}%`); }
  if (FORMAT_DATE.test(texte('du'))) { conditions.push('date(m.date) >= ?'); params.push(texte('du')); }
  if (FORMAT_DATE.test(texte('au'))) { conditions.push('date(m.date) <= ?'); params.push(texte('au')); }

  const sens = texte('sens');
  if (sens === 'ajout') conditions.push('m.quantite > 0');
  else if (sens === 'retrait') conditions.push('m.quantite < 0');
  else if (sens === 'correctif') conditions.push('m.correctif = 1');

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const clause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const base = `
    FROM mouvement m
    JOIN article a ON a.code_barre = m.code_barre
    JOIN utilisateur u ON u.id = m.utilisateur_id
    ${clause}`;

  const { total } = db.prepare(`SELECT COUNT(*) AS total ${base}`).get(...params);
  const lignes = db.prepare(`
    SELECT m.id, m.date, m.code_barre, a.nom, a.couleur, a.finition, a.texture, a.fabricant,
           u.nom AS utilisateur, m.quantite, m.motif, m.correctif
    ${base}
    ORDER BY m.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, LIMITE_PAGE, (page - 1) * LIMITE_PAGE);

  res.json({ total, page, limite: LIMITE_PAGE, lignes });
});

// --- Admin : mouvement correctif (motif obligatoire) ---
app.post('/api/admin/mouvements/correction', exigerAdmin, (req, res) => {
  const code = String(req.body.code_barre ?? '').trim();
  const q = Number(req.body.quantite);
  const motif = typeof req.body.motif === 'string' ? req.body.motif.trim() : '';

  if (!code || !Number.isSafeInteger(q) || q === 0 || Math.abs(q) > 1000000)
    return res.status(400).json({ erreur: 'Données invalides' });
  if (motif.length < 3 || motif.length > 200)
    return res.status(400).json({ erreur: 'Motif obligatoire (3 à 200 caractères)' });

  const existe = db.prepare('SELECT 1 FROM article WHERE code_barre = ?').get(code);
  if (!existe) return res.status(404).json({ erreur: 'Article inconnu' });

  try {
    const nouveauStock = enregistrerMouvement(code, q, req.session.user.id, motif, 1);
    res.status(201).json({ stock: nouveauStock });
  } catch (e) {
    if (e.message === 'STOCK_INSUFFISANT')
      return res.status(409).json({ erreur: 'La correction rendrait le stock négatif' });
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// --- Admin : gestion des utilisateurs ---
const ROLES = ['utilisateur', 'admin'];
const FORMAT_NOM = /^[\p{L}\p{N}._-]{3,50}$/u;

function motDePasseValide(mdp) {
  return typeof mdp === 'string' && mdp.length >= 12 && Buffer.byteLength(mdp) <= 72;
}
const ERREUR_MDP = 'Mot de passe : 12 caractères minimum, 72 octets maximum';

app.get('/api/admin/utilisateurs', exigerAdmin, (req, res) => {
  const lignes = db.prepare(`
    SELECT u.id, u.nom, u.role, u.actif,
           (SELECT COUNT(*) FROM mouvement m WHERE m.utilisateur_id = u.id) AS mouvements
    FROM utilisateur u
    ORDER BY u.nom COLLATE NOCASE
  `).all();
  res.json(lignes.map((u) => ({ ...u, soi: u.id === req.session.user.id })));
});

app.post('/api/admin/utilisateurs', exigerAdmin, async (req, res) => {
  const nom = typeof req.body.nom === 'string' ? req.body.nom.trim() : '';
  const { password, role } = req.body;

  if (!FORMAT_NOM.test(nom))
    return res.status(400).json({ erreur: 'Nom : 3 à 50 caractères (lettres, chiffres, . _ -)' });
  if (!ROLES.includes(role))
    return res.status(400).json({ erreur: 'Rôle invalide' });
  if (!motDePasseValide(password))
    return res.status(400).json({ erreur: ERREUR_MDP });

  if (db.prepare('SELECT 1 FROM utilisateur WHERE nom = ? COLLATE NOCASE').get(nom))
    return res.status(409).json({ erreur: 'Ce nom existe déjà' });

  try {
    const hache = await bcrypt.hash(password, 12);
    db.prepare('INSERT INTO utilisateur (nom, mot_de_passe_hache, role) VALUES (?, ?, ?)')
      .run(nom, hache, role);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

app.patch('/api/admin/utilisateurs/:id', exigerAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ erreur: 'Identifiant invalide' });
  if (id === req.session.user.id)
    return res.status(409).json({ erreur: 'Tu ne peux pas modifier ton propre rôle ou statut' });

  const u = db.prepare('SELECT id FROM utilisateur WHERE id = ?').get(id);
  if (!u) return res.status(404).json({ erreur: 'Utilisateur inconnu' });

  const { role, actif } = req.body;
  if (role !== undefined) {
    if (!ROLES.includes(role)) return res.status(400).json({ erreur: 'Rôle invalide' });
    db.prepare('UPDATE utilisateur SET role = ? WHERE id = ?').run(role, id);
  }
  if (actif !== undefined) {
    if (typeof actif !== 'boolean') return res.status(400).json({ erreur: 'Statut invalide' });
    db.prepare('UPDATE utilisateur SET actif = ? WHERE id = ?').run(actif ? 1 : 0, id);
  }
  res.json({ ok: true });
});

app.post('/api/admin/utilisateurs/:id/mot-de-passe', exigerAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ erreur: 'Identifiant invalide' });
  if (!motDePasseValide(req.body.password))
    return res.status(400).json({ erreur: ERREUR_MDP });

  try {
    const hache = await bcrypt.hash(req.body.password, 12);
    const r = db.prepare('UPDATE utilisateur SET mot_de_passe_hache = ? WHERE id = ?').run(hache, id);
    if (r.changes === 0) return res.status(404).json({ erreur: 'Utilisateur inconnu' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// --- Rôle de l'utilisateur connecté ---
app.get('/api/me', exigerConnexion, (req, res) => {
  res.json({ role: req.session.user.role });
});

// --- Admin : valeurs existantes (suggestions) ---
app.get('/api/admin/suggestions', exigerAdmin, (req, res) => {
  const liste = (col) =>
    db.prepare(`SELECT DISTINCT ${col} AS v FROM article WHERE ${col} <> '' ORDER BY v COLLATE NOCASE`)
      .all().map((r) => r.v);
  res.json({
    nom: liste('nom'),
    couleur: liste('couleur'),
    finition: liste('finition'),
    texture: liste('texture'),
    fabricant: liste('fabricant'),
  });
});

// --- Admin : fabricants connus pour un préfixe de code (estimation : 7 chiffres) ---
const LONGUEUR_PREFIXE = 7;

app.get('/api/admin/prefixe/:code', exigerAdmin, (req, res) => {
  const code = req.params.code;
  if (!/^\d{13}$/.test(code)) return res.json({ fabricants: [] });
  const lignes = db.prepare(`
    SELECT fabricant, COUNT(*) AS n FROM article
    WHERE code_barre LIKE ? AND length(code_barre) = 13
    GROUP BY fabricant ORDER BY n DESC
  `).all(code.slice(0, LONGUEUR_PREFIXE) + '%');
  res.json({ fabricants: lignes.map((l) => l.fabricant) });
});

// --- Admin : recherche externe (Open Products Facts), appelée côté serveur ---
app.get('/api/admin/recherche-code/:code', exigerAdmin, async (req, res) => {
  const code = req.params.code;
  if (!codeEanValide(code)) return res.status(400).json({ erreur: 'Code-barre invalide' });
  try {
    const rep = await fetch(
      `https://world.openproductsfacts.org/api/v2/product/${code}.json?fields=product_name,brands`,
      {
        headers: { 'User-Agent': 'StockPeinture/1.0 (usage interne)' },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!rep.ok) return res.json({ trouve: false });
    const d = await rep.json();
    if (d.status !== 1 || !d.product) return res.json({ trouve: false });
    res.json({
      trouve: true,
      nom: String(d.product.product_name ?? '').trim().slice(0, 100),
      fabricant: String(d.product.brands ?? '').split(',')[0].trim().slice(0, 100),
    });
  } catch (e) {
    res.json({ trouve: false }); // service indisponible ou lent : repli manuel
  }
});

// --- Pages protégées ---
const pageAdmin = (fichier) => (req, res) => {
  if (req.session.user?.role !== 'admin') return res.redirect('/');
  res.sendFile(path.join(__dirname, 'private', fichier));
};

app.get('/admin', pageAdmin('admin.html'));
app.get('/admin/historique', pageAdmin('historique.html'));
app.get('/admin/utilisateurs', pageAdmin('utilisateurs.html'));

app.get('/scan.html', (req, res, next) => {
  if (!req.session.user) return res.redirect('/');
  next();
});

// --- Fichiers publics ---
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => console.log('http://localhost:3000'));
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db');

const app = express();

// Derrière un proxy HTTPS (hébergeur) : décommenter
// app.set('trust proxy', 1);

// --- Sécurité des en-têtes ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
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

// --- Middlewares d'accès ---
const exigerConnexion = (req, res, next) =>
  req.session.user ? next() : res.status(401).json({ erreur: 'Non connecté' });

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
  const ok = u && await bcrypt.compare(password, u.mot_de_passe_hache);
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
  const article = db.prepare('SELECT * FROM article WHERE code_barre = ?')
    .get(req.params.code);
  if (!article) return res.status(404).json({ erreur: 'Article inconnu' });

  article.stock = db.prepare(SQL_TOTAL).get(req.params.code).total;
  res.json(article);
});

// --- Scan : enregistrement d'un mouvement (+ ajout / − utilisation) ---
const enregistrerMouvement = db.transaction((code, q, userId) => {
  const { total } = db.prepare(SQL_TOTAL).get(code);
  if (total + q < 0) throw new Error('STOCK_INSUFFISANT');

  db.prepare(
    'INSERT INTO mouvement (code_barre, quantite, utilisateur_id) VALUES (?, ?, ?)'
  ).run(code, q, userId);

  return total + q;
});

app.post('/api/mouvements', exigerConnexion, (req, res) => {
  const { code_barre, quantite } = req.body;
  const q = Number(quantite);

  if (!code_barre || !Number.isInteger(q) || q === 0)
    return res.status(400).json({ erreur: 'Données invalides' });

  const existe = db.prepare('SELECT 1 FROM article WHERE code_barre = ?').get(code_barre);
  if (!existe) return res.status(404).json({ erreur: 'Article inconnu' });

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

// --- Admin : inventaire trié / filtré ---
const COLONNES_TRI = ['nom', 'couleur', 'finition', 'fabricant'];

app.get('/api/admin/inventaire', exigerAdmin, (req, res) => {
  const tri = COLONNES_TRI.includes(req.query.tri) ? req.query.tri : 'nom';
  const ordre = req.query.ordre === 'desc' ? 'DESC' : 'ASC';
  const filtre = (cle) => `%${req.query[cle] ?? ''}%`;

  const lignes = db.prepare(`
    SELECT a.code_barre, a.nom, a.couleur, a.finition, a.fabricant,
           COALESCE(SUM(m.quantite), 0) AS quantite
    FROM article a
    LEFT JOIN mouvement m ON m.code_barre = a.code_barre
    WHERE a.nom LIKE ? AND a.couleur LIKE ? AND a.finition LIKE ? AND a.fabricant LIKE ?
    GROUP BY a.code_barre
    ORDER BY a.${tri} ${ordre}
  `).all(filtre('nom'), filtre('couleur'), filtre('finition'), filtre('fabricant'));

  res.json(lignes);
});

// --- Pages protégées ---
app.get('/admin', (req, res) => {
  if (req.session.user?.role !== 'admin') return res.redirect('/');
  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

app.get('/scan.html', (req, res, next) => {
  if (!req.session.user) return res.redirect('/');
  next();
});

// --- Fichiers publics ---
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => console.log('http://localhost:3000'));
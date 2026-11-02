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

// --- Admin : validation ---
function codeValide(code) {
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(code)) return false;
  const chiffres = code.split('').map(Number);
  const cle = chiffres.pop();
  const somme = chiffres
    .reverse()
    .reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (somme % 10)) % 10 === cle;
}

const CHAMPS = ['nom', 'couleur', 'finition', 'fabricant'];

function lireArticle(body) {
  const a = {};
  for (const c of CHAMPS) {
    const v = typeof body[c] === 'string' ? body[c].trim() : '';
    if (!v || v.length > 100) return null;
    a[c] = v;
  }
  return a;
}

// --- Admin : inventaire trié / filtré ---
const TRI_SQL = {
  nom: 'a.nom COLLATE NOCASE',
  couleur: 'a.couleur COLLATE NOCASE',
  finition: 'a.finition COLLATE NOCASE',
  fabricant: 'a.fabricant COLLATE NOCASE',
  quantite: 'quantite',
};

app.get('/api/admin/inventaire', exigerAdmin, (req, res) => {
  const colonne = Object.hasOwn(TRI_SQL, req.query.tri) ? TRI_SQL[req.query.tri] : TRI_SQL.nom;
  const ordre = req.query.ordre === 'desc' ? 'DESC' : 'ASC';
  const filtre = (cle) => `%${req.query[cle] ?? ''}%`;

  const lignes = db.prepare(`
    SELECT a.code_barre, a.nom, a.couleur, a.finition, a.fabricant,
           COALESCE(SUM(m.quantite), 0) AS quantite
    FROM article a
    LEFT JOIN mouvement m ON m.code_barre = a.code_barre
    WHERE a.nom LIKE ? AND a.couleur LIKE ? AND a.finition LIKE ? AND a.fabricant LIKE ?
    GROUP BY a.code_barre
    ORDER BY ${colonne} ${ordre}
  `).all(filtre('nom'), filtre('couleur'), filtre('finition'), filtre('fabricant'));

  res.json(lignes);
});

// --- Admin : créer un article (+ stock initial optionnel) ---
const creerArticle = db.transaction((code, a, stockInitial, userId) => {
  db.prepare(
    'INSERT INTO article (code_barre, nom, couleur, finition, fabricant) VALUES (?, ?, ?, ?, ?)'
  ).run(code, a.nom, a.couleur, a.finition, a.fabricant);
  if (stockInitial > 0) {
    db.prepare(
      'INSERT INTO mouvement (code_barre, quantite, utilisateur_id, motif) VALUES (?, ?, ?, ?)'
    ).run(code, stockInitial, userId, 'Stock initial');
  }
});

app.post('/api/admin/articles', exigerAdmin, (req, res) => {
  const code = String(req.body.code_barre ?? '').trim();
  const a = lireArticle(req.body);
  const stockInitial = Number(req.body.stock_initial ?? 0);

  if (!codeValide(code))
    return res.status(400).json({ erreur: 'Code-barre invalide (8, 12 ou 13 chiffres, clé correcte)' });
  if (!a)
    return res.status(400).json({ erreur: 'Champs manquants ou trop longs (100 caractères max)' });
  if (!Number.isInteger(stockInitial) || stockInitial < 0)
    return res.status(400).json({ erreur: 'Stock initial invalide' });

  if (db.prepare('SELECT 1 FROM article WHERE code_barre = ?').get(code))
    return res.status(409).json({ erreur: 'Ce code-barre existe déjà' });

  try {
    creerArticle(code, a, stockInitial, req.session.user.id);
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

  const r = db.prepare(
    'UPDATE article SET nom = ?, couleur = ?, finition = ?, fabricant = ? WHERE code_barre = ?'
  ).run(a.nom, a.couleur, a.finition, a.fabricant, req.params.code);

  if (r.changes === 0) return res.status(404).json({ erreur: 'Article inconnu' });
  res.json({ ok: true });
});

// --- Admin : supprimer un article (refusé s'il a des mouvements) ---
app.delete('/api/admin/articles/:code', exigerAdmin, (req, res) => {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM mouvement WHERE code_barre = ?')
    .get(req.params.code);
  if (n > 0)
    return res.status(409).json({ erreur: 'Suppression impossible : des mouvements existent pour cet article' });

  const r = db.prepare('DELETE FROM article WHERE code_barre = ?').run(req.params.code);
  if (r.changes === 0) return res.status(404).json({ erreur: 'Article inconnu' });
  res.json({ ok: true });
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
    SELECT m.id, m.date, m.code_barre, a.nom, a.couleur, a.finition, a.fabricant,
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

// --- Pages protégées ---
const pageAdmin = (fichier) => (req, res) => {
  if (req.session.user?.role !== 'admin') return res.redirect('/');
  res.sendFile(path.join(__dirname, 'private', fichier));
};

app.get('/admin', pageAdmin('admin.html'));
app.get('/admin/historique', pageAdmin('historique.html'));

app.get('/scan.html', (req, res, next) => {
  if (!req.session.user) return res.redirect('/');
  next();
});

// --- Fichiers publics ---
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => console.log('http://localhost:3000'));
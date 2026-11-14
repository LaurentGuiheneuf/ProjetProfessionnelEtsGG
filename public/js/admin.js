const $ = (id) => document.getElementById(id);
const etat = { tri: 'nom', ordre: 'asc' };
const filtres = document.querySelectorAll('[data-filtre]');
let minuteur;
let codeEnEdition = null; // null = mode création
let jetonAuto = 0;        // ignore les réponses périmées du préremplissage

const FORMAT_FABRICANT = /^\d{7}[A-Z]{2}\d{5}[A-Z]{2}36\d{5}$/;
const normaliserCode = (brut) =>
  String(brut ?? '').trim().toUpperCase().replace(/^\$/, '').replace(/\s+/g, '');

const formatEuro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const enEuros = (centimes) => formatEuro.format(centimes / 100);
const prixEnTexte = (c) => (c === null || c === undefined ? '' : (c / 100).toFixed(2).replace('.', ','));

function afficherMessage(texte, erreur = false) {
  const m = $('message');
  m.textContent = texte;
  m.className = erreur ? 'erreur' : 'succes';
}

async function api(url, options) {
  const rep = await fetch(url, options);
  if (rep.status === 401 || rep.status === 403) {
    window.location.href = '/';
    throw new Error('Accès refusé');
  }
  const donnees = await rep.json().catch(() => ({}));
  if (!rep.ok) throw new Error(donnees.erreur || 'Erreur serveur');
  return donnees;
}

// --- Suggestions ---
async function chargerSuggestions() {
  try {
    const s = await api('/api/admin/suggestions');
    for (const cle of ['nom', 'couleur', 'finition', 'texture', 'fabricant']) {
      $('l-' + cle).replaceChildren(
        ...s[cle].map((v) => {
          const o = document.createElement('option');
          o.value = v;
          return o;
        })
      );
    }
  } catch (_) { /* suggestions facultatives */ }
}

// --- Préremplissage à partir du code-barre ---
async function preremplir(brut) {
  const code = normaliserCode(brut);
  const jeton = ++jetonAuto;
  $('aide-code').textContent = '';
  if (codeEnEdition || !code) return;

  if (FORMAT_FABRICANT.test(code)) {
    $('aide-code').textContent =
      'Code au format fabricant : pas de recherche externe, saisie manuelle.';
    return;
  }
  if (!/^\d+$/.test(code) || ![8, 12, 13].includes(code.length)) return;

  const vide = (id) => !$(id).value.trim();
  const rempli = [];
  try {
    if (code.length === 13) {
      const p = await api('/api/admin/prefixe/' + code);
      if (jeton !== jetonAuto) return;
      if (p.fabricants.length === 1 && vide('a-fabricant')) {
        $('a-fabricant').value = p.fabricants[0];
        rempli.push('fabricant (préfixe déjà connu)');
      }
    }
    const r = await api('/api/admin/recherche-code/' + code);
    if (jeton !== jetonAuto) return;
    if (r.trouve) {
      if (r.nom && vide('a-nom')) {
        $('a-nom').value = r.nom;
        rempli.push('nom (base externe)');
      }
      if (r.fabricant && vide('a-fabricant')) {
        $('a-fabricant').value = r.fabricant;
        rempli.push('fabricant (base externe)');
      }
    }
  } catch (_) { /* code invalide ou service indisponible : saisie manuelle */ }

  if (jeton !== jetonAuto) return;
  $('aide-code').textContent = rempli.length
    ? 'Prérempli : ' + rempli.join(', ') + '. À vérifier.'
    : 'Aucune information trouvée : saisie manuelle.';
}

$('a-code').addEventListener('input', () => preremplir($('a-code').value.trim()));

// --- Formulaire : modes création / modification ---
function modeCreation() {
  codeEnEdition = null;
  jetonAuto++;
  $('form-article').reset();
  $('aide-code').textContent = '';
  $('a-code').readOnly = false;
  $('a-stock').disabled = false;
  $('label-stock').hidden = false;
  $('titre-form').textContent = 'Ajouter un article';
  $('btn-enregistrer').textContent = 'Ajouter';
  $('btn-annuler').hidden = true;
}

function modeEdition(a) {
  codeEnEdition = a.code_barre;
  jetonAuto++;
  $('a-code').value = a.code_barre;
  $('a-code').readOnly = true;
  $('a-nom').value = a.nom;
  $('a-couleur').value = a.couleur;
  $('a-finition').value = a.finition;
  $('a-texture').value = a.texture;
  $('a-prix').value = prixEnTexte(a.prix_centimes);
  $('a-fabricant').value = a.fabricant;
  $('aide-code').textContent = '';
  $('a-stock').disabled = true;
  $('label-stock').hidden = true;
  $('titre-form').textContent = 'Modifier l\u2019article';
  $('btn-enregistrer').textContent = 'Enregistrer';
  $('btn-annuler').hidden = false;
  $('section-article').scrollIntoView({ behavior: 'smooth' });
}

function dupliquer(a) {
  modeCreation();
  $('a-nom').value = a.nom;
  $('a-couleur').value = a.couleur;
  $('a-finition').value = a.finition;
  $('a-texture').value = a.texture;
  $('a-prix').value = prixEnTexte(a.prix_centimes);
  $('a-fabricant').value = a.fabricant;
  $('aide-code').textContent =
    `Copie de « ${a.nom} » : saisis le nouveau code-barre et ajuste la couleur.`;
  $('section-article').scrollIntoView({ behavior: 'smooth' });
  $('a-code').focus();
}

$('form-article').addEventListener('submit', async (e) => {
  e.preventDefault();
  const donnees = Object.fromEntries(new FormData(e.target));
  const enregistrement = codeEnEdition
    ? api('/api/admin/articles/' + encodeURIComponent(codeEnEdition), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
      })
    : api('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
      });

  try {
    await enregistrement;
    afficherMessage(codeEnEdition ? 'Article modifié.' : 'Article ajouté.');
    modeCreation();
    charger();
    chargerSuggestions();
  } catch (err) {
    afficherMessage(err.message, true);
  }
});

$('btn-annuler').addEventListener('click', () => {
  modeCreation();
  afficherMessage('');
});

// --- Tableau ---
function creerBouton(texte, action) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texte;
  b.addEventListener('click', action);
  return b;
}

async function supprimer(a) {
  if (!confirm(`Supprimer « ${a.nom} » (${a.code_barre}) ?`)) return;
  try {
    await api('/api/admin/articles/' + encodeURIComponent(a.code_barre), { method: 'DELETE' });
    afficherMessage('Article supprimé.');
    if (codeEnEdition === a.code_barre) modeCreation();
    charger();
    chargerSuggestions();
  } catch (err) {
    afficherMessage(err.message, true);
  }
}

function creerLigne(a) {
  const tr = document.createElement('tr');
 [
  a.nom, a.couleur, a.finition, a.texture, a.fabricant, a.code_barre, a.quantite,
  a.prix_centimes === null ? 'Non renseigné' : enEuros(a.prix_centimes),
  a.prix_centimes === null ? '—' : enEuros(a.valeur_centimes),
].forEach((v) => {
    const td = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  });
  const actions = document.createElement('td');
  actions.append(
    creerBouton('Modifier', () => modeEdition(a)),
    creerBouton('Dupliquer', () => dupliquer(a)),
    creerBouton('Supprimer', () => supprimer(a))
  );
  tr.appendChild(actions);
  return tr;
}

async function charger() {
  const p = new URLSearchParams({ tri: etat.tri, ordre: etat.ordre });
  filtres.forEach((i) => p.set(i.dataset.filtre, i.value.trim()));
  try {
  const lignes = await api('/api/admin/inventaire?' + p);
  $('corps').replaceChildren(...lignes.map(creerLigne));
  $('compteur').textContent = `${lignes.length} article(s)`;

  const total = lignes.reduce((s, l) => s + l.valeur_centimes, 0);
  const sansPrix = lignes.filter((l) => l.prix_centimes === null && l.quantite > 0).length;
  $('valorisation').textContent =
    `Valeur du stock affiché : ${enEuros(total)}` +
    (sansPrix ? ` (${sansPrix} article(s) en stock sans prix, non valorisé(s))` : '');
  } catch (err) {
  afficherMessage(err.message, true);
  }
}

document.querySelectorAll('[data-tri]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const col = btn.dataset.tri;
    etat.ordre = etat.tri === col && etat.ordre === 'asc' ? 'desc' : 'asc';
    etat.tri = col;
    document.querySelectorAll('th[aria-sort]').forEach((th) => th.setAttribute('aria-sort', 'none'));
    btn.parentElement.setAttribute('aria-sort', etat.ordre === 'asc' ? 'ascending' : 'descending');
    charger();
  });
});

filtres.forEach((i) => i.addEventListener('input', () => {
  clearTimeout(minuteur);
  minuteur = setTimeout(charger, 300); // évite une requête par frappe
}));

$('raz').addEventListener('click', () => setTimeout(charger, 0));

$('deconnexion').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

// --- Démarrage ---
modeCreation();
charger();
chargerSuggestions();

// Arrivée depuis le scan d'un code inconnu : /admin?code=...
const codeUrl = normaliserCode(new URLSearchParams(window.location.search).get('code'));
if (codeUrl && (FORMAT_FABRICANT.test(codeUrl) || /^\d{8,13}$/.test(codeUrl))) {
  $('a-code').value = codeUrl;
  preremplir(codeUrl);
}
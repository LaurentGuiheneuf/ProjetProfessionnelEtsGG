const $ = (id) => document.getElementById(id);
const etat = { page: 1, pages: 1 };

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

// SQLite stocke en UTC ("AAAA-MM-JJ HH:MM:SS")
function formaterDate(s) {
  const d = new Date(s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('fr-FR');
}

function preparerContrePassation(m) {
  $('c-code').value = m.code_barre;
  $('c-sens').value = m.quantite > 0 ? '-1' : '1';
  $('c-quantite').value = Math.abs(m.quantite);
  $('c-motif').value = `Annulation du mouvement n°${m.id}`;
  $('section-correction').scrollIntoView({ behavior: 'smooth' });
  $('c-motif').focus();
}

function creerLigne(m) {
  const tr = document.createElement('tr');
  if (m.correctif) tr.className = 'ligne-correctif';

  const libelle = `${m.nom} (${m.couleur}, ${m.finition}, ${m.fabricant})`;
  const quantite = (m.quantite > 0 ? '+' : '') + m.quantite;
  [m.id, formaterDate(m.date), libelle, m.code_barre, m.utilisateur, quantite, m.motif ?? ''].forEach((v) => {
    const td = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  });

  const tdAction = document.createElement('td');
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = 'Contre-passer';
  b.addEventListener('click', () => preparerContrePassation(m));
  tdAction.appendChild(b);
  tr.appendChild(tdAction);
  return tr;
}

async function charger() {
  const p = new URLSearchParams({ page: etat.page });
  document.querySelectorAll('[data-filtre]').forEach((i) => {
    const v = i.value.trim();
    if (v) p.set(i.dataset.filtre, v);
  });

  try {
    const r = await api('/api/admin/mouvements?' + p);
    etat.pages = Math.max(1, Math.ceil(r.total / r.limite));
    $('corps').replaceChildren(...r.lignes.map(creerLigne));
    $('page-info').textContent = `Page ${r.page} / ${etat.pages} (${r.total} mouvement(s))`;
    $('precedent').disabled = etat.page <= 1;
    $('suivant').disabled = etat.page >= etat.pages;
  } catch (err) {
    afficherMessage(err.message, true);
  }
}

$('filtres').addEventListener('submit', (e) => {
  e.preventDefault();
  etat.page = 1;
  charger();
});

$('raz').addEventListener('click', () => {
  etat.page = 1;
  setTimeout(charger, 0);
});

$('precedent').addEventListener('click', () => { etat.page--; charger(); });
$('suivant').addEventListener('click', () => { etat.page++; charger(); });

$('form-correction').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = Number($('c-quantite').value);
  if (!Number.isInteger(q) || q < 1) return afficherMessage('Quantité invalide.', true);

  try {
    const r = await api('/api/admin/mouvements/correction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code_barre: $('c-code').value.trim(),
        quantite: Number($('c-sens').value) * q,
        motif: $('c-motif').value.trim(),
      }),
    });
    afficherMessage(`Correction enregistrée. Nouveau stock : ${r.stock}`);
    e.target.reset();
    etat.page = 1;
    charger();
  } catch (err) {
    afficherMessage(err.message, true);
  }
});

$('deconnexion').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

charger();
const etat = { tri: 'nom', ordre: 'asc' };
const corps = document.getElementById('corps');
const filtres = document.querySelectorAll('[data-filtre]');
let minuteur;

function creerLigne(a) {
  const tr = document.createElement('tr');
  [a.nom, a.couleur, a.finition, a.fabricant, a.code_barre, a.quantite].forEach((v) => {
    const td = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  });
  return tr;
}

async function charger() {
  const p = new URLSearchParams({ tri: etat.tri, ordre: etat.ordre });
  filtres.forEach((i) => p.set(i.dataset.filtre, i.value.trim()));

  const rep = await fetch('/api/admin/inventaire?' + p);
  if (rep.status === 401 || rep.status === 403) { window.location.href = '/'; return; }
  const lignes = await rep.json();

  corps.replaceChildren(...lignes.map(creerLigne));
  document.getElementById('compteur').textContent = `${lignes.length} article(s)`;
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

document.getElementById('raz').addEventListener('click', () => setTimeout(charger, 0));

document.getElementById('deconnexion').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

charger();
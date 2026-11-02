const $ = (id) => document.getElementById(id);
let idMdp = null; // utilisateur dont on réinitialise le mot de passe

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

const json = (methode, corps) => ({
  method: methode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corps),
});

function creerBouton(texte, action) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texte;
  b.addEventListener('click', action);
  return b;
}

async function modifier(u, corps, confirmation) {
  if (confirmation && !confirm(confirmation)) return;
  try {
    await api('/api/admin/utilisateurs/' + u.id, json('PATCH', corps));
    afficherMessage('Compte mis à jour.');
    charger();
  } catch (err) {
    afficherMessage(err.message, true);
  }
}

function ouvrirMdp(u) {
  idMdp = u.id;
  $('titre-mdp').textContent = `Nouveau mot de passe : ${u.nom}`;
  $('section-mdp').hidden = false;
  $('m-mdp').value = '';
  $('m-mdp').focus();
}

function fermerMdp() {
  idMdp = null;
  $('section-mdp').hidden = true;
  $('form-mdp').reset();
}

function creerLigne(u) {
  const tr = document.createElement('tr');
  if (!u.actif) tr.className = 'ligne-inactive';

  [
    u.soi ? `${u.nom} (toi)` : u.nom,
    u.role === 'admin' ? 'Administrateur' : 'Utilisateur',
    u.actif ? 'Actif' : 'Désactivé',
    u.mouvements,
  ].forEach((v) => {
    const td = document.createElement('td');
    td.textContent = v;
    tr.appendChild(td);
  });

  const actions = document.createElement('td');
  if (!u.soi) {
    const nouveauRole = u.role === 'admin' ? 'utilisateur' : 'admin';
    actions.append(
      creerBouton(
        nouveauRole === 'admin' ? 'Passer admin' : 'Passer utilisateur',
        () => modifier(u, { role: nouveauRole }, `Changer le rôle de « ${u.nom} » ?`)
      ),
      creerBouton(
        u.actif ? 'Désactiver' : 'Réactiver',
        () => modifier(u, { actif: !u.actif }, u.actif ? `Désactiver « ${u.nom} » ?` : null)
      )
    );
  }
  actions.append(creerBouton('Mot de passe', () => ouvrirMdp(u)));
  tr.appendChild(actions);
  return tr;
}

async function charger() {
  try {
    const utilisateurs = await api('/api/admin/utilisateurs');
    $('corps').replaceChildren(...utilisateurs.map(creerLigne));
  } catch (err) {
    afficherMessage(err.message, true);
  }
}

$('form-creation').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/admin/utilisateurs', json('POST', {
      nom: $('u-nom').value.trim(),
      password: $('u-mdp').value,
      role: $('u-role').value,
    }));
    afficherMessage('Compte créé.');
    e.target.reset();
    charger();
  } catch (err) {
    afficherMessage(err.message, true);
  }
});

$('form-mdp').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api(`/api/admin/utilisateurs/${idMdp}/mot-de-passe`, json('POST', {
      password: $('m-mdp').value,
    }));
    afficherMessage('Mot de passe modifié.');
    fermerMdp();
  } catch (err) {
    afficherMessage(err.message, true);
  }
});

$('m-annuler').addEventListener('click', fermerMdp);

$('deconnexion').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

charger();
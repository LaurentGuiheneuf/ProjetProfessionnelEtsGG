const $ = (id) => document.getElementById(id);
let scanner = null;
let codeCourant = null;
let enCours = false;
let dernierRejet = '';

function afficherMessage(texte, erreur = false) {
  const m = $('message');
  m.textContent = texte;
  m.className = erreur ? 'erreur' : 'succes';
}

async function api(url, options) {
  const rep = await fetch(url, options);
  if (rep.status === 401) {
    window.location.href = '/';
    throw new Error('Non connecté');
  }
  const donnees = await rep.json().catch(() => ({}));
  if (!rep.ok) throw new Error(donnees.erreur || 'Erreur serveur');
  return donnees;
}

// Contrôle GS1 : 8, 12 ou 13 chiffres + chiffre de clé
function codeValide(code) {
  if (!/^(\d{8}|\d{12}|\d{13})$/.test(code)) return false;
  const chiffres = code.split('').map(Number);
  const cle = chiffres.pop();
  const somme = chiffres
    .reverse()
    .reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (somme % 10)) % 10 === cle;
}

// --- Choix de la caméra ---
async function listerCameras() {
  const cameras = await Html5Qrcode.getCameras(); // demande l'autorisation
  if (!cameras.length) throw new Error('Aucune caméra détectée');

  $('choix-camera').replaceChildren(
    ...cameras.map((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.label || c.id;
      return o;
    })
  );

  try {
    const memo = localStorage.getItem('cameraId');
    if (memo && cameras.some((c) => c.id === memo)) $('choix-camera').value = memo;
  } catch (_) { /* stockage indisponible : ignoré */ }
}

// --- Scan ---
async function demarrerScan() {
  $('fiche').hidden = true;
  $('zone-scan').hidden = false;
  $('etat-camera').textContent = 'Démarrage de la caméra…';

  if (!scanner) {
    scanner = new Html5Qrcode('lecteur', {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
      ],
      useBarCodeDetectorIfSupported: true,
    });
  }

  try {
    if (!$('choix-camera').options.length) await listerCameras();
    const cameraId = $('choix-camera').value;
    try { localStorage.setItem('cameraId', cameraId); } catch (_) {}

    let imagesSansCode = 0;
    await scanner.start(
      cameraId,
      { fps: 10 }, // pas de qrbox : image entière analysée
      (code) => {
        if (!codeValide(code)) {
          if (code !== dernierRejet) {
            dernierRejet = code;
            afficherMessage(`Lecture invalide : ${code}`, true);
          }
          return; // la caméra continue de scanner
        }
        chargerArticle(code);
      },
      () => {
        imagesSansCode++;
        if (imagesSansCode % 20 === 0) {
          $('etat-camera').textContent =
            `Analyse en cours… (${imagesSansCode} images sans code)`;
        }
      }
    );
    $('etat-camera').textContent = 'Place le code-barre dans le cadre.';
  } catch (e) {
    console.error(e);
    $('etat-camera').textContent =
      'Caméra indisponible : ' + e + ' — choisis une autre caméra ou clique sur « Actualiser ».';
    try { localStorage.removeItem('cameraId'); } catch (_) {}
  }
}

async function arreterScan() {
  if (scanner && scanner.isScanning) await scanner.stop();
}

async function chargerArticle(code) {
  if (enCours) return;
  enCours = true;
  try {
    await arreterScan();
    const a = await api('/api/articles/' + encodeURIComponent(code));
    codeCourant = a.code_barre;
    $('f-nom').textContent = a.nom;
    $('f-couleur').textContent = a.couleur;
    $('f-finition').textContent = a.finition;
    $('f-fabricant').textContent = a.fabricant;
    $('f-code').textContent = a.code_barre;
    $('f-stock').textContent = a.stock;
    $('quantite').value = 1;
    $('zone-scan').hidden = true;
    $('fiche').hidden = false;
    afficherMessage('');
  } catch (e) {
    afficherMessage(`${e.message} (code lu : ${code})`, true);
    await demarrerScan();
  } finally {
    enCours = false;
  }
}

async function envoyerMouvement(signe) {
  const q = Number($('quantite').value);
  if (!Number.isInteger(q) || q < 1) {
    return afficherMessage('Quantité invalide.', true);
  }
  try {
    const r = await api('/api/mouvements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code_barre: codeCourant, quantite: signe * q }),
    });
    $('f-stock').textContent = r.stock;
    afficherMessage(`Enregistré. Nouveau stock : ${r.stock}`);
  } catch (e) {
    afficherMessage(e.message, true);
  }
}

// --- Événements ---
$('choix-camera').addEventListener('change', async () => {
  await arreterScan();
  demarrerScan();
});

$('actualiser-cameras').addEventListener('click', async () => {
  await arreterScan();
  try {
    await listerCameras();
    await demarrerScan();
  } catch (e) {
    $('etat-camera').textContent = 'Caméra indisponible : ' + e;
  }
});

$('btn-ajout').addEventListener('click', () => envoyerMouvement(+1));
$('btn-retrait').addEventListener('click', () => envoyerMouvement(-1));
$('btn-autre').addEventListener('click', () => {
  afficherMessage('');
  dernierRejet = '';
  demarrerScan();
});

$('saisie-manuelle').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = $('code-manuel').value.trim();
  if (code) chargerArticle(code);
});

$('deconnexion').addEventListener('click', async () => {
  await arreterScan();
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

demarrerScan();
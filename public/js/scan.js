const $ = (id) => document.getElementById(id);

// Moteur de lecture (ZXing-C++ en WebAssembly), fichier .wasm hébergé localement
const API = window.BarcodeDetectionAPI;
let detecteur = null;
if (API) {
  API.prepareZXingModule({
    overrides: {
      locateFile: (path, prefix) =>
        path.endsWith('.wasm') ? '/vendor/zxing_reader.wasm' : prefix + path,
    },
  });
  detecteur = new API.BarcodeDetector({
    formats: ['code_128', 'ean_13', 'ean_8', 'upc_a'],
  });
}

let flux = null;
let minuteur = null;
let enAnalyse = false;
let codeCourant = null;
let enCours = false;
let dernierRejet = '';
let role = null;

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

async function lireRole() {
  try {
    role = (await api('/api/me')).role;
    $('nav-admin').hidden = role !== 'admin';
  } catch { /* non connecté : redirigé par api() */ }
}

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

// --- Caméra ---
function memoCamera() {
  try { return localStorage.getItem('cameraId') || ''; } catch { return ''; }
}

function sauverCamera(id) {
  try { localStorage.setItem('cameraId', id); } catch { /* stockage indisponible : ignoré */ }
}

function oublierCamera() {
  try { localStorage.removeItem('cameraId'); } catch { /* stockage indisponible : ignoré */ }
}

async function ouvrirCamera(deviceId) {
  const video = { width: { ideal: 1920 }, height: { ideal: 1080 } };
  if (deviceId) video.deviceId = { exact: deviceId };
  else video.facingMode = 'environment';

  flux = await navigator.mediaDevices.getUserMedia({ video, audio: false });
  const piste = flux.getVideoTracks()[0];
  try {
    await piste.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
  } catch { /* mise au point continue non disponible : ignoré */ }

  $('lecteur').srcObject = flux;
  await $('lecteur').play();
}

async function listerCameras() {
  const peripheriques = await navigator.mediaDevices.enumerateDevices();
  const cameras = peripheriques.filter((d) => d.kind === 'videoinput');
  if (!cameras.length) throw new Error('Aucune caméra détectée');

  $('choix-camera').replaceChildren(
    ...cameras.map((c, i) => {
      const o = document.createElement('option');
      o.value = c.deviceId;
      o.textContent = c.label || `Caméra ${i + 1}`;
      return o;
    })
  );
}

function arreterScan() {
  clearInterval(minuteur);
  minuteur = null;
  if (flux) {
    flux.getTracks().forEach((t) => t.stop());
    flux = null;
  }
  $('lecteur').srcObject = null;
}

function boucleAnalyse() {
  clearInterval(minuteur);
  let images = 0;
  let erreurAffichee = false;

  minuteur = setInterval(async () => {
    const video = $('lecteur');
    if (enAnalyse || enCours || video.readyState < 2) return;
    enAnalyse = true;
    try {
      const resultats = await detecteur.detect(video);
      images++;

      if (!resultats.length) {
        if (images % 20 === 0) {
          $('etat-camera').textContent = `Analyse en cours… (${images} images sans code)`;
        }
        return;
      }

      for (const r of resultats) {
        const code = normaliserCode(r.rawValue);
        if (codeValide(code)) {
          chargerArticle(code);
          return;
        }
        if (code !== dernierRejet) {
          dernierRejet = code;
          const detail = `${r.format}, ${r.rawValue.length} caractères : ${JSON.stringify(r.rawValue)}`;
          console.log('Lecture rejetée :', detail, [...r.rawValue].map((c) => c.charCodeAt(0)));
          afficherMessage(`Lecture invalide (${detail})`, true);
        }
      }
    } catch (e) {
      console.error(e);
      if (!erreurAffichee) {
        erreurAffichee = true;
        $('etat-camera').textContent =
          'Moteur de lecture indisponible (voir la console F12). Utilise la saisie manuelle.';
      }
    } finally {
      enAnalyse = false;
    }
  }, 120);
}

async function demarrerScan() {
  $('fiche').hidden = true;
  $('zone-scan').hidden = false;
  $('creation').hidden = true;
  $('btn-reprise').hidden = true;
  $('etat-camera').textContent = 'Démarrage de la caméra…';

  if (!detecteur) {
    $('etat-camera').textContent =
      'Moteur de lecture non chargé (fichier /vendor/ponyfill.min.js introuvable). Utilise la saisie manuelle.';
    return;
  }

  try {
    arreterScan();
    await ouvrirCamera($('choix-camera').value || memoCamera());
    await listerCameras(); // les noms des caméras sont disponibles après l'autorisation

    const actuel = flux.getVideoTracks()[0].getSettings().deviceId;
    if (actuel && [...$('choix-camera').options].some((o) => o.value === actuel)) {
      $('choix-camera').value = actuel;
      sauverCamera(actuel);
    }

    boucleAnalyse();
    $('etat-camera').textContent = 'Place le code-barre dans le cadre.';
  } catch (e) {
    console.error(e);
    arreterScan();
    $('etat-camera').textContent =
      'Caméra indisponible : ' + e + ' — choisis une autre caméra ou clique sur « Actualiser ».';
    oublierCamera();
  }
}

// --- Fiche article ---
async function chargerArticle(code) {
  if (enCours) return;
  enCours = true;
  $('creation').hidden = true;
  $('btn-reprise').hidden = true;
  try {
    arreterScan();
    const a = await api('/api/articles/' + encodeURIComponent(code));
    codeCourant = a.code_barre;
    $('f-nom').textContent = a.nom;
    $('f-couleur').textContent = a.couleur;
    $('f-finition').textContent = a.finition;
    $('f-texture').textContent = a.texture;
    $('f-fabricant').textContent = a.fabricant;
    $('f-code').textContent = a.code_barre;
    $('f-stock').textContent = a.stock;
    $('quantite').value = 1;
    $('zone-scan').hidden = true;
    $('fiche').hidden = false;
    afficherMessage('');
  } catch (e) {
    afficherMessage(`${e.message} (code lu : ${code})`, true);
    enCours = false;

    if (e.message === 'Article inconnu' || e.message === 'Article archivé') {
      // Scan arrêté : on évite de relire le même code en boucle
      $('etat-camera').textContent = 'Scan arrêté.';
      $('btn-reprise').hidden = false;
      if (e.message === 'Article inconnu' && role === 'admin') {
        $('lien-creation').href = '/admin?code=' + encodeURIComponent(code);
        $('creation').hidden = false;
      }
      return;
    }
    await demarrerScan(); // autre erreur (réseau, serveur) : on relance la caméra
    return;
  }
  enCours = false;
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
$('choix-camera').addEventListener('change', () => {
  sauverCamera($('choix-camera').value);
  demarrerScan();
});

$('actualiser-cameras').addEventListener('click', () => {
  $('choix-camera').replaceChildren();
  demarrerScan();
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
  const code = normaliserCode($('code-manuel').value);
  if (code) chargerArticle(code);
});

$('deconnexion').addEventListener('click', async () => {
  arreterScan();
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

$('btn-reprise').addEventListener('click', () => {
  afficherMessage('');
  dernierRejet = '';
  demarrerScan();
});

lireRole();
demarrerScan();
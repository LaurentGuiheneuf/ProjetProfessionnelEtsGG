document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const donnees = Object.fromEntries(new FormData(e.target));
  const rep = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(donnees),
  });
  if (!rep.ok) return alert((await rep.json()).erreur);
  const { role } = await rep.json();
  window.location.href = role === 'admin' ? '/admin' : '/scan.html';
});
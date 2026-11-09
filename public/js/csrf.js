(() => {
  const fetchOriginal = window.fetch.bind(window);
  const METHODES_SURES = ['GET', 'HEAD', 'OPTIONS'];
  let jeton = null;

  async function lireJeton() {
    if (jeton) return jeton;
    const rep = await fetchOriginal('/api/csrf', { cache: 'no-store' });
    if (!rep.ok) return null;
    jeton = (await rep.json()).token;
    return jeton;
  }

  window.fetch = async (entree, options = {}) => {
    if (typeof entree !== 'string') return fetchOriginal(entree, options);

    const url = new URL(entree, window.location.href);
    const methode = (options.method || 'GET').toUpperCase();
    const concerne =
      url.origin === window.location.origin &&
      !METHODES_SURES.includes(methode) &&
      url.pathname !== '/api/login';

    if (!concerne) return fetchOriginal(entree, options);

    const headers = new Headers(options.headers || {});
    const t = await lireJeton();
    if (t) headers.set('X-CSRF-Token', t);

    const rep = await fetchOriginal(entree, { ...options, headers });
    if (rep.status === 403) jeton = null; // jeton périmé : relu à la prochaine requête
    return rep;
  };
})();
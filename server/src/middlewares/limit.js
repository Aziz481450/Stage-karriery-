const hits = new Map();
const isLoopback = (ip) => !ip || ip === '::1' || ip === '127.0.0.1' || ip.endsWith('127.0.0.1') || /^::ffff:/.test(ip || '');

// Limiteur simple en mémoire (sans dépendance) : max requêtes par fenêtre et par IP.
// Exempté pour localhost : en dev tous les utilisateurs du PC partagent la même IP,
// et nos propres tests ne doivent pas bloquer l'utilisateur. Il reste actif en déploiement.
export const limit = (name, windowMs, max) => (req, res, next) => {
  if (isLoopback(req.ip)) return next();
  const now = Date.now();
  const key = `${name}:${req.ip}`;
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return res.status(429).json({ message: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  next();
};

import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

export const requireAuth = async (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Session expirée. Reconnectez-vous.' });
  }
  if (!payload?.id) return res.status(401).json({ message: 'Session invalide. Reconnectez-vous.' });
  try {
    // Un jeton ne doit pas survivre à l'annulation ou à la mise en attente du compte
    const [rows] = await db.query('SELECT statut FROM users WHERE id=?', [payload.id]);
    if (!rows.length || rows[0].statut !== 'actif')
      return res.status(401).json({
        message: rows[0]?.statut === 'en_attente'
          ? 'Compte en attente de validation par un administrateur.'
          : 'Compte désactivé. Reconnectez-vous.',
      });
    req.user = payload;
    next();
  } catch (e) {
    next(e);
  }
};

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Accès refusé pour ce rôle.' });

import { ApiError } from '../utils/ApiError.js';
import { listNotifications, unreadCount } from '../services/notifications.js';
import { emitToUser } from '../services/socket.js';
import { db } from '../config/db.js';

// Contrat Sprint 3 : { items, nonLues }
export const listMine = async (req, res) => {
  const items = await listNotifications(req.user.id);
  const nonLues = await unreadCount(req.user.id);
  res.json({ items, nonLues });
};

export const unread = async (req, res) => {
  const n = await unreadCount(req.user.id);
  res.json({ count: n });
};

export const markRead = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [r] = await db.query(
    'UPDATE notifications SET lue = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!r.affectedRows) throw new ApiError(404, 'Notification introuvable.');
  res.json({ message: 'Notification marquée comme lue.' });
};

export const markAllRead = async (req, res) => {
  await db.query('UPDATE notifications SET lue = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ message: 'Toutes les notifications sont marquées comme lues.' });
};

export const markDemandeRead = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  await db.query(
    "UPDATE notifications SET lue = 1 WHERE user_id = ? AND demande_id = ? AND type = 'message'",
    [req.user.id, id]
  );
  emitToUser(req.user.id, 'notifications_maj', {});
  res.json({ message: 'Conversation marquée comme lue.' });
};
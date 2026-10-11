import { db } from '../config/db.js';
import { emitToUser } from './socket.js';

// Crée une notification (transaction éventuelle fournie par l'appelant) et la pousse en temps réel.
export async function createNotification({ conn, userId, type, titre, message, demandeId }) {
  const data = [userId, type, titre, message || titre, demandeId || null];
  const run = conn ? conn : db;
  const [r] = await run.execute(
    'INSERT INTO notifications (user_id, type, titre, message, demande_id) VALUES (?,?,?,?,?)', data);
  const notif = {
    id: r.insertId, userId, type, titre, message: message || titre, demandeId: demandeId || null, lue: 0
  };
  emitToUser(userId, 'new_notification', notif);
  return notif;
}

export async function listNotifications(userId, limit = 30) {
  const [rows] = await db.query(
    'SELECT id, type, titre, message, demande_id, lue, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?',
    [userId, limit]
  );
  return rows;
}

export async function unreadCount(userId) {
  const [[r]] = await db.query(
    'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND lue = 0', [userId]);
  return r.n;
}
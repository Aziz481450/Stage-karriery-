import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { canAccessDemande, getDemandeForUser } from './matching.js';
import { createNotification } from './notifications.js';
import { emitToRoom } from './socket.js';
import { saveBuffer, buildStorageName } from '../utils/storage.js';

export const demandeAccess = async (id, user, { allowAdminWrite = false } = {}) => {
  const [rows] = await db.query('SELECT * FROM demandes WHERE id = ?', [id]);
  if (!rows.length) return null;
  const d = rows[0];
  const g = canAccessDemande(d, user);
  const adminWrite = user.role === 'admin' && allowAdminWrite;
  if (!g && !adminWrite) throw new ApiError(403, 'Accès refusé : vous n\u2019êtes pas concerné par cette demande.');
  return d;
};

// Crée un message (avec fichier éventuel), notifie l'autre participant et diffuse en temps réel.
// Utilisé par l'API REST et par l'événement socket "send_message" (même comportement, zéro duplication).
export async function createMessage({ demandeId, userId, contenu, fichier }) {
  const d = await demandeAccess(demandeId, { id: userId });
  if (!d) throw new ApiError(404, 'Demande introuvable.');
  const text = (contenu || '').trim();
  if (!text && !fichier) throw new ApiError(400, 'Le message est vide.');
  if (text.length > 2000) throw new ApiError(400, 'Message trop long (2000 caractères max).');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(
      'INSERT INTO messages (demande_id, expediteur_id, contenu) VALUES (?,?,?)',
      [demandeId, userId, text]
    );
    const messageId = r.insertId;
    let f = null;
    if (fichier) {
      const rel = await saveBuffer(fichier.buffer, 'fichiers', buildStorageName('f', fichier.ext));
      const [fr] = await conn.execute(
        `INSERT INTO fichiers (demande_id, message_id, expediteur_id, nom_original, stockage, type, taille)
         VALUES (?,?,?,?,?,?,?)`,
        [demandeId, messageId, userId, fichier.originalname, rel.rel, fichier.mimetype, fichier.size]
      );
      f = { id: fr.insertId, nom_original: fichier.originalname, type: fichier.mimetype, taille: fichier.size };
    }
    await conn.commit();

    const payload = { id: messageId, demande_id: demandeId, expediteur_id: userId, contenu: text, created_at: new Date(), fichier: f };
    emitToRoom(`demande:${demandeId}`, 'new_message', payload);

    const other = d.candidat_id === userId ? d.redacteur_id : d.candidat_id;
    if (other && other !== userId) {
      await createNotification({
        userId: other, type: 'message', titre: 'Nouveau message',
        message: text ? `Vous avez reçu un message de la part de la demande n° ${demandeId}.` : 'Un fichier a été envoyé dans la messagerie.',
        demandeId
      });
    }
    return payload;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
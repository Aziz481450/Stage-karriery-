import { ApiError } from '../utils/ApiError.js';
import { demandeAccess, createMessage } from '../services/chat.js';
import { db } from '../config/db.js';

export const listMessages = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  await demandeAccess(id, req.user);
  const [rows] = await db.query(
    `SELECT m.id, m.demande_id, m.expediteur_id, m.contenu, m.created_at,
            f.id AS fichier_id, f.nom_original, f.type AS fichier_type, f.taille
       FROM messages m
       LEFT JOIN fichiers f ON f.message_id = m.id
      WHERE m.demande_id = ?
      ORDER BY m.id ASC`,
    [id]
  );
  res.json(rows.map((m) => ({
    id: m.id, demande_id: m.demande_id, expediteur_id: m.expediteur_id,
    contenu: m.contenu, created_at: m.created_at,
    fichier: m.fichier_id
      ? { id: m.fichier_id, nom_original: m.nom_original, type: m.fichier_type, taille: m.taille }
      : null
  })));
};

export const createMessageRest = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  let fichier = null;
  if (req.file) {
    fichier = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      ext: (req.file.originalname.split('.').pop() || '').toLowerCase()
    };
  }
  const payload = await createMessage({
    demandeId: id, userId: req.user.id, contenu: req.body.contenu || '', fichier
  });
  res.status(201).json({ message: 'Message envoyé.', messageRow: payload });
};
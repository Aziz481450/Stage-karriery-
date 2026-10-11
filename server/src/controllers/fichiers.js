import { ApiError } from '../utils/ApiError.js';
import { readStoredFile } from '../utils/storage.js';
import { db } from '../config/db.js';
import { canAccessDemande } from '../services/matching.js';

const stream = (res, f) => async () => {
  const { buf } = await readStoredFile(f.stockage);
  res.setHeader('Content-Type', f.type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${f.nom_original}"`);
  res.send(buf);
};

export const getFichier = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [rows] = await db.query(
    `SELECT f.nom_original, f.stockage, f.type, d.id AS demande_id, d.candidat_id, d.redacteur_id
       FROM fichiers f
       JOIN demandes d ON d.id = f.demande_id
      WHERE f.id = ?`,
    [id]
  );
  if (!rows.length) throw new ApiError(404, 'Fichier introuvable.');
  const f = rows[0];
  const demande = { id: f.demande_id, candidat_id: f.candidat_id, redacteur_id: f.redacteur_id };
  if (!canAccessDemande(demande, req.user)) throw new ApiError(403, 'Accès refusé.');
  await stream(res, f)();
};

// Compatibilité contrat Sprint 3 : GET /api/messages/:id/fichier (par identifiant de message).
export const getFichierByMessage = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [rows] = await db.query(
    `SELECT f.nom_original, f.stockage, f.type, d.id AS demande_id, d.candidat_id, d.redacteur_id
       FROM fichiers f
       JOIN messages m ON m.id = f.message_id
       JOIN demandes d ON d.id = f.demande_id
      WHERE m.id = ?`,
    [id]
  );
  if (!rows.length) throw new ApiError(404, 'Fichier introuvable.');
  const f = rows[0];
  const demande = { id: f.demande_id, candidat_id: f.candidat_id, redacteur_id: f.redacteur_id };
  if (!canAccessDemande(demande, req.user)) throw new ApiError(403, 'Accès refusé.');
  await stream(res, f)();
};
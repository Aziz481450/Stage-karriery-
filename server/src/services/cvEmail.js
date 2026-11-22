import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { readStoredFile } from '../utils/storage.js';
import { sendImprovedCvEmail } from './mailer.js';
import { createNotification } from './notifications.js';
import { emitToUser } from './socket.js';

// Envoie la version améliorée d'un dossier à son candidat.
// `source` = 'admin' ou 'newsletter' (changement de l'expéditeur et du sujet).
export async function sendDossierCvEmail({ id, source = 'admin' }) {
  const [rows] = await db.query(
    `SELECT d.*, u.nom AS candidat_nom, u.email AS candidat_email
       FROM demandes d JOIN users u ON u.id = d.candidat_id
      WHERE d.id = ?`, [id]
  );
  if (!rows.length) throw new ApiError(404, 'Dossier introuvable.');
  const d = rows[0];
  if (!d.cv_ameliorer_path)
    throw new ApiError(409, 'Générez d’abord le CV amélioré avec le bouton « Améliorer le CV (IA) ».');

  const { buf } = await readStoredFile(d.cv_ameliorer_path);
  const filename = d.cv_ameliorer_path.split('/').pop() || `cv-ameliore-${id}.pdf`;
  const mail = await sendImprovedCvEmail({
    to: d.candidat_email,
    name: d.candidat_nom,
    demandeId: id,
    filename,
    content: buf,
    source,
  });

  await db.query('UPDATE demandes SET cv_envoye_at = NOW() WHERE id = ?', [id]);
  await createNotification({
    userId: d.candidat_id,
    type: 'statut',
    titre: source === 'newsletter' ? 'Newsletter — CV amélioré envoyé' : 'CV amélioré envoyé',
    message: source === 'newsletter'
      ? `La newsletter Karriery vous a envoyé votre CV amélioré (dossier n° ${id}) à ${d.candidat_email}.`
      : `Votre CV amélioré (dossier n° ${id}) a été envoyé à ${d.candidat_email}.`,
    demandeId: id,
  });
  emitToUser(d.candidat_id, 'demande_statut', { demandeId: id, statut: d.statut });

  return {
    message: `CV amélioré envoyé à ${d.candidat_email}.`,
    mode: mail.mode,
    to: d.candidat_email,
    source,
    sender: mail.sender,
  };
}

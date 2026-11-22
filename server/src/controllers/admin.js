import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { changeStatut } from './demandes.js';

// === Dashboard ===
export const dashboard = async (_req, res) => {
  const [users] = await db.query('SELECT role, statut, COUNT(*) AS n FROM users GROUP BY role, statut');
  const [stats] = await db.query('SELECT statut, COUNT(*) AS n FROM demandes GROUP BY statut');
  const [[avg]] = await db.query('SELECT AVG(score) AS moyenne, COUNT(*) AS total FROM demandes');
  const [recent] = await db.query(
    `SELECT d.id, d.statut, d.score, d.created_at, cu.nom AS candidat_nom
       FROM demandes d JOIN users cu ON cu.id = d.candidat_id
      ORDER BY d.id DESC LIMIT 5`);
  res.json({ users, demandes: stats, scores: { moyenne: Math.round((avg.moyenne || 0) * 100) / 100, total: avg.total }, recent });
};

// === Utilisateurs ===
export const listUsers = async (req, res) => {
  const { role, statut, q } = req.query;
  const where = []; const params = [];
  if (role && ['candidat', 'redacteur', 'admin'].includes(role)) { where.push('role = ?'); params.push(role); }
  if (statut && ['en_attente', 'actif', 'annule'].includes(statut)) { where.push('statut = ?'); params.push(statut); }
  if (typeof q === 'string' && q.trim()) {
    const like = `%${q.trim().slice(0, 100)}%`;
    where.push('(nom LIKE ? OR email LIKE ?)');
    params.push(like, like);
  }
  const sql = `SELECT id, nom, email, role, statut, created_at FROM users
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT 500`;
  const [rows] = await db.query(sql, params);
  res.json(rows);
};

export const setUserStatut = async (req, res) => {
  const id = Number(req.params.id);
  const { statut } = req.body;
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  if (!['en_attente', 'actif', 'annule'].includes(statut)) throw new ApiError(400, 'Statut invalide (en_attente, actif ou annulé).');
  if (id === req.user.id) throw new ApiError(400, 'Impossible de modifier votre propre compte.');
  const [r] = await db.query('UPDATE users SET statut = ? WHERE id = ?', [statut, id]);
  if (!r.affectedRows) throw new ApiError(404, 'Utilisateur introuvable.');
  res.json({ message: { en_attente: 'Compte mis en attente.', actif: 'Compte réactivé.', annule: 'Compte annulé.' }[statut] });
};

export const cancelUser = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  if (id === req.user.id) throw new ApiError(400, 'Impossible d\u2019annuler votre propre compte.');
  const [r] = await db.query('UPDATE users SET statut = ? WHERE id = ?', ['annule', id]);
  if (!r.affectedRows) throw new ApiError(404, 'Utilisateur introuvable.');
  // Un compte annulé ne doit plus recevoir de demandes en cours de traitement.
  await db.query('UPDATE demandes SET statut = ? WHERE candidat_id = ? AND statut IN (?,?)',
    ['annulee', id, 'en_attente', 'en_cours']).catch(() => {});
  res.json({ message: 'Compte annulé.' });
};

export const activateUser = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [r] = await db.query('UPDATE users SET statut = ? WHERE id = ?', ['actif', id]);
  if (!r.affectedRows) throw new ApiError(404, 'Utilisateur introuvable.');
  res.json({ message: 'Compte réactivé.' });
};

// Validation d'un compte rédacteur : seul un compte en attente peut être approuvé.
export const approveUser = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [r] = await db.query(
    "UPDATE users SET statut = 'actif' WHERE id = ? AND role = 'redacteur' AND statut = 'en_attente'", [id]
  );
  if (!r.affectedRows) throw new ApiError(404, 'Rédacteur en attente introuvable.');
  res.json({ message: 'Compte rédacteur validé. Il peut maintenant se connecter.' });
};

// Refus d'une candidature de rédacteur en attente.
export const rejectUser = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [r] = await db.query(
    "UPDATE users SET statut = 'annule' WHERE id = ? AND role = 'redacteur' AND statut = 'en_attente'", [id]
  );
  if (!r.affectedRows) throw new ApiError(404, 'Rédacteur en attente introuvable.');
  res.json({ message: 'Candidature de rédacteur refusée.' });
};

export const listNewsletter = async (_req, res) => {
  const [rows] = await db.query('SELECT id, email, created_at FROM newsletter ORDER BY id DESC LIMIT 500');
  res.json(rows);
};

// === Demandes (admin) ===
export const listDemandes = async (req, res) => {
  const { statut } = req.query;
  const where = [];
  const params = [];
  if (statut && ['en_attente', 'en_cours', 'terminee', 'annulee'].includes(statut)) { where.push('d.statut = ?'); params.push(statut); }
  const [rows] = await db.query(
    `SELECT d.id, d.statut, d.score, d.created_at, d.updated_at, d.titre_poste,
            cu.nom AS candidat_nom, cu.email AS candidat_email,
            ru.nom AS redacteur_nom
       FROM demandes d
       JOIN users cu ON cu.id = d.candidat_id
       LEFT JOIN users ru ON ru.id = d.redacteur_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY d.id DESC LIMIT 500`,
    params
  );
  res.json(rows);
};

export const setDemandeStatut = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const { statut } = req.body;
  const r = await changeStatut(id, statut, req.user);
  res.json({ message: 'Statut de la demande mis à jour.', ...r });
};
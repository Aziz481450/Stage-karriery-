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
  const { role, statut } = req.query;
  const where = []; const params = [];
  if (role && ['candidat', 'redacteur', 'admin'].includes(role)) { where.push('role = ?'); params.push(role); }
  if (statut && ['actif', 'annule'].includes(statut)) { where.push('statut = ?'); params.push(statut); }
  const sql = `SELECT id, nom, email, role, statut, created_at FROM users
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT 500`;
  const [rows] = await db.query(sql, params);
  res.json(rows);
};

export const setUserStatut = async (req, res) => {
  const id = Number(req.params.id);
  const { statut } = req.body;
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  if (!['actif', 'annule'].includes(statut)) throw new ApiError(400, 'Statut invalide (actif ou annulé).');
  if (id === req.user.id) throw new ApiError(400, 'Impossible de modifier votre propre compte.');
  const [r] = await db.query('UPDATE users SET statut = ? WHERE id = ?', [statut, id]);
  if (!r.affectedRows) throw new ApiError(404, 'Utilisateur introuvable.');
  res.json({ message: statut === 'annule' ? 'Compte annulé.' : 'Compte réactivé.' });
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
import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { readStoredFile } from '../utils/storage.js';

const STATUTS = ['en_attente', 'acceptee', 'refusee'];
const LABELS = { en_attente: 'En attente', acceptee: 'Acceptée', refusee: 'Refusée' };

const BASE = `SELECT c.*,
                     o.titre AS offre_titre, o.entreprise AS offre_entreprise,
                     o.categorie AS offre_categorie, o.redacteur_id AS offre_redacteur_id,
                     ru.nom AS offre_redacteur_nom,
                     u.nom AS candidat_nom, u.email AS candidat_email,
                     d.titre_poste AS cv_titre, d.score AS cv_score, d.cv_path AS cv_path
              FROM candidatures c
              JOIN offres o ON o.id = c.offre_id
              JOIN users ru ON ru.id = o.redacteur_id
              JOIN users u ON u.id = c.candidat_id
              JOIN demandes d ON d.id = c.demande_id`;

const find = async (id) => {
  const [rows] = await db.query(`${BASE} WHERE c.id = ?`, [id]);
  return rows[0] || null;
};
const isAdmin = (user) => user.role === 'admin';
const canManage = (row, user) => isAdmin(user) || row.offre_redacteur_id === user.id;
const canSeeCv = (row, user) => canManage(row, user) || (user.role === 'candidat' && row.candidat_id === user.id);

const parseId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, `${label} invalide.`);
  return id;
};

// Le candidat postule avec un de ses dossiers existants (dont le CV est déjà enregistré).
export const create = async (req, res) => {
  const offreId = parseId(req.params.id, 'Offre');
  const demandeId = parseId(req.body?.demande_id, 'Dossier');
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (message.length < 10) throw new ApiError(400, 'Message de motivation requis (10 caractères minimum).');
  if (message.length > 2000) throw new ApiError(400, 'Message de motivation trop long (2000 caractères maximum).');

  const [offres] = await db.query('SELECT id, statut FROM offres WHERE id = ?', [offreId]);
  if (!offres.length) throw new ApiError(404, 'Offre introuvable.');
  if (offres[0].statut !== 'ouverte') throw new ApiError(400, 'Cette offre est fermée aux candidatures.');

  const [demandes] = await db.query(
    'SELECT id FROM demandes WHERE id = ? AND candidat_id = ? AND cv_path IS NOT NULL AND cv_path <> ?',
    [demandeId, req.user.id, '']
  );
  if (!demandes.length) throw new ApiError(400, 'Dossier avec CV introuvable.');

  const [existing] = await db.query('SELECT id FROM candidatures WHERE offre_id = ? AND candidat_id = ?', [offreId, req.user.id]);
  if (existing.length) throw new ApiError(409, 'Vous avez déjà postulé à cette offre.');

  let result;
  try {
    [result] = await db.query(
      'INSERT INTO candidatures (offre_id, candidat_id, demande_id, message) VALUES (?,?,?,?)',
      [offreId, req.user.id, demandeId, message]
    );
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'Vous avez déjà postulé à cette offre.');
    throw e;
  }
  res.status(201).json(await find(result.insertId));
};

// Liste selon le rôle : candidat = ses candidatures, rédacteur = celles de ses offres, admin = tout.
export const list = async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.role === 'candidat') { where.push('c.candidat_id = ?'); params.push(req.user.id); }
  else if (req.user.role === 'redacteur') { where.push('o.redacteur_id = ?'); params.push(req.user.id); }
  if (STATUTS.includes(req.query.statut)) { where.push('c.statut = ?'); params.push(req.query.statut); }
  if (/^\d+$/.test(String(req.query.offre_id || ''))) { where.push('c.offre_id = ?'); params.push(Number(req.query.offre_id)); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(`${BASE} ${clause} ORDER BY c.created_at DESC, c.id DESC LIMIT 500`, params);
  res.json(rows);
};

// Candidatures reçues sur une offre donnée (rédacteur propriétaire ou admin).
export const listForOffer = async (req, res) => {
  const offreId = parseId(req.params.id, 'Offre');
  const [offres] = await db.query('SELECT id, redacteur_id FROM offres WHERE id = ?', [offreId]);
  if (!offres.length) throw new ApiError(404, 'Offre introuvable.');
  if (!isAdmin(req.user) && offres[0].redacteur_id !== req.user.id)
    throw new ApiError(403, 'Cette offre ne vous appartient pas.');
  const [rows] = await db.query(`${BASE} WHERE c.offre_id = ? ORDER BY c.created_at DESC, c.id DESC`, [offreId]);
  res.json(rows);
};

export const setStatut = async (req, res) => {
  const id = parseId(req.params.id, 'Candidature');
  const statut = req.body?.statut;
  if (!STATUTS.includes(statut)) throw new ApiError(400, 'Statut invalide (en_attente, acceptee ou refusee).');
  const row = await find(id);
  if (!row) throw new ApiError(404, 'Candidature introuvable.');
  if (!canManage(row, req.user)) throw new ApiError(403, 'Vous ne pouvez gérer que les candidatures de vos offres.');
  await db.query('UPDATE candidatures SET statut = ? WHERE id = ?', [statut, id]);
  res.json({ ...(await find(id)), statut_label: LABELS[statut] });
};

export const getCv = async (req, res) => {
  const id = parseId(req.params.id, 'Candidature');
  const row = await find(id);
  if (!row) throw new ApiError(404, 'Candidature introuvable.');
  if (!canSeeCv(row, req.user)) throw new ApiError(403, 'Accès refusé à ce CV.');
  const { buf } = await readStoredFile(row.cv_path);
  const basename = String(row.cv_path).split('/').pop();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${basename}"`);
  res.send(buf);
};

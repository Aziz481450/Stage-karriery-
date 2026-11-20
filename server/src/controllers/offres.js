import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export const CATEGORIES = ['frontend', 'backend', 'fullstack', 'mobile', 'ai', 'iot', 'embedded'];
const STATUTS = ['ouverte', 'fermee'];

const BASE = `SELECT o.*, u.nom AS redacteur_nom
                FROM offres o JOIN users u ON u.id = o.redacteur_id`;

const has = (body, key) => Object.prototype.hasOwnProperty.call(body || {}, key);
const text = (value, max, label, { required = false, min = 1 } = {}) => {
  const s = typeof value === 'string' ? value.trim() : '';
  if (required && s.length < min) throw new ApiError(400, `${label} requis (${min} caractère${min > 1 ? 's' : ''} minimum).`);
  if (s.length > max) throw new ApiError(400, `${label} trop long (${max} caractères maximum).`);
  return s;
};
const integer = (value, label) => {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 1000000000) throw new ApiError(400, `${label} invalide.`);
  return n;
};
const isAdmin = (user) => user.role === 'admin';
const owns = (row, user) => isAdmin(user) || row.redacteur_id === user.id;

const buildValues = (body, partial = false) => {
  const values = {};
  if (!partial || has(body, 'titre')) values.titre = text(body.titre, 180, 'Le titre', { required: true, min: 3 });
  if (!partial || has(body, 'entreprise')) values.entreprise = text(body.entreprise, 160, "L'entreprise", { required: true, min: 2 });
  if (!partial || has(body, 'categorie')) {
    const categorie = text(body.categorie, 30, 'La catégorie', { required: true });
    if (!CATEGORIES.includes(categorie)) throw new ApiError(400, 'Catégorie invalide.');
    values.categorie = categorie;
  }
  if (!partial || has(body, 'lieu')) values.lieu = text(body.lieu || '', 160, 'Le lieu');
  if (!partial || has(body, 'salaire_min')) values.salaire_min = integer(body.salaire_min, 'Le salaire minimum');
  if (!partial || has(body, 'salaire_max')) values.salaire_max = integer(body.salaire_max, 'Le salaire maximum');
  if (!partial || has(body, 'niveau_experience')) values.niveau_experience = text(body.niveau_experience || '', 80, "Le niveau d'expérience");
  if (!partial || has(body, 'description')) values.description = text(body.description, 10000, 'La description', { required: true, min: 10 });
  if (!partial || has(body, 'exigences')) values.exigences = text(body.exigences || '', 10000, 'Les exigences');
  if (!partial || has(body, 'statut')) {
    const statut = text(body.statut || 'ouverte', 20, 'Le statut') || 'ouverte';
    if (!STATUTS.includes(statut)) throw new ApiError(400, 'Statut invalide (ouverte ou fermee).');
    values.statut = statut;
  }
  if (values.salaire_min != null && values.salaire_max != null && values.salaire_min > values.salaire_max)
    throw new ApiError(400, 'Le salaire minimum ne peut pas dépasser le salaire maximum.');
  return values;
};

const filters = (query, { scope, id }) => {
  const where = [];
  const params = [];
  if (scope === 'ouverte') where.push("o.statut = 'ouverte'");
  else if (STATUTS.includes(query.statut)) { where.push('o.statut = ?'); params.push(query.statut); }
  if (scope === 'mine') { where.push('o.redacteur_id = ?'); params.push(id); }
  if (CATEGORIES.includes(query.categorie)) { where.push('o.categorie = ?'); params.push(query.categorie); }
  if (typeof query.q === 'string' && query.q.trim()) {
    const like = `%${query.q.trim().slice(0, 100)}%`;
    where.push('(o.titre LIKE ? OR o.entreprise LIKE ? OR o.lieu LIKE ?)');
    params.push(like, like, like);
  }
  return { where, params };
};

const find = async (id) => {
  const [rows] = await db.query(`${BASE} WHERE o.id = ?`, [id]);
  return rows[0] || null;
};

// Consultation candidat : uniquement les offres ouvertes (admin : toutes).
export const list = async (req, res) => {
  const { where, params } = filters(req.query, { scope: isAdmin(req.user) ? 'all' : 'ouverte' });
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(`${BASE} ${clause} ORDER BY o.created_at DESC, o.id DESC LIMIT 200`, params);
  res.json(rows);
};

// Gestion rédacteur : ses offres ; admin : toutes les offres.
export const listMine = async (req, res) => {
  const scope = isAdmin(req.user) ? 'all' : 'mine';
  const { where, params } = filters(req.query, { scope, id: req.user.id });
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(`${BASE} ${clause} ORDER BY o.created_at DESC, o.id DESC LIMIT 500`, params);
  res.json(rows);
};

export const get = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const row = await find(id);
  if (!row || (row.statut === 'fermee' && !owns(row, req.user))) throw new ApiError(404, 'Offre introuvable.');
  res.json(row);
};

export const create = async (req, res) => {
  const values = buildValues(req.body || {});
  let redacteurId = req.user.id;
  if (isAdmin(req.user) && has(req.body, 'redacteur_id') && req.body.redacteur_id !== '' && req.body.redacteur_id != null) {
    redacteurId = Number(req.body.redacteur_id);
    if (!Number.isInteger(redacteurId)) throw new ApiError(400, 'Rédacteur invalide.');
    const [users] = await db.query("SELECT id FROM users WHERE id = ? AND role IN ('redacteur','admin')", [redacteurId]);
    if (!users.length) throw new ApiError(400, 'Rédacteur introuvable.');
  }
  const [result] = await db.query('INSERT INTO offres (redacteur_id, titre, entreprise, categorie, lieu, salaire_min, salaire_max, niveau_experience, description, exigences, statut) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
    redacteurId, values.titre, values.entreprise, values.categorie, values.lieu,
    values.salaire_min, values.salaire_max, values.niveau_experience,
    values.description, values.exigences, values.statut,
  ]);
  res.status(201).json(await find(result.insertId));
};

export const update = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const row = await find(id);
  if (!row) throw new ApiError(404, 'Offre introuvable.');
  if (!owns(row, req.user)) throw new ApiError(403, 'Vous ne pouvez modifier que vos offres.');
  const values = buildValues(req.body || {}, true);
  const keys = Object.keys(values);
  if (!keys.length) throw new ApiError(400, 'Aucune donnée à mettre à jour.');
  await db.query(`UPDATE offres SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map((k) => values[k]), id]);
  res.json(await find(id));
};

export const remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const row = await find(id);
  if (!row) throw new ApiError(404, 'Offre introuvable.');
  if (!owns(row, req.user)) throw new ApiError(403, 'Vous ne pouvez supprimer que vos offres.');
  await db.query('DELETE FROM offres WHERE id = ?', [id]);
  res.json({ message: 'Offre supprimée.' });
};

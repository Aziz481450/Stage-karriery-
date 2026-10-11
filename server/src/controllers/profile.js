import path from 'path';
import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { saveBuffer, removeStoredFile, readStoredFile, buildStorageName } from '../utils/storage.js';

const FIELDS = {
  candidats: ['telephone', 'ville', 'titre_poste', 'niveau_etudes', 'competences', 'bio'],
  redacteurs: ['specialite', 'annees_experience', 'langues', 'bio', 'disponible']
};
const INT_FIELDS = new Set(['annees_experience', 'disponible']);

// Nettoie les champs autorisés : chaînes trimées, champ vide -> NULL, entiers validés
const clean = (table, body) => {
  const out = {};
  for (const f of FIELDS[table]) {
    const raw = body[f];
    if (raw === undefined || raw === null) continue;
    if (INT_FIELDS.has(f)) {
      const n = Number(raw);
      out[f] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
    } else if (typeof raw === 'string') {
      const v = raw.trim().slice(0, 65000);
      out[f] = v === '' ? null : v;
    } else if (typeof raw === 'boolean') {
      out[f] = raw ? 1 : 0;
    }
  }
  return out;
};

export const getProfile = (table) => async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.nom,u.email,u.photo,p.* FROM ${table} p JOIN users u ON u.id=p.user_id WHERE p.user_id=?`, [req.user.id]);
  res.json(rows[0] || {});
};

export const updateProfile = (table) => async (req, res) => {
  if (req.body.nom !== undefined) {
    const nom = String(req.body.nom).trim();
    if (nom.length < 2 || nom.length > 120)
      return res.status(400).json({ message: 'Nom invalide (2 à 120 caractères).' });
    await db.query('UPDATE users SET nom=? WHERE id=?', [nom, req.user.id]);
  }
  const vals = clean(table, req.body);
  const cols = Object.keys(vals);
  if (cols.length)
    await db.query(`UPDATE ${table} SET ${cols.map((c) => c + '=?').join(',')} WHERE user_id=?`,
      [...cols.map((c) => vals[c]), req.user.id]);
  res.json({ message: 'Profil enregistré.' });
};

const IMG_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

// Photo de profil : stockée hors du nom d'origine, servie publiquement (avatars).
export const setPhoto = async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Aucune image reçue.');
  const ext = IMG_EXT[req.file.mimetype] || 'png';
  const saved = await saveBuffer(req.file.buffer, 'avatars', buildStorageName('av', ext));
  const [[old]] = await db.query('SELECT photo FROM users WHERE id=?', [req.user.id]);
  await db.query('UPDATE users SET photo=? WHERE id=?', [saved.rel, req.user.id]);
  if (old?.photo) await removeStoredFile(old.photo);
  res.json({ message: 'Photo enregistrée.', photo: saved.rel });
};

export const deletePhoto = async (req, res) => {
  const [[old]] = await db.query('SELECT photo FROM users WHERE id=?', [req.user.id]);
  if (old?.photo) await removeStoredFile(old.photo);
  await db.query('UPDATE users SET photo=NULL WHERE id=?', [req.user.id]);
  res.json({ message: 'Photo retirée.', photo: null });
};

export const getUserPhoto = async (req, res) => {
  const [[row]] = await db.query('SELECT photo FROM users WHERE id=?', [req.params.id]);
  if (!row?.photo) return res.status(404).end();
  try {
    const { buf, full } = await readStoredFile(row.photo);
    res.type(path.extname(full)).set('Cache-Control', 'public, max-age=86400').send(buf);
  } catch {
    res.status(404).end();
  }
};

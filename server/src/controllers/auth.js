import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
const sign = (u) => jwt.sign({ id: u.id, role: u.role, nom: u.nom }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u.id, nom: u.nom, email: u.email, role: u.role, photo: u.photo ?? null });

export async function register(req, res) {
  const { nom, email, password, role } = req.body;
  if (!nom || !email || !password || !['candidat', 'redacteur'].includes(role))
    return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
  if (password.length < 8) return res.status(400).json({ message: 'Mot de passe : 8 caractères minimum.' });
  const [dup] = await db.query('SELECT id FROM users WHERE email=?', [email]);
  if (dup.length) return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
  const hash = await bcrypt.hash(password, 10);
  let r;
  try {
    [r] = await db.query('INSERT INTO users(nom,email,mot_de_passe,role) VALUES(?,?,?,?)', [nom, email, hash, role]);
  } catch (e) {
    // Course possible entre la vérification et l'insertion (contrainte UNIQUE)
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    throw e;
  }
  await db.query(`INSERT INTO ${role}s(user_id) VALUES(?)`, [r.insertId]);
  const u = { id: r.insertId, nom, email, role };
  res.status(201).json({ token: sign(u), user: pub(u) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.mot_de_passe)))
    return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
  if (u.statut === 'annule') return res.status(403).json({ message: 'Ce compte a été annulé.' });
  res.json({ token: sign(u), user: pub(u) });
}

export const me = async (req, res) => {
  const [rows] = await db.query('SELECT id,nom,email,role,photo FROM users WHERE id=?', [req.user.id]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ message: 'Utilisateur introuvable.' });
};
export const logout = (_req, res) => res.json({ message: 'Déconnecté.' });

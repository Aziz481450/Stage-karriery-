import { db } from '../config/db.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribe(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) return res.status(400).json({ message: 'Adresse email invalide.' });
  const [dup] = await db.query('SELECT id FROM newsletter WHERE email=?', [email]);
  if (dup.length) return res.status(409).json({ message: 'Cette adresse est déjà inscrite.' });
  await db.query('INSERT INTO newsletter(email) VALUES(?)', [email]);
  res.status(201).json({ message: 'Inscription enregistrée.' });
}

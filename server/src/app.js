import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { register, login, logout, me } from './controllers/auth.js';
import { getProfile, updateProfile, setPhoto, deletePhoto, getUserPhoto } from './controllers/profile.js';
import { assistantChat } from './controllers/assistant.js';
import { subscribe } from './controllers/newsletter.js';
import { requireAuth, requireRole } from './middlewares/auth.js';
import { limit } from './middlewares/limit.js';
import { multerError, uploadPhoto } from './middlewares/upload.js';
import { ApiError } from './utils/ApiError.js';
import { db } from './config/db.js';
import demandesRoutes from './routes/demandes.js';
import notificationsRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET manquant : complétez server/.env puis relancez.');
  process.exit(1);
}

export const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

app.get('/api/health', wrap(async (_req, res) => {
  await db.query('SELECT 1');
  res.json({ ok: true });
}));

app.post('/api/auth/register', limit('register', 15 * 60000, 20), wrap(register));
app.post('/api/auth/login', limit('login', 15 * 60000, 10), wrap(login));
app.post('/api/auth/logout', requireAuth, logout);
app.get('/api/auth/me', requireAuth, wrap(me));

for (const [role, table] of [['candidat', 'candidats'], ['redacteur', 'redacteurs']]) {
  app.get(`/api/${role}/profil`, requireAuth, requireRole(role), wrap(getProfile(table)));
  app.put(`/api/${role}/profil`, requireAuth, requireRole(role), wrap(updateProfile(table)));
}
app.post('/api/newsletter', limit('newsletter', 15 * 60000, 5), wrap(subscribe));

// Photo de profil (upload/retrait) + service public de l'image.
app.post('/api/profil/photo', requireAuth, (req, res, next) =>
  uploadPhoto.single('photo')(req, res, (err) => (err ? next(err) : next())), wrap(setPhoto));
app.delete('/api/profil/photo', requireAuth, wrap(deletePhoto));
app.get('/api/users/:id/photo', wrap(getUserPhoto));

// Assistant IA (Ollama) accessible depuis la barre de navigation.
app.post('/api/assistant/chat', requireAuth, limit('assistant', 60000, 20), wrap(assistantChat));

// Sprint 2/3/4
app.use('/api', demandesRoutes);
app.use('/api', notificationsRoutes);
app.use('/api', adminRoutes);

// Toute route API inconnue renvoie du JSON (sinon le front affiche un message trompeur)
app.use('/api', (_req, res) => res.status(404).json({ message: 'Route inconnue.' }));

// En production, ce serveur sert aussi le front (build Vite) : un seul lien public,
// API et messagerie sur la même origine (aucune config CORS côté navigateur).
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Gestion centralisée des erreurs : codes HTTP explicites, JSON propre.
export const errorHandler = (err, _req, res, _next) => {
  const upload = multerError(err);
  if (upload) return res.status(upload.status).json({ message: upload.message });
  if (err instanceof ApiError) return res.status(err.status).json({ message: err.message });
  if (err instanceof multer.MulterError) return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur.' });
};
app.use(errorHandler);
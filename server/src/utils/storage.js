import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // server/src/utils
const UPLOADS_DIR = path.join(HERE, '../../uploads'); // server/uploads

export const uploadsDir = UPLOADS_DIR;

const ensureDir = async (dir) => {
  try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); }
};

// Nom de stockage sécurisé : jamais le nom original de l'utilisateur.
export const buildStorageName = (prefix, userExt) =>
  `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${userExt}`;

export async function saveBuffer(buf, subdir, filename) {
  const dir = path.join(UPLOADS_DIR, subdir);
  await ensureDir(dir);
  const full = path.join(dir, filename);
  await fs.writeFile(full, buf);
  return { full, rel: `${subdir}/${filename}` };
}

export async function removeStoredFile(rel) {
  if (!rel) return;
  try { await fs.unlink(path.join(UPLOADS_DIR, rel)); } catch { /* best effort */ }
}

export async function readStoredFile(rel) {
  const full = path.join(UPLOADS_DIR, rel);
  const buf = await fs.readFile(full);
  return { buf, full };
}
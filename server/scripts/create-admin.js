import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from '../src/config/db.js';

const [email, nom, ...reste] = process.argv.slice(2);
const password = reste.join(' ');

if (!email || !nom || !password || password.length < 8) {
  console.error('Usage : npm run admin -- <email> "<nom complet>" <mot de passe (8+ car.)>');
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(password, 10);
  const [dup] = await db.query('SELECT id FROM users WHERE email=?', [email]);
  if (dup.length) {
    await db.query("UPDATE users SET mot_de_passe=?, role='admin', statut='actif' WHERE id=?", [hash, dup[0].id]);
    console.log(`Compte ${email} promu administrateur.`);
  } else {
    await db.query('INSERT INTO users(nom,email,mot_de_passe,role) VALUES(?,?,?,?)', [nom, email, hash, 'admin']);
    console.log(`Administrateur ${email} créé.`);
  }
} catch (e) {
  console.error('Échec :', e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}

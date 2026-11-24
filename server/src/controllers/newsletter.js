import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { mailMode, newsletterFrom, sendNewsletterEmail } from '../services/mailer.js';
import { buildNewsletterEmail } from '../services/newsletterEmail.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribe(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) return res.status(400).json({ message: 'Adresse email invalide.' });
  const [dup] = await db.query('SELECT id FROM newsletter WHERE email=?', [email]);
  if (dup.length) return res.status(409).json({ message: 'Cette adresse est déjà inscrite.' });
  await db.query('INSERT INTO newsletter(email) VALUES(?)', [email]);
  res.status(201).json({ message: 'Inscription enregistrée.' });
}

const str = (value, max, label, { required = false, min = 1 } = {}) => {
  const s = typeof value === 'string' ? value.trim() : '';
  if (required && s.length < min)
    throw new ApiError(400, `${label} requis (${min} caractère${min > 1 ? 's' : ''} minimum).`);
  if (s.length > max) throw new ApiError(400, `${label} trop long (${max} caractères maximum).`);
  return s;
};
const bool = (v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'on';
const safeUrl = (value, label, { required = false } = {}) => {
  const s = str(value, 2000, label, { required });
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || /^mailto:/i.test(s)) return s;
  if (s.startsWith('/')) {
    const base = String(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    return `${base}${s}`;
  }
  throw new ApiError(400, `${label} doit être une URL http(s), mailto: ou commencer par /`);
};

// Normalise le formulaire admin avant stockage et rendu : aucun HTML n'est accepté.
function normalizeCampaign(body = {}) {
  const content = {
    objet: str(body.objet, 200, 'L’objet', { required: true, min: 3 }),
    intro: str(body.intro, 3000, 'L’introduction'),
    offre: { enabled: false },
    carriere: { enabled: false },
    marche: { enabled: false },
    succes: { enabled: false },
    ecrivain: { enabled: false },
  };
  let sections = 0;

  if (bool(body.offre?.enabled)) {
    const min = str(body.offre?.salaire_min, 30, 'Le salaire minimum');
    const max = str(body.offre?.salaire_max, 30, 'Le salaire maximum');
    const salaire = min || max
      ? `${min || '…'} – ${max || '…'}`
      : str(body.offre?.salaire, 120, 'Le salaire', { required: true });
    content.offre = {
      enabled: true,
      titre: str(body.offre?.titre, 180, 'Le titre du poste', { required: true, min: 3 }),
      entreprise: str(body.offre?.entreprise, 160, 'L’entreprise', { required: true, min: 2 }),
      categorie: str(body.offre?.categorie, 60, 'La spécialité'),
      lieu: str(body.offre?.lieu, 160, 'Le lieu'),
      experience: str(body.offre?.experience, 80, 'Le niveau d’expérience'),
      salaire,
      description: str(body.offre?.description, 4000, 'La description du poste', { required: true, min: 10 }),
      lien: safeUrl(body.offre?.lien, 'Le lien de l’offre'),
    };
    sections += 1;
  }

  if (bool(body.carriere?.enabled)) {
    content.carriere = {
      enabled: true,
      titre: str(body.carriere?.titre, 160, 'Le titre du récit', { required: true }),
      texte: str(body.carriere?.texte, 6000, 'Le récit de parcours', { required: true, min: 10 }),
    };
    sections += 1;
  }

  if (bool(body.marche?.enabled)) {
    content.marche = {
      enabled: true,
      titre: str(body.marche?.titre, 160, 'Le titre de l’analyse marché', { required: true }),
      texte: str(body.marche?.texte, 6000, 'L’analyse du marché local', { required: true, min: 10 }),
      chiffre: str(body.marche?.chiffre, 40, 'L’indicateur chiffré'),
      libelle: str(body.marche?.libelle, 120, 'Le libellé de l’indicateur'),
    };
    sections += 1;
  }

  if (bool(body.succes?.enabled)) {
    const rawStories = Array.isArray(body.succes?.stories) ? body.succes.stories.slice(0, 6) : [];
    if (!rawStories.length) throw new ApiError(400, 'Ajoutez au moins une success story.');
    const stories = rawStories.map((st, i) => ({
      titre: str(st?.titre, 160, `Le titre de la success story ${i + 1}`, { required: true }),
      texte: str(st?.texte, 3000, `Le texte de la success story ${i + 1}`, { required: true, min: 10 }),
    }));
    content.succes = {
      enabled: true,
      titre: str(body.succes?.titre, 160, 'Le titre de la rubrique success stories') || 'Success stories',
      stories,
    };
    sections += 1;
  }

  if (bool(body.ecrivain?.enabled)) {
    if (!bool(body.ecrivain?.permission))
      throw new ApiError(400, 'Le portrait du rédacteur nécessite son autorisation pour l’exemple de CV avant/après.');
    content.ecrivain = {
      enabled: true,
      nom: str(body.ecrivain?.nom, 160, 'Le nom du rédacteur', { required: true, min: 2 }),
      specialite: str(body.ecrivain?.specialite, 160, 'La spécialité du rédacteur', { required: true }),
      avant: str(body.ecrivain?.avant, 3000, 'L’exemple de CV avant', { required: true, min: 5 }),
      apres: str(body.ecrivain?.apres, 3000, 'L’exemple de CV après', { required: true, min: 5 }),
      permission: true,
      cta_label: str(body.ecrivain?.cta_label, 80, 'Le libellé du bouton') || 'Book this writer',
      cta_url: safeUrl(body.ecrivain?.cta_url, 'Le lien du bouton', { required: true }),
    };
    sections += 1;
  }

  if (!sections) throw new ApiError(400, 'Activez au moins une rubrique pour la newsletter.');
  return content;
}

const mapLimit = async (items, max, fn) => {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(max, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
};

// Envoi d'une campagne à tous les inscrits + historique dans newsletter_campagnes.
export async function sendCampaign(req, res) {
  const content = normalizeCampaign(req.body);
  const [subscribers] = await db.query('SELECT email FROM newsletter ORDER BY id ASC LIMIT 500');
  if (!subscribers.length) throw new ApiError(409, 'Aucun inscrit à la newsletter pour le moment.');

  const { text, html } = buildNewsletterEmail(content);
  const results = await mapLimit(subscribers, 5, async (row) => {
    try {
      await sendNewsletterEmail({ to: row.email, subject: content.objet, text, html });
      return true;
    } catch (e) {
      console.error(`[NEWSLETTER] Échec envoi ${row.email}:`, e.message);
      return false;
    }
  });
  const succes = results.filter(Boolean).length;
  const echecs = results.length - succes;

  const [r] = await db.query(
    `INSERT INTO newsletter_campagnes(objet, contenu_json, destinataires, succes, echecs, mode, expediteur)
     VALUES(?,?,?,?,?,?,?)`,
    [content.objet, JSON.stringify(content), subscribers.length, succes, echecs, mailMode, newsletterFrom]
  );
  console.log(`[NEWSLETTER] Campagne #${r.insertId} « ${content.objet} » — ${succes}/${subscribers.length} envoyés (${mailMode})`);

  res.status(201).json({
    message: `Newsletter envoyée à ${succes} inscrit${succes > 1 ? 's' : ''}${echecs ? ` (${echecs} échec${echecs > 1 ? 's' : ''})` : ''}.`,
    mode: mailMode,
    sender: newsletterFrom,
    destinataires: subscribers.length,
    succes,
    echecs,
    campagne: { id: r.insertId, objet: content.objet, created_at: new Date().toISOString() },
  });
}

export async function listCampaigns(_req, res) {
  const [rows] = await db.query(
    `SELECT id, objet, contenu_json, destinataires, succes, echecs, mode, expediteur, created_at
       FROM newsletter_campagnes ORDER BY id DESC LIMIT 50`
  );
  res.json(rows.map((row) => {
    let sections = [];
    try {
      const c = typeof row.contenu_json === 'string' ? JSON.parse(row.contenu_json) : row.contenu_json;
      sections = Object.entries(c || {})
        .filter(([, v]) => v && typeof v === 'object' && v.enabled)
        .map(([k]) => ({ carriere: 'Career story', marche: 'Local market insight', succes: 'Success stories', ecrivain: 'Spotlight writer', offre: 'Offre d’emploi' }[k] || k));
    } catch { /* historique illisible : on conserve les compteurs */ }
    const { contenu_json, ...rest } = row;
    return { ...rest, sections };
  }));
}

// Rédacteurs actifs proposés dans la rubrique "Spotlight on the writers".
export async function listWriters(_req, res) {
  const [rows] = await db.query(
    `SELECT u.id, u.nom, u.email, r.specialite, r.annees_experience, r.disponible
       FROM users u JOIN redacteurs r ON r.user_id = u.id
      WHERE u.role = 'redacteur' AND u.statut = 'actif'
      ORDER BY u.nom ASC LIMIT 100`
  );
  res.json(rows);
}

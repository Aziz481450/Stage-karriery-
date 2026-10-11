import { ApiError } from '../utils/ApiError.js';

// Retourne l'id du rédacteur disponible le plus pertinent (dans la transaction courante).
// Score de similarité : mots partagés entre le poste visé et la spécialité du rédacteur,
// puis ancienneté (descente) et charge de travail (montante) en départage.
export async function findBestRedacteur(conn, titrePoste) {
  const [rows] = await conn.execute(
    `SELECT r.user_id, r.specialite, r.annees_experience,
            (SELECT COUNT(*) FROM demandes d
              WHERE d.redacteur_id = r.user_id AND d.statut IN ('en_attente','en_cours')) AS charge
       FROM redacteurs r
       JOIN users u ON u.id = r.user_id
      WHERE r.disponible = 1 AND u.role = 'redacteur' AND u.statut = 'actif'`
  );
  if (!rows.length) return null;
  const mots = (titrePoste || '').toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const sim = (specialite) =>
    mots.length ? (specialite || '').toLowerCase().split(/\W+/).filter((w) => mots.includes(w)).length : 0;
  rows.sort((a, b) =>
    sim(b.specialite) - sim(a.specialite)
    || (b.annees_experience || 0) - (a.annees_experience || 0)
    || a.charge - b.charge
    || a.user_id - b.user_id
  );
  const best = rows[0];
  // Verrouillage préventif du rédacteur choisi pour empêcher deux attributions simultanées.
  const [locked] = await conn.execute(
    'SELECT user_id, disponible FROM redacteurs WHERE user_id = ? FOR UPDATE', [best.user_id]);
  if (!locked.length || !locked[0].disponible) return null;
  return best.user_id;
}

// Vérifie qu'un utilisateur a le droit d'accéder à une demande.
// Retourne la ligne de demande ou null.
export async function getDemandeForUser(conn, id, user) {
  const [rows] = await conn.execute(
    'SELECT d.*, u.nom AS candidat_nom FROM demandes d JOIN users u ON u.id = d.candidat_id WHERE d.id = ?',
    [id]
  );
  if (!rows.length) return null;
  const d = rows[0];
  const isOwner = d.candidat_id === user.id;
  const isRedacteur = d.redacteur_id === user.id;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isRedacteur && !isAdmin) {
    if (user.role === 'admin') return d;
    throw new ApiError(403, 'Accès refusé : vous n\u2019êtes pas concerné par cette demande.');
  }
  return d;
}

// Accesseur pour les messages/fichiers : autorise le candidat, le rédacteur assigné ou l'admin.
export const canAccessDemande = (d, user) =>
  d.candidat_id === user.id || d.redacteur_id === user.id || user.role === 'admin';
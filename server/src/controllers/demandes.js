import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { extractCvText } from '../services/cvExtract.js';
import { analyzeCV, improveCV } from '../services/llm.js';
import { renderCvPdf } from '../services/cvPdf.js';
import { getDemandeForUser } from '../services/matching.js';
import { createNotification } from '../services/notifications.js';
import { emitToRoom, emitToUser } from '../services/socket.js';
import { saveBuffer, removeStoredFile, buildStorageName, readStoredFile } from '../utils/storage.js';

export const createDemande = async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Aucun fichier reçu.');
  const fichier = req.file;

  const text = await extractCvText(fichier.buffer);
  const [[cand]] = await db.query('SELECT titre_poste FROM candidats WHERE user_id = ?', [req.user.id]);
  const titrePoste = cand?.titre_poste || null;
  const analyse = await analyzeCV({ text, titrePoste });

  const ext = 'pdf';
  const saved = await saveBuffer(fichier.buffer, 'cvs', buildStorageName('cv', ext));

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Workflow Sprint 5 : la demande est posée « en attente » sans rédacteur ;
    // le matching devient une décision explicite (le rédacteur accepte ou refuse).
    const [r] = await conn.execute(
      `INSERT INTO demandes (candidat_id, redacteur_id, cv_path, titre_poste, score, analyse_json, statut)
       VALUES (?,NULL,?,?,?,?,'en_attente')`,
      [req.user.id, saved.rel, titrePoste, analyse.score, JSON.stringify(analyse)]
    );
    const demandeId = r.insertId;

    await createNotification({
      conn, userId: req.user.id, type: 'demande', titre: 'Demande envoyée',
      message: `Votre CV n° ${demandeId} est en attente : un rédacteur disponible peut maintenant l\u2019accepter.`,
      demandeId
    });
    await conn.commit();
    emitToRoom('redacteurs', 'demande_disponible', { demandeId, titre: titrePoste });
    // Cloche : les rédacteurs disponibles (tri exactement comme dans la file d'attente)
    // sont notifiés en temps réel de la nouvelle sollicitation.
    const [reds] = await db.query(
      `SELECT r.user_id FROM redacteurs r
        JOIN users u ON u.id = r.user_id
        WHERE r.disponible = 1
          AND NOT EXISTS (SELECT 1 FROM demande_refus dr WHERE dr.demande_id = ? AND dr.redacteur_id = r.user_id)`,
      [demandeId]
    );
    await Promise.all(reds.map(({ user_id }) => createNotification({
      userId: user_id, type: 'demande', titre: 'Nouvelle demande de CV',
      message: `Le candidat ${req.user.nom} vous propose son CV — l'acceptation est dans le bandeau (n° ${demandeId}).`,
      demandeId
    })));
    res.status(201).json({
      message: 'CV envoyé avec succès.',
      demande: { id: demandeId, statut: 'en_attente', score: analyse.score, redacteur_id: null },
      redacteur: null
    });
  } catch (e) {
    await conn.rollback();
    await removeStoredFile(saved.rel);
    throw e;
  } finally {
    conn.release();
  }
};

export const listCandidatDemandes = async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.id, d.statut, ROUND(d.score) AS score, d.created_at, d.updated_at, d.titre_poste,
            u.nom AS redacteur_nom
       FROM demandes d
       LEFT JOIN users u ON u.id = d.redacteur_id
      WHERE d.candidat_id = ?
      ORDER BY d.id DESC`,
    [req.user.id]
  );
  res.json(rows);
};

// GET /api/demandes : liste selon le rôle (contrat Sprint 2).
export const listGeneric = async (req, res) =>
  req.user.role === 'candidat' ? listCandidatDemandes(req, res) : listRedacteurDemandes(req, res);

// GET /api/conversations : conversations du user (dernier message, nombre, non-lus de type
// « message ») — alimente la page Messagerie du candidat et du rédacteur.
export const listConversations = async (req, res) => {
  const user = req.user;
  const mine = user.role === 'candidat' ? 'd.candidat_id = ?' : 'd.redacteur_id = ?';
  const [rows] = await db.query(
    `SELECT d.id, d.titre_poste, d.statut, d.created_at, d.updated_at,
            cu.nom AS candidat_nom, ru.nom AS redacteur_nom,
            cu.id AS candidat_id, ru.id AS redacteur_id,
            cu.photo AS candidat_photo, ru.photo AS redacteur_photo,
            lm.contenu AS dernier_contenu, lm.created_at AS dernier_at, lm.id AS dernier_id,
            (SELECT COUNT(*) FROM messages m2 WHERE m2.demande_id = d.id) AS nb_messages,
            (SELECT COUNT(*) FROM notifications n
              WHERE n.user_id = ? AND n.demande_id = d.id AND n.type = 'message' AND n.lue = 0) AS non_lues
       FROM demandes d
       LEFT JOIN users cu ON cu.id = d.candidat_id
       LEFT JOIN users ru ON ru.id = d.redacteur_id
       LEFT JOIN messages lm ON lm.id = (SELECT MAX(m3.id) FROM messages m3 WHERE m3.demande_id = d.id)
      WHERE ${mine}
      ORDER BY (lm.id IS NULL) ASC, lm.id DESC, d.id DESC`,
    [user.id, user.id, user.id]
  );
  res.json(rows.map((r) => ({
    id: r.id, titre_poste: r.titre_poste, statut: r.statut,
    created_at: r.created_at, updated_at: r.updated_at,
    candidat_nom: r.candidat_nom, redacteur_nom: r.redacteur_nom,
    candidat_id: r.candidat_id, redacteur_id: r.redacteur_id,
    candidat_photo: r.candidat_photo || null, redacteur_photo: r.redacteur_photo || null,
    dernier: r.dernier_contenu || null, dernier_at: r.dernier_at, dernier_id: r.dernier_id || null,
    nb_messages: Number(r.nb_messages), non_lues: Number(r.non_lues)
  })));
};

export const getCandidatDemande = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [rows] = await db.query(
    `SELECT d.*, cu.id AS candidat_id, cu.nom AS candidat_nom, cu.email, ru.nom AS redacteur_nom,
            cu.photo AS candidat_photo, ru.photo AS redacteur_photo,
            c.telephone, c.ville, c.niveau_etudes, c.competences, c.bio
       FROM demandes d
       JOIN users cu ON cu.id = d.candidat_id
       LEFT JOIN users ru ON ru.id = d.redacteur_id
       LEFT JOIN candidats c ON c.user_id = d.candidat_id
      WHERE d.id = ?`,
    [id]
  );
  if (!rows.length) throw new ApiError(404, 'Demande introuvable.');
  const d = await getDemandeForUser(db, id, req.user);
  let analyse = null;
  try {
    analyse = typeof d.analyse_json === 'string' ? JSON.parse(d.analyse_json) : (d.analyse_json || null);
  } catch { analyse = null; }
  const r = rows[0];
  res.json({
    id: d.id, statut: d.statut, score: Math.round(d.score), cv_nom: d.cv_path.split('/').pop(),
    titre_poste: d.titre_poste, created_at: d.created_at, updated_at: d.updated_at,
    analyse,
    candidat: {
      id: r.candidat_id, nom: r.candidat_nom, email: r.email, photo: r.candidat_photo || null,
      telephone: r.telephone, ville: r.ville, titre_poste: r.titre_poste,
      niveau_etudes: r.niveau_etudes, competences: r.competences, bio: r.bio
    },
    redacteur: d.redacteur_id ? { id: d.redacteur_id, nom: r.redacteur_nom, photo: r.redacteur_photo || null } : null,
    can_statut: ['redacteur', 'admin'].includes(req.user.role)
  });
};

// Analyse IA compacte renvoyée dans les listes : garde le payload léger
// tout en exposant le travail du LLM directement sur les vues rédacteur.
const compactAnalyse = (raw) => {
  let a = null;
  try { a = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { a = null; }
  if (!a || !Array.isArray(a.forces) || !Array.isArray(a.recommandations)) return null;
  return {
    score: Math.round(a.score),
    forces: a.forces.filter(Boolean).slice(0, 4),
    faiblesses: (a.faiblesses || []).filter(Boolean).slice(0, 4),
    recommandations: a.recommandations.filter(Boolean).slice(0, 4)
  };
};

export const listRedacteurDemandes = async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.id, d.statut, ROUND(d.score) AS score, d.created_at, d.updated_at, d.titre_poste,
            d.cv_path, d.analyse_json, cu.nom AS candidat_nom, cu.email, c.ville
       FROM demandes d
       JOIN users cu ON cu.id = d.candidat_id
       LEFT JOIN candidats c ON c.user_id = d.candidat_id
      WHERE d.redacteur_id = ?
      ORDER BY d.id DESC`,
    [req.user.id]
  );
  res.json(rows.map(({ analyse_json, cv_path, ...d }) => ({
    ...d,
    cv_nom: cv_path ? cv_path.split('/').pop() : null,
    analyse: compactAnalyse(analyse_json)
  })));
};

const ONE_OF = ['en_attente', 'en_cours', 'terminee', 'annulee', 'refusee'];

// File d'acceptation : demandes en attente visibles par un rédacteur actif, disponible
// (exclut celles qu'il a déjà refusées). Le candidat n'est lié à personne tant qu'un
// rédacteur n'a pas explicitement accepté.
export const listDemandesEnAttente = async (req, res) => {
  const [[red]] = await db.query('SELECT disponible FROM redacteurs WHERE user_id = ?', [req.user.id]);
  if (!red || red.disponible !== 1) return res.json([]);
  const [rows] = await db.query(
    `SELECT d.id, d.titre_poste, ROUND(d.score) AS score, d.created_at, d.cv_path, d.analyse_json,
            cu.nom AS candidat_nom, cu.email, c.ville
       FROM demandes d
       JOIN users cu ON cu.id = d.candidat_id
       LEFT JOIN candidats c ON c.user_id = d.candidat_id
      WHERE d.statut = 'en_attente' AND d.redacteur_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM demande_refus dr WHERE dr.demande_id = d.id AND dr.redacteur_id = ?)
      ORDER BY d.id ASC`,
    [req.user.id]
  );
  res.json(rows.map(({ analyse_json, cv_path, ...d }) => ({
    ...d,
    cv_nom: cv_path ? cv_path.split('/').pop() : null,
    analyse: compactAnalyse(analyse_json)
  })));
};

// Bascule rédacteur indisponible : il ne peut pas accepter tant que son planning est fermé.
const requireDisponible = async (userId) => {
  const [[red]] = await db.query('SELECT disponible FROM redacteurs WHERE user_id = ?', [userId]);
  if (!red || red.disponible !== 1)
    throw new ApiError(400, 'Rendez-vous disponible avant d\u2019accepter de nouvelles demandes.');
  return red;
};

// Un rédacteur accepte la demande : la liaison candidat ↔ rédacteur est créée et le
// candidat est prévenu en temps réel (notification + socket).
export const acceptDemande = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  await requireDisponible(req.user.id);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT * FROM demandes WHERE id = ? FOR UPDATE', [id]);
    const d = rows[0];
    if (!d) throw new ApiError(404, 'Demande introuvable.');
    if (d.statut !== 'en_attente') throw new ApiError(400, 'Cette demande n\u2019est plus en attente.');
    if (d.redacteur_id) throw new ApiError(400, 'Cette demande a déjà été acceptée.');
    await conn.execute("UPDATE demandes SET redacteur_id = ?, statut = 'en_cours' WHERE id = ?", [req.user.id, id]);
    await createNotification({
      conn, userId: d.candidat_id, type: 'statut', titre: 'Dossier accepté',
      message: `Le rédacteur ${req.user.nom} a accepté votre dossier n° ${id}. Vous pouvez échanger directement avec lui.`,
      demandeId: id
    });
    await createNotification({
      conn, userId: req.user.id, type: 'statut', titre: 'Nouveau dossier confié',
      message: `Le dossier n° ${id} (${d.titre_poste || 'CV'}) rejoint vos dossiers confiés : vous êtes désormais lié au candidat.`,
      demandeId: id
    });
    await conn.commit();
    emitToRoom('redacteurs', 'demande_prise', { demandeId: id, redacteurId: req.user.id });
    res.json({ message: 'Demande acceptée.', statut: 'en_cours', redacteur_id: req.user.id });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// Un rédacteur refuse : la demande reste proposée aux autres rédacteurs disponibles.
// Si plus aucun rédacteur disponible ne peut l'accepter, le dossier passe « refusee »
// et le candidat est informé qu'il peut déposer un nouveau CV.
export const refuseDemande = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT * FROM demandes WHERE id = ? FOR UPDATE', [id]);
    const d = rows[0];
    if (!d) throw new ApiError(404, 'Demande introuvable.');
    if (d.statut !== 'en_attente') throw new ApiError(400, 'Cette demande n\u2019est plus en attente.');
    await conn.execute('INSERT IGNORE INTO demande_refus (demande_id, redacteur_id) VALUES (?,?)', [id, req.user.id]);
    const [[r]] = await conn.execute(
      `SELECT COUNT(*) AS restants FROM redacteurs r JOIN users u ON u.id = r.user_id
        WHERE r.disponible = 1 AND u.role = 'redacteur' AND u.statut = 'actif'
          AND NOT EXISTS (SELECT 1 FROM demande_refus dr WHERE dr.demande_id = ? AND dr.redacteur_id = r.user_id)`,
      [id]
    );
    let statut = 'en_attente';
    let message = 'Demande refusée : elle reste visible pour les autres rédacteurs disponibles.';
    if (r.restants === 0) {
      await conn.execute("UPDATE demandes SET statut = 'refusee' WHERE id = ?", [id]);
      statut = 'refusee';
      message = 'Demande refusée : plus aucun rédacteur disponible ne l\u2019a acceptée.';
      await createNotification({
        conn, userId: d.candidat_id, type: 'statut', titre: 'Dossier refusé',
        message: `Aucun rédacteur disponible n\u2019a accepté votre dossier n° ${id}. Vous pouvez déposer un nouveau CV.`,
        demandeId: id
      });
    }
    await conn.commit();
    emitToRoom('redacteurs', 'demande_prise', { demandeId: id, redacteurId: null });
    res.json({ message, statut });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

// Changement de statut partagé entre rédacteur et admin (règles selon le rôle).
export const changeStatut = async (demandeId, statut, user) => {
  if (!ONE_OF.includes(statut)) throw new ApiError(400, 'Statut invalide.');
  const [rows] = await db.query('SELECT * FROM demandes WHERE id = ?', [demandeId]);
  if (!rows.length) throw new ApiError(404, 'Demande introuvable.');
  const d = rows[0];
  if (user.role === 'redacteur') {
    if (d.redacteur_id !== user.id) throw new ApiError(403, 'Accès refusé pour ce rôle.');
    if (d.statut !== 'en_cours' || statut !== 'terminee')
      throw new ApiError(400, 'Transition non autorisée : seul « en cours » → « terminée ».');
  }
  await db.query('UPDATE demandes SET statut = ? WHERE id = ?', [statut, demandeId]);
  await createNotification({
    userId: d.candidat_id, type: 'statut', titre: 'Mise à jour du dossier',
    message: `Le statut de votre demande n° ${demandeId} est passé à : ${statut}.`, demandeId
  });
  if (d.redacteur_id && user.role === 'admin') {
    await createNotification({
      userId: d.redacteur_id, type: 'statut', titre: 'Mise à jour du dossier',
      message: `Le statut de la demande n° ${demandeId} (qui vous est confiée) est passé à : ${statut}.`, demandeId
    });
  }
  emitToRoom('redacteurs', 'demande_statut', { demandeId, statut });
  emitToUser(d.candidat_id, 'demande_statut', { demandeId, statut });
  return { statut };
}

export const setRedacteurStatut = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const { statut } = req.body;
  const r = await changeStatut(id, statut, req.user);
  res.json({ message: 'Statut mis à jour.', ...r });
};

// Accès à un dossier : le candidat, le rédacteur assigné, l'admin — et tout rédacteur
// qui examine une demande « en attente » (workflow d'acceptation) peut consulter
// le CV et en générer une version améliorée pour décider ou préparer la rédaction.
const canView = (d, user) =>
  d.candidat_id === user.id || d.redacteur_id === user.id || user.role === 'admin' ||
  (user.role === 'redacteur' && d.statut === 'en_attente' && !d.redacteur_id);

export const getDemandeCv = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [rows] = await db.query('SELECT * FROM demandes WHERE id = ?', [id]);
  if (!rows.length) throw new ApiError(404, 'Demande introuvable.');
  const d = rows[0];
  if (!canView(d, req.user)) throw new ApiError(403, 'Accès refusé : vous n\u2019êtes pas concerné par cette demande.');
  const { buf } = await readStoredFile(d.cv_path);
  const basename = d.cv_path.split('/').pop();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${basename}"`);
  res.send(buf);
};

// IA rédacteur : relit le PDF d'origine, génère une version structurée et améliorée
// (Ollama si configuré, sinon réorganisation locale), et produit un vrai PDF.
export const ameliorerCv = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [rows] = await db.query('SELECT * FROM demandes WHERE id = ?', [id]);
  if (!rows.length) throw new ApiError(404, 'Demande introuvable.');
  const d = rows[0];
  if (!canView(d, req.user)) throw new ApiError(403, 'Accès refusé : vous n\u2019êtes pas concerné par cette demande.');

  const { buf } = await readStoredFile(d.cv_path);
  const text = await extractCvText(buf);

  let recommandations = [];
  try {
    const a = typeof d.analyse_json === 'string' ? JSON.parse(d.analyse_json) : d.analyse_json;
    if (a && Array.isArray(a.recommandations)) recommandations = a.recommandations.slice(0, 6);
  } catch { /* analyse absente : on génère sans recommandations */ }

  const { text: cvAmeliore, provider } = await improveCV({ text, titrePoste: d.titre_poste, recommandations });
  const pdf = await renderCvPdf(cvAmeliore);
  const saved = await saveBuffer(pdf, 'cvs', buildStorageName('cv_amel', 'pdf'));

  await db.query(
    'UPDATE demandes SET cv_ameliorer = ?, cv_ameliorer_path = ?, cv_ameliorer_at = NOW() WHERE id = ?',
    [cvAmeliore, saved.rel, id]
  );
  await createNotification({
    userId: d.candidat_id, type: 'statut', titre: 'CV amélioré prêt',
    message: `Le rédacteur a généré une version améliorée de votre CV (dossier n° ${id}).`,
    demandeId: id
  });
  emitToRoom('redacteurs', 'demande_statut', { demandeId: id, statut: d.statut });
  emitToUser(d.candidat_id, 'demande_statut', { demandeId: id, statut: d.statut });
  res.json({
    message: 'CV amélioré généré à partir du PDF d\u2019origine.',
    cv_ameliorer_nom: saved.rel.split('/').pop(),
    cv_ameliorer: cvAmeliore,
    provider
  });
};

export const getCvAmeliorer = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new ApiError(400, 'Identifiant invalide.');
  const [rows] = await db.query('SELECT * FROM demandes WHERE id = ?', [id]);
  if (!rows.length) throw new ApiError(404, 'Demande introuvable.');
  const d = rows[0];
  if (!canView(d, req.user)) throw new ApiError(403, 'Accès refusé : vous n\u2019êtes pas concerné par cette demande.');
  if (!d.cv_ameliorer_path) throw new ApiError(404, 'Aucun CV amélioré généré pour cette demande.');
  const { buf } = await readStoredFile(d.cv_ameliorer_path);
  const basename = d.cv_ameliorer_path.split('/').pop();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${basename}"`);
  res.send(buf);
};
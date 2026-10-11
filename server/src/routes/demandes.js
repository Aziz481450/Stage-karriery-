import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { uploadCv, uploadFichier } from '../middlewares/upload.js';
import * as demanda from '../controllers/demandes.js';
import * as mensaje from '../controllers/messages.js';
import { getFichier, getFichierByMessage } from '../controllers/fichiers.js';

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const file = (mw, field) => (req, res, next) =>
  mw.single(field)(req, res, (err) => (err ? next(err) : next()));

router.post('/demandes', requireAuth, requireRole('candidat'), file(uploadCv, 'cv'), wrap(demanda.createDemande));
router.get('/candidat/demandes', requireAuth, requireRole('candidat'), wrap(demanda.listCandidatDemandes));
router.get('/candidat/demandes/:id', requireAuth, requireRole('candidat'), wrap(demanda.getCandidatDemande));
router.get('/redacteur/demandes', requireAuth, requireRole('redacteur'), wrap(demanda.listRedacteurDemandes));
router.get('/redacteur/demandes/en-attente', requireAuth, requireRole('redacteur'), wrap(demanda.listDemandesEnAttente));
router.put('/redacteur/demandes/:id/accepte', requireAuth, requireRole('redacteur'), wrap(demanda.acceptDemande));
router.put('/redacteur/demandes/:id/refuse', requireAuth, requireRole('redacteur'), wrap(demanda.refuseDemande));
router.get('/redacteur/demandes/:id', requireAuth, requireRole('redacteur'), wrap(demanda.getCandidatDemande));
router.put('/redacteur/demandes/:id/statut', requireAuth, requireRole('redacteur'), wrap(demanda.setRedacteurStatut));

// Contrat Sprint 2 (routes génériques : /api/demandes, /api/demandes/:id, PATCH statut)
router.get('/demandes', requireAuth, requireRole('candidat', 'redacteur'), wrap(demanda.listGeneric));
router.get('/demandes/:id', requireAuth, wrap(demanda.getCandidatDemande));
router.patch('/demandes/:id/statut', requireAuth, requireRole('redacteur', 'admin'), wrap(demanda.setRedacteurStatut));

// Entrée globale protégée pour le CV ou un fichier de la messagerie (participants + admin).
router.get('/demandes/:id/cv', requireAuth, wrap(demanda.getDemandeCv));
router.post('/demandes/:id/ameliorer-cv', requireAuth, requireRole('redacteur', 'admin'), wrap(demanda.ameliorerCv));
router.get('/demandes/:id/cv-ameliorer', requireAuth, wrap(demanda.getCvAmeliorer));
router.get('/demandes/:id/messages', requireAuth, wrap(mensaje.listMessages));
router.post('/demandes/:id/messages', requireAuth, file(uploadFichier, 'fichier'), wrap(mensaje.createMessageRest));
router.get('/conversations', requireAuth, wrap(demanda.listConversations));
router.get('/fichiers/:id', requireAuth, wrap(getFichier));
router.get('/messages/:id/fichier', requireAuth, wrap(getFichierByMessage));

export default router;
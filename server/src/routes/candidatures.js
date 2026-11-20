import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as candidatures from '../controllers/candidatures.js';

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const manage = [requireAuth, requireRole('redacteur', 'admin')];

router.post('/offres/:id/candidatures', requireAuth, requireRole('candidat'), wrap(candidatures.create));
router.get('/offres/:id/candidatures', ...manage, wrap(candidatures.listForOffer));

router.get('/candidatures', requireAuth, wrap(candidatures.list));
router.put('/candidatures/:id/statut', ...manage, wrap(candidatures.setStatut));
router.get('/candidatures/:id/cv', requireAuth, wrap(candidatures.getCv));

export default router;

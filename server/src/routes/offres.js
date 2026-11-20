import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as offres from '../controllers/offres.js';

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const manage = [requireAuth, requireRole('redacteur', 'admin')];

// Consultation (candidat : offres ouvertes ; admin : toutes).
router.get('/offres', requireAuth, wrap(offres.list));

// Gestion : la liste « mes offres » doit être déclarée avant /offres/:id.
router.get('/offres/gestion/mine', ...manage, wrap(offres.listMine));

router.get('/offres/:id', requireAuth, wrap(offres.get));

router.post('/offres', ...manage, wrap(offres.create));
router.put('/offres/:id', ...manage, wrap(offres.update));
router.delete('/offres/:id', ...manage, wrap(offres.remove));

export default router;

import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as admin from '../controllers/admin.js';

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const adminOnly = [requireAuth, requireRole('admin')];

router.get('/admin/dashboard', ...adminOnly, wrap(admin.dashboard));
router.get('/admin/stats', ...adminOnly, wrap(admin.dashboard));
router.get('/admin/users', ...adminOnly, wrap(admin.listUsers));
router.put('/admin/users/:id/cancel', ...adminOnly, wrap(admin.cancelUser));
router.put('/admin/users/:id/activate', ...adminOnly, wrap(admin.activateUser));
router.patch('/admin/users/:id/statut', ...adminOnly, wrap(admin.setUserStatut));
router.get('/admin/demandes', ...adminOnly, wrap(admin.listDemandes));
router.put('/admin/demandes/:id/status', ...adminOnly, wrap(admin.setDemandeStatut));
router.patch('/admin/demandes/:id/status', ...adminOnly, wrap(admin.setDemandeStatut));

// Compatibilité (API existante conservée)
router.get('/admin/utilisateurs', ...adminOnly, wrap(admin.listUsers));
router.put('/admin/utilisateurs/:id/statut', ...adminOnly, wrap(admin.setUserStatut));
router.get('/admin/newsletter', ...adminOnly, wrap(admin.listNewsletter));

export default router;
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as notif from '../controllers/notifications.js';

const router = Router();
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get('/notifications', requireAuth, wrap(notif.listMine));
router.get('/notifications/unread-count', requireAuth, wrap(notif.unread));
router.put('/notifications/:id/read', requireAuth, wrap(notif.markRead));
router.put('/notifications/read-all', requireAuth, wrap(notif.markAllRead));
router.put('/notifications/demande/:id/lues', requireAuth, wrap(notif.markDemandeRead));
router.post('/notifications/lues', requireAuth, wrap(notif.markAllRead));

export default router;
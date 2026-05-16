import { Router } from 'express';
import { getFocusSessions, startFocusSession, completeFocusSession } from '../controllers/focus';

const router = Router();

router.get('/', getFocusSessions);
router.post('/start', startFocusSession);
router.post('/:id/complete', completeFocusSession);

export default router;

import { Router } from 'express';
import { getTodayHealth, upsertTodayHealth, getWeekHealth } from '../controllers/health';

const router = Router();

router.get('/today', getTodayHealth);
router.post('/today', upsertTodayHealth);
router.get('/week', getWeekHealth);

export default router;

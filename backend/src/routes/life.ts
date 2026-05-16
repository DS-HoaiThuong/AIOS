import { Router } from 'express';
import { getHabits, createHabit, checkinHabit } from '../controllers/life';

const router = Router();

router.get('/habits', getHabits);
router.post('/habits', createHabit);
router.post('/habits/:id/checkin', checkinHabit);

export default router;

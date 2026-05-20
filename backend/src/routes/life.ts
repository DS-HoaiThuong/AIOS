import { Router } from 'express';
import { getHabits, createHabit, checkinHabit, deleteHabit } from '../controllers/life';

const router = Router();

router.get('/habits', getHabits);
router.post('/habits', createHabit);
router.post('/habits/:id/checkin', checkinHabit);
router.delete('/habits/:id', deleteHabit);

export default router;


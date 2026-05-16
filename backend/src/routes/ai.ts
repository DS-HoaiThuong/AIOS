import { Router } from 'express';
import { summarizeJournal, autoScheduleTasks } from '../controllers/ai';

const router = Router();

router.post('/journal/summarize', summarizeJournal);
router.post('/tasks/auto-schedule', autoScheduleTasks);

export default router;

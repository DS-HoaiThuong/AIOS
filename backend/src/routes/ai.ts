import { Router } from 'express';
import { summarizeJournal, autoScheduleTasks, generateProjectTasks } from '../controllers/ai';

const router = Router();

router.post('/journal/summarize', summarizeJournal);
router.post('/tasks/auto-schedule', autoScheduleTasks);
router.post('/projects/generate', generateProjectTasks);

export default router;

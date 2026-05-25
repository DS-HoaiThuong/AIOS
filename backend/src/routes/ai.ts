import { Router } from 'express';
import { summarizeJournal, autoScheduleTasks, generateProjectTasks, processVoiceCommand } from '../controllers/ai';

const router = Router();

router.post('/journal/summarize', summarizeJournal);
router.post('/tasks/auto-schedule', autoScheduleTasks);
router.post('/projects/generate', generateProjectTasks);
router.post('/command', processVoiceCommand);

export default router;

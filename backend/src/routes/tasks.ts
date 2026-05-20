import { Router } from 'express';
import { getTasks, getTaskById, createTask, updateTask, deleteTask, deleteTasksByProject } from '../controllers/tasks';

const router = Router();

router.get('/', getTasks);
router.post('/', createTask);
router.delete('/project/:projectName', deleteTasksByProject);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;

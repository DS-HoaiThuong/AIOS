import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard';

const router = Router();

router.get('/summary', getDashboardSummary);

export default router;

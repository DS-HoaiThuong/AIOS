import { Router } from 'express';
import { getWorkLifeAnalytics } from '../controllers/analytics';

const router = Router();

router.get('/worklife', getWorkLifeAnalytics);

export default router;

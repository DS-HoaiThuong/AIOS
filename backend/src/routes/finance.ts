import { Router } from 'express';
import { 
  getTransactions, createTransaction, deleteTransaction,
  getGoals, createGoal, updateGoal, getSubscriptions, createSubscription
} from '../controllers/finance';

const router = Router();

router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.delete('/transactions/:id', deleteTransaction);

router.get('/goals', getGoals);
router.post('/goals', createGoal);
router.put('/goals/:id', updateGoal);

router.get('/subscriptions', getSubscriptions);
router.post('/subscriptions', createSubscription);

export default router;


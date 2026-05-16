import { Router } from 'express';
import { getTransactions, createTransaction, deleteTransaction } from '../controllers/finance';

const router = Router();

router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.delete('/transactions/:id', deleteTransaction);

export default router;

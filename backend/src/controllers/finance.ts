import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  const { title, amount, type, category, date, notes } = req.body;
  try {
    const transaction = await prisma.transaction.create({
      data: {
        title,
        amount: parseFloat(amount),
        type,
        category,
        date: new Date(date),
        notes
      }
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};

// Goals
export const getGoals = async (req: Request, res: Response) => {
  try {
    const goals = await prisma.financialGoal.findMany();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const createGoal = async (req: Request, res: Response) => {
  const { title, targetAmount, currentAmount, color } = req.body;
  try {
    const goal = await prisma.financialGoal.create({
      data: {
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        color: color || '#000000'
      }
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const updateGoal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentAmount } = req.body;
  try {
    const goal = await prisma.financialGoal.update({
      where: { id },
      data: {
        currentAmount: parseFloat(currentAmount),
      }
    });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

// Subscriptions
export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const subs = await prisma.subscription.findMany();
    res.json(subs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  const { title, amount, billingCycle, icon } = req.body;
  try {
    const sub = await prisma.subscription.create({
      data: {
        title,
        amount: parseFloat(amount),
        billingCycle,
        icon: icon || 'terminal'
      }
    });
    res.status(201).json(sub);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};


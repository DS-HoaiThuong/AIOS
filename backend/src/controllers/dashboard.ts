import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // 1. Tasks
    const pendingTasksCount = await prisma.task.count({
      where: { status: { in: ['todo', 'in-progress'] } }
    });

    // 2. Finance
    const transactions = await prisma.transaction.findMany();
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    // 3. Habits
    const habits = await prisma.habit.findMany();
    const today = new Date().toISOString().split('T')[0];
    let completedHabitsToday = 0;
    habits.forEach(h => {
      const dates = JSON.parse(h.completedDates);
      if (dates.includes(today)) completedHabitsToday++;
    });

    // 4. Focus Time
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        completedAt: { not: null }
      }
    });
    const totalFocusMinutes = Math.floor(focusSessions.reduce((acc, s) => acc + s.duration, 0) / 60);

    res.json({
      tasks: { pending: pendingTasksCount },
      finance: { balance, income, expense },
      habits: { total: habits.length, completedToday: completedHabitsToday },
      focus: { totalMinutes: totalFocusMinutes }
    });
  } catch (error) {
    console.error('Failed to get dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

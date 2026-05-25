import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in .env');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeout: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
};

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const pendingTaskWhere = { status: { in: ['todo', 'in-progress'] } };
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      pendingTasksCount,
      completedTasksCount,
      pendingTasks,
      transactionTotals,
      habits,
      totalFocus,
      todayFocus
    ] = await Promise.all([
      prisma.task.count({ where: pendingTaskWhere }),
      prisma.task.count({ where: { status: 'done' } }),
      prisma.task.findMany({
        where: pendingTaskWhere,
        select: {
          id: true,
          title: true,
          project: true,
          priority: true,
          dueDate: true,
          status: true
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
        take: 50
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        _sum: { amount: true }
      }),
      prisma.habit.findMany({ select: { completedDates: true } }),
      prisma.focusSession.aggregate({
        where: { completedAt: { not: null } },
        _sum: { duration: true }
      }),
      prisma.focusSession.aggregate({
        where: {
          completedAt: { not: null },
          startedAt: { gte: todayStart }
        },
        _sum: { duration: true }
      })
    ]);

    const priorityWeight: any = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const sortedPriorities = pendingTasks
      .sort((a, b) => {
        const hasDateA = a.dueDate ? 1 : 0;
        const hasDateB = b.dueDate ? 1 : 0;
        
        if (hasDateA && hasDateB) {
          const timeA = new Date(a.dueDate!).getTime();
          const timeB = new Date(b.dueDate!).getTime();
          if (timeA !== timeB) return timeA - timeB;
        } else if (hasDateA && !hasDateB) {
          return -1;
        } else if (!hasDateA && hasDateB) {
          return 1;
        }
        
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      })
      .slice(0, 3);

    const income = transactionTotals.find(t => t.type === 'income')?._sum.amount || 0;
    const expense = transactionTotals.find(t => t.type === 'expense')?._sum.amount || 0;
    const balance = income - expense;

    const today = new Date().toISOString().split('T')[0];
    let completedHabitsToday = 0;
    habits.forEach(h => {
      const dates = JSON.parse(h.completedDates || "[]");
      if (dates.includes(today)) completedHabitsToday++;
    });

    const totalFocusMinutesToday = Math.floor((todayFocus._sum.duration || 0) / 60);
    const totalFocusMinutes = Math.floor((totalFocus._sum.duration || 0) / 60);

    let aiBrief = "You are doing great! Keep up the momentum.";
    try {
      const model = getGemini();
      const prompt = `Act as an AI Personal Assistant. The user has ${pendingTasksCount} pending tasks, completed ${completedTasksCount} tasks, achieved ${completedHabitsToday}/${habits.length} habits today, and focused for ${totalFocusMinutesToday} minutes. Provide a very short, encouraging 2-sentence insight to help them optimize their day. Be specific and motivating.`;
      const result = await withTimeout(model.generateContent(prompt), 5000);
      aiBrief = result.response.text() || aiBrief;
    } catch (aiError: any) {
      console.error('Failed to generate AI brief, falling back to default.', aiError?.message);
    }

    res.json({
      tasks: { pending: pendingTasksCount, completed: completedTasksCount, topPriorities: sortedPriorities },
      finance: { balance, income, expense },
      habits: { total: habits.length, completedToday: completedHabitsToday },
      focus: { totalMinutes: totalFocusMinutes, todayMinutes: totalFocusMinutesToday },
      aiBrief
    });
  } catch (error) {
    console.error('Failed to get dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

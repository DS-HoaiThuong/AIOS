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

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // 1. Tasks
    const pendingTasksCount = await prisma.task.count({
      where: { status: { in: ['todo', 'in-progress'] } }
    });
    
    const completedTasksCount = await prisma.task.count({
      where: { status: 'done' }
    });

    const allPendingTasks = await prisma.task.findMany({
      where: { status: { in: ['todo', 'in-progress'] } }
    });
    
    const priorityWeight: any = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const sortedPriorities = allPendingTasks
      .sort((a, b) => {
        // 1. Sort by dueDate (earliest first, nulls at the bottom)
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
        
        // 2. Sort by priority
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      })
      .slice(0, 3);

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
      const dates = JSON.parse(h.completedDates || "[]");
      if (dates.includes(today)) completedHabitsToday++;
    });

    // 4. Focus Time
    const focusSessions = await prisma.focusSession.findMany({
      where: { completedAt: { not: null } }
    });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFocus = focusSessions.filter(s => s.startedAt >= todayStart);
    const totalFocusMinutesToday = Math.floor(todayFocus.reduce((acc, s) => acc + s.duration, 0) / 60);
    const totalFocusMinutes = Math.floor(focusSessions.reduce((acc, s) => acc + s.duration, 0) / 60);

    // 5. Generate AI Brief via Gemini
    let aiBrief = "You are doing great! Keep up the momentum.";
    try {
      const model = getGemini();
      const prompt = `Act as an AI Personal Assistant. The user has ${pendingTasksCount} pending tasks, completed ${completedTasksCount} tasks, achieved ${completedHabitsToday}/${habits.length} habits today, and focused for ${totalFocusMinutesToday} minutes. Provide a very short, encouraging 2-sentence insight to help them optimize their day. Be specific and motivating.`;
      const result = await model.generateContent(prompt);
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

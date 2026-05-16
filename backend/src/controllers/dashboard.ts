import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // 1. Tasks
    const pendingTasksCount = await prisma.task.count({
      where: { status: { in: ['todo', 'in-progress'] } }
    });
    
    const completedTasksCount = await prisma.task.count({
      where: { status: 'done' }
    });

    const topPriorities = await prisma.task.findMany({
      where: { status: { in: ['todo', 'in-progress'] } },
      orderBy: [
        { priority: 'asc' }, // Assuming 'urgent' comes first alphabetically or we might need custom logic. Actually urgent starts with u, high with h. Let's just sort by priority, or take top 3.
        { createdAt: 'desc' }
      ],
      take: 3
    });

    // Sort priorities manually since string sort isn't perfect for urgency
    const priorityWeight: any = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const allPendingTasks = await prisma.task.findMany({
      where: { status: { in: ['todo', 'in-progress'] } }
    });
    
    const sortedPriorities = allPendingTasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]).slice(0, 3);

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
      where: {
        completedAt: { not: null }
      }
    });
    
    // Focus today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayFocus = focusSessions.filter(s => s.startedAt >= todayStart);
    const totalFocusMinutesToday = Math.floor(todayFocus.reduce((acc, s) => acc + s.duration, 0) / 60);
    const totalFocusMinutes = Math.floor(focusSessions.reduce((acc, s) => acc + s.duration, 0) / 60);

    // 5. Generate AI Brief
    let aiBrief = "You are doing great! Keep up the momentum.";
    try {
      const prompt = `Act as an AI Personal Assistant. The user has ${pendingTasksCount} pending tasks, completed ${completedTasksCount} tasks today, achieved ${completedHabitsToday}/${habits.length} habits, and focused for ${totalFocusMinutesToday} minutes today. Provide a very short, encouraging 2-sentence insight or recommendation to help them optimize their day.`;
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: 'gpt-3.5-turbo',
        max_tokens: 60,
      }, { timeout: 5000 });
      aiBrief = completion.choices[0]?.message?.content || aiBrief;
    } catch (aiError) {
      console.error('Failed to generate AI brief, falling back to default.', aiError);
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

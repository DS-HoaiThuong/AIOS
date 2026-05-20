import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET /api/analytics/worklife?period=week|month
export const getWorkLifeAnalytics = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    const days = period === 'month' ? 30 : 7;

    // Generate date range (last N days, newest last)
    const dateRange: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateRange.push(d.toISOString().split('T')[0]);
    }

    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - (days - 1));
    rangeStart.setHours(0, 0, 0, 0);

    // 1. Focus sessions per day
    const focusSessions = await prisma.focusSession.findMany({
      where: { startedAt: { gte: rangeStart }, completedAt: { not: null } }
    });

    const focusByDay: Record<string, number> = {};
    dateRange.forEach(d => { focusByDay[d] = 0; });
    focusSessions.forEach(s => {
      const day = s.startedAt.toISOString().split('T')[0];
      if (focusByDay[day] !== undefined) {
        focusByDay[day] += Math.round(s.duration / 60); // minutes
      }
    });

    // 2. Tasks completed per day
    const completedTasks = await prisma.task.findMany({
      where: { status: 'done', updatedAt: { gte: rangeStart } }
    });
    const tasksByDay: Record<string, number> = {};
    dateRange.forEach(d => { tasksByDay[d] = 0; });
    completedTasks.forEach(t => {
      const day = t.updatedAt.toISOString().split('T')[0];
      if (tasksByDay[day] !== undefined) tasksByDay[day]++;
    });

    // 3. Habit completion rate per day
    const habits = await prisma.habit.findMany();
    const habitsByDay: Record<string, { completed: number; total: number }> = {};
    dateRange.forEach(d => { habitsByDay[d] = { completed: 0, total: habits.length }; });
    habits.forEach(h => {
      const dates: string[] = JSON.parse(h.completedDates || '[]');
      dates.forEach(d => {
        if (habitsByDay[d]) habitsByDay[d].completed++;
      });
    });

    // 4. Health logs
    const healthLogs = await prisma.healthLog.findMany({
      where: { date: { in: dateRange } }
    });
    const healthByDay: Record<string, any> = {};
    dateRange.forEach(d => {
      healthByDay[d] = { sleepHours: null, waterGlasses: 0, exercised: false, energyLevel: null };
    });
    healthLogs.forEach(h => {
      healthByDay[h.date] = {
        sleepHours: h.sleepHours,
        waterGlasses: h.waterGlasses,
        exercised: h.exercised,
        energyLevel: h.energyLevel
      };
    });

    // 5. Finance summary (current period)
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: rangeStart } }
    });
    const income = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

    // 6. Task distribution by project (work vs life)
    const allTasks = await prisma.task.findMany();
    const projectCounts: Record<string, number> = {};
    allTasks.forEach(t => {
      projectCounts[t.project] = (projectCounts[t.project] || 0) + 1;
    });

    // 7. Compute Work-Life Balance Score (0-100)
    // Weights: focus (25) + habits (25) + health (25) + task completion (25)
    const today = new Date().toISOString().split('T')[0];
    const avgFocusMinutes = Object.values(focusByDay).reduce((a, b) => a + b, 0) / days;
    const focusScore = Math.min(25, (avgFocusMinutes / 120) * 25); // target: 2h/day = full score

    const todayHabit = habitsByDay[today] || { completed: 0, total: 1 };
    const habitScore = todayHabit.total > 0 ? (todayHabit.completed / todayHabit.total) * 25 : 12.5;

    const todayHealth = healthByDay[today] || {};
    let healthScore = 0;
    if (todayHealth.sleepHours) healthScore += Math.min(10, (todayHealth.sleepHours / 8) * 10);
    if (todayHealth.exercised) healthScore += 8;
    if ((todayHealth.waterGlasses || 0) >= 8) healthScore += 7;
    else healthScore += ((todayHealth.waterGlasses || 0) / 8) * 7;

    const avgTasksPerDay = Object.values(tasksByDay).reduce((a, b) => a + b, 0) / days;
    const taskScore = Math.min(25, avgTasksPerDay * 5); // target: 5 tasks/day

    const workLifeScore = Math.round(focusScore + habitScore + healthScore + taskScore);

    // 8. Build daily series for charts
    const dailySeries = dateRange.map(date => ({
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }),
      focusMinutes: focusByDay[date] || 0,
      tasksCompleted: tasksByDay[date] || 0,
      habitRate: habitsByDay[date]?.total > 0
        ? Math.round((habitsByDay[date].completed / habitsByDay[date].total) * 100)
        : 0,
      health: healthByDay[date] || null
    }));

    res.json({
      period,
      days,
      workLifeScore,
      scoreBreakdown: {
        focus: Math.round(focusScore),
        habits: Math.round(habitScore),
        health: Math.round(healthScore),
        tasks: Math.round(taskScore)
      },
      dailySeries,
      projectCounts,
      finance: { income, expense, balance: income - expense },
      totals: {
        focusHours: Math.round(Object.values(focusByDay).reduce((a, b) => a + b, 0) / 60 * 10) / 10,
        tasksCompleted: Object.values(tasksByDay).reduce((a, b) => a + b, 0),
        habitCheckins: Object.values(habitsByDay).reduce((a, b) => a + b.completed, 0),
        totalHabits: habits.length
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

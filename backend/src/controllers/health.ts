import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const getLocalDateKey = (date = new Date()) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().split('T')[0];
};

// GET /api/health/today
export const getTodayHealth = async (req: Request, res: Response) => {
  try {
    const today = getLocalDateKey();
    const log = await prisma.healthLog.findUnique({ where: { date: today } });
    res.json(log || { date: today, sleepHours: null, waterGlasses: 0, exercised: false, energyLevel: null, notes: null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch health log' });
  }
};

// POST /api/health/today  (upsert)
export const upsertTodayHealth = async (req: Request, res: Response) => {
  try {
    const today = getLocalDateKey();
    const { sleepHours, waterGlasses, exercised, energyLevel, notes } = req.body;

    const log = await prisma.healthLog.upsert({
      where: { date: today },
      update: {
        ...(sleepHours !== undefined && { sleepHours: parseFloat(sleepHours) || null }),
        ...(waterGlasses !== undefined && { waterGlasses: parseInt(waterGlasses) || 0 }),
        ...(exercised !== undefined && { exercised: Boolean(exercised) }),
        ...(energyLevel !== undefined && { energyLevel: parseInt(energyLevel) || null }),
        ...(notes !== undefined && { notes }),
      },
      create: {
        date: today,
        sleepHours: sleepHours ? parseFloat(sleepHours) : null,
        waterGlasses: waterGlasses ? parseInt(waterGlasses) : 0,
        exercised: exercised || false,
        energyLevel: energyLevel ? parseInt(energyLevel) : null,
        notes: notes || null
      }
    });
    res.json(log);
  } catch (error) {
    console.error('Health upsert error:', error);
    res.status(500).json({ error: 'Failed to update health log' });
  }
};

// GET /api/health/week  (last 7 days)
export const getWeekHealth = async (req: Request, res: Response) => {
  try {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(getLocalDateKey(d));
    }
    const logs = await prisma.healthLog.findMany({ where: { date: { in: dates } } });
    const byDate: Record<string, any> = {};
    logs.forEach(l => { byDate[l.date] = l; });
    const result = dates.map(d => byDate[d] || { date: d, sleepHours: null, waterGlasses: 0, exercised: false, energyLevel: null });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch week health' });
  }
};

import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getHabits = async (req: Request, res: Response) => {
  try {
    const habits = await prisma.habit.findMany();
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
};

export const createHabit = async (req: Request, res: Response) => {
  const { title, icon } = req.body;
  try {
    const habit = await prisma.habit.create({
      data: {
        title,
        icon: icon || '✨',
        completedDates: '[]'
      }
    });
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
};

export const checkinHabit = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { date } = req.body; // YYYY-MM-DD
  try {
    const habit = await prisma.habit.findUnique({ where: { id } });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    
    let dates: string[] = JSON.parse(habit.completedDates);
    if (dates.includes(date)) {
      dates = dates.filter(d => d !== date);
    } else {
      dates.push(date);
    }
    
    const updated = await prisma.habit.update({
      where: { id },
      data: { completedDates: JSON.stringify(dates) }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check-in habit' });
  }
};

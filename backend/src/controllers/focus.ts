import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getFocusSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.focusSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch focus sessions' });
  }
};

export const startFocusSession = async (req: Request, res: Response) => {
  const { mode, duration, taskId } = req.body;
  try {
    const session = await prisma.focusSession.create({
      data: {
        mode: mode || 'pomodoro',
        duration: parseInt(duration) || 1500, // default 25 mins
        taskId: taskId || null,
      }
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start focus session' });
  }
};

export const completeFocusSession = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const session = await prisma.focusSession.update({
      where: { id },
      data: {
        completedAt: new Date(),
      }
    });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete focus session' });
  }
};

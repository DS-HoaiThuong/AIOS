import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { mode, duration, taskId } = await req.json();
    const session = await prisma.focusSession.create({
      data: {
        mode: mode || 'pomodoro',
        duration: parseInt(duration) || 1500, // default 25 mins
        taskId: taskId || null,
      }
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start focus session' }, { status: 500 });
  }
}

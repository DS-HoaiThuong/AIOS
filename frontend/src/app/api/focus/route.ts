import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const sessions = await prisma.focusSession.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10
    });
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch focus sessions' }, { status: 500 });
  }
}

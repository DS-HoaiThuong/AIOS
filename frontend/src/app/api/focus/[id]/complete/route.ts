import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await prisma.focusSession.update({
      where: { id },
      data: { completedAt: new Date() }
    });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to complete focus session' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { currentAmount } = await req.json();
    const goal = await prisma.financialGoal.update({
      where: { id },
      data: { currentAmount: parseFloat(currentAmount) }
    });
    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

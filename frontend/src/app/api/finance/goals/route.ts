import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const goals = await prisma.financialGoal.findMany();
    return NextResponse.json(goals);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, targetAmount, currentAmount, color } = await req.json();
    const goal = await prisma.financialGoal.create({
      data: {
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        color: color || '#000000'
      }
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

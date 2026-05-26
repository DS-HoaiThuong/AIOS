import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { date } = await req.json(); // YYYY-MM-DD
    const habit = await prisma.habit.findUnique({ where: { id } });
    if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    
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
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check-in habit' }, { status: 500 });
  }
}

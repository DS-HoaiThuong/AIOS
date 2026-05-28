import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { amount, date } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }

    const jar = await prisma.spendingJar.findUnique({ where: { id } });
    if (!jar) {
      return NextResponse.json({ error: 'Spending jar not found' }, { status: 404 });
    }

    const today = date || new Date().toISOString().split('T')[0];
    const spending: Record<string, number> = JSON.parse(jar.dailySpending || '{}');
    spending[today] = (spending[today] || 0) + parseFloat(String(amount));

    const updated = await prisma.spendingJar.update({
      where: { id },
      data: { dailySpending: JSON.stringify(spending) },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error recording spend:', error);
    return NextResponse.json({ error: 'Failed to record spending', details: error?.message }, { status: 500 });
  }
}

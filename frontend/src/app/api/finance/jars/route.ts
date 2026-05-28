import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const jars = await prisma.spendingJar.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(jars);
  } catch (error: any) {
    console.error('Error fetching jars:', error);
    return NextResponse.json({ error: 'Failed to fetch spending jars', details: error?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, icon, monthlyBudget, startDate, daysInPeriod, color } = await req.json();
    if (!title || !monthlyBudget) {
      return NextResponse.json({ error: 'title and monthlyBudget are required' }, { status: 400 });
    }

    const now = new Date();
    const defaultStartDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const jar = await prisma.spendingJar.create({
      data: {
        title,
        icon: icon || '🏦',
        monthlyBudget: parseFloat(String(monthlyBudget)),
        startDate: startDate || defaultStartDate,
        daysInPeriod: daysInPeriod || 30,
        color: color || '#10b981',
        dailySpending: '{}',
      }
    });
    return NextResponse.json(jar, { status: 201 });
  } catch (error: any) {
    console.error('Error creating jar:', error);
    return NextResponse.json({ error: 'Failed to create spending jar', details: error?.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const getLocalDateKey = (date = new Date()) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().split('T')[0];
};

export async function GET() {
  try {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(getLocalDateKey(d));
    }
    const logs = await prisma.healthLog.findMany({ where: { date: { in: dates } } });
    const byDate: Record<string, any> = {};
    logs.forEach(l => { byDate[l.date] = l; });
    const result = dates.map(d => byDate[d] || { date: d, sleepHours: null, waterGlasses: 0, exercised: false, energyLevel: null });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch week health' }, { status: 500 });
  }
}

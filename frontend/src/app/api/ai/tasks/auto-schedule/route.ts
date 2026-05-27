import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

export async function POST() {
  try {
    const tasks = await prisma.task.findMany({
      where: { status: 'todo' },
      select: { id: true, title: true, priority: true }
    });

    if (tasks.length === 0) {
      return NextResponse.json({ message: 'No tasks to schedule.', suggestions: [] });
    }

    const prompt = `Given the following list of tasks, suggest an optimal order to tackle them today based on their priority.
Return ONLY a valid JSON object in this format: { "suggestions": [ { "id": "...", "reason": "5-word reason" } ] }
Tasks: ${JSON.stringify(tasks)}`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let suggestions = [];
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      suggestions = parsed.suggestions || parsed || [];
    } catch (e) {
      suggestions = [];
    }

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Gemini Error (autoScheduleTasks):', error?.message || error);
    return NextResponse.json({ error: 'Failed to auto-schedule tasks' }, { status: 500 });
  }
}

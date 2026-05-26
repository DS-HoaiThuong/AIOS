import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const model = getGemini();
    const prompt = `You are an empathetic AI. Summarize the following journal entry in 1-2 short sentences, extracting the core emotion and main event:\n\n${content}`;
    const result = await model.generateContent(prompt);
    const summary = result.response.text() || 'Unable to generate summary.';
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Gemini Error (summarizeJournal):', error?.message || error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}

import { Request, Response } from 'express';
import OpenAI from 'openai';
import prisma from '../lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const summarizeJournal = async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an empathetic and insightful AI assistant. Summarize the following journal entry in 1-2 short sentences, extracting the core emotion and main event.' },
        { role: 'user', content }
      ],
      model: 'gpt-3.5-turbo',
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.';
    res.json({ summary });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

export const autoScheduleTasks = async (req: Request, res: Response) => {
  try {
    // 1. Fetch current 'todo' tasks
    const tasks = await prisma.task.findMany({
      where: { status: 'todo' },
      select: { id: true, title: true, priority: true }
    });

    if (tasks.length === 0) {
      return res.json({ message: 'No tasks to schedule.', suggestions: [] });
    }

    // 2. Ask OpenAI for suggestions
    const prompt = `Given the following list of tasks, suggest an optimal order to tackle them today based on their priority. Return ONLY a JSON array of objects with 'id' and 'reason' (a short 5-word reason why it should be done first).\n\Tasks: ${JSON.stringify(tasks)}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' } // requires specific prompt instructions usually, but we'll try to parse
    });

    // We will just return the raw text for simplicity if JSON parsing fails, or try to parse it
    let result;
    try {
      const content = completion.choices[0]?.message?.content || '{}';
      result = JSON.parse(content);
      // Sometimes gpt-3.5-turbo wraps it in an object like { "suggestions": [...] }
      if (!Array.isArray(result)) {
         result = result.suggestions || Object.values(result)[0] || [];
      }
    } catch(e) {
       result = [];
    }

    res.json({ suggestions: result });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to auto-schedule tasks' });
  }
};

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    // We only have the Gemini key, so we'll route compatible requests to Gemini API
    if (model.includes('gemini')) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
        })
      });

      if (res.status === 429 || res.status === 503) {
         return NextResponse.json({ error: "Overloaded" }, { status: 503 });
      }

      if (!res.ok) {
         const errorText = await res.text();
         return NextResponse.json({ error: errorText }, { status: res.status });
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        return NextResponse.json({ error: "Invalid response from AI" }, { status: 500 });
      }

      try {
        const cleaned = text.replace(/```json|```/g, '').trim();
        return NextResponse.json(JSON.parse(cleaned));
      } catch (e) {
        return NextResponse.json({ error: "Failed to parse JSON" }, { status: 500 });
      }
    }

    // For Claude or others, simulate 503 so the frontend retry logic falls back to Gemini
    if (model.includes('claude')) {
      return NextResponse.json({ error: "Claude model not available, falling back" }, { status: 503 }); 
    }

    return NextResponse.json({ error: "Unsupported model" }, { status: 400 });
  } catch (error: any) {
    console.error("Generate tasks API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

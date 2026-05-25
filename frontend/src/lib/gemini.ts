export async function generateProjectTasksAI(projectName: string, projectGoal: string) {
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY in frontend environment variables.");
  }

  const prompt = `
Bạn là AI Project Planner. Hãy phân rã mục tiêu dự án thành 5-8 task cụ thể.
Trả về JSON hợp lệ, không markdown:
[
  {
    "title": "Tên task",
    "description": "Mô tả ngắn",
    "priority": "High | Medium | Low",
    "estimatedTime": "Số giờ hoặc ngày",
    "status": "Todo"
  }
]

Tên dự án: ${projectName}
Mục tiêu dự án: ${projectGoal}
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini không trả về nội dung hợp lệ.");
  }

  return JSON.parse(text);
}

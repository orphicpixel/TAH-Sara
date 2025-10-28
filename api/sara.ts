// This file should be placed in the /api directory.
// It creates a Vercel Edge Function that acts as a secure proxy.

interface Message {
  text: string;
  sender: 'user' | 'sara';
}

interface RequestBody {
  chatHistory: Message[];
}

interface GeminiContentPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

const systemInstruction = `You are Sara, a friendly and expert AI travel planner. 
Your goal is to help users plan their dream vacations. 
Your responses should be helpful, engaging, and formatted for easy readability.
- For itineraries, use markdown lists.
- For budget estimates, use tables.
- Always be encouraging and excited about their travel plans.
- Do not mention you are an AI or language model. You are Sara.
`;

// Vercel Edge Functions are fast and run close to your users.
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API_KEY is not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { chatHistory } = (await request.json()) as RequestBody;

    const contents: GeminiContent[] = chatHistory.map(message => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    }));

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
      }),
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error('Gemini API Error:', errorBody);
        throw new Error(`Google API failed with status ${apiResponse.status}`);
    }

    const responseData = await apiResponse.json();
    const text = responseData.candidates[0]?.content?.parts[0]?.text;

    return new Response(JSON.stringify({ responseText: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in proxy function:', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
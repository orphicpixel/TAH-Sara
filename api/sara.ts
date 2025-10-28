// This file should be placed in the /api directory.
// It creates a Vercel Edge Function that acts as a secure proxy.
import { GoogleGenAI, Content } from '@google/genai';

interface Message {
  text: string;
  sender: 'user' | 'sara';
}

interface RequestBody {
  chatHistory: Message[];
}

const systemInstruction = `You are Sara, a cheerful, helpful, and conversational AI travel planner. Your mission is to be a friendly travel companion, making users feel inspired and confident about their journey.

**Your Persona & Tone:**
- Be cheerful and conversational.
- Show genuine excitement about their travel ideas.
- Always be encouraging and supportive of their plans.
- You are Sara, their travel companion. Never reveal that you are an AI or language model.

**Formatting Guidelines:**
- Keep messages easy to read and visually clear.
- Use markdown for formatting.
- For **itineraries**, use headings, bold letters, and bullet points or numbered lists.
- For **budgets or comparisons**, use neatly formatted markdown tables.
- Use emojis where appropriate to add warmth and excitement! ✈️🌍☀️
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

    const contents: Content[] = chatHistory.map(message => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    }));

    // FIX: Refactored to use the @google/genai SDK for cleaner, more maintainable code.
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;

    return new Response(JSON.stringify({ responseText: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in proxy function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An internal error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

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
- For **budgets or comparisons**, use neatly formatted markdown tables.
- Use emojis where appropriate to add warmth and excitement! ✈️🌍☀️

**Hotel Suggestions:**
- When a user asks for hotel ideas, you MUST provide suggestions in a card format.
- You MUST use your tools to find an estimated price range (e.g., ~$150 - ~$250) and include it in the card.
- Each hotel suggestion must be formatted as a markdown blockquote, which will be styled as a card.

- **Sourcing & Linking Rules:**
  1.  **If the destination is Qatar:**
      - Your primary source of suggestions MUST be the hotels listed on this page: **https://theawayhome.com/hotels-in-qatar/**. Suggest these unique hotels first.
      - For each hotel from this source, the markdown link MUST point to its specific page on theawayhome.com. The URL structure is \`https://theawayhome.com/properties/[hotel-name-slug]/\`.
      - To create the \`[hotel-name-slug]\`, take the hotel name, make it lowercase, and replace spaces with hyphens. (e.g., "Park Hyatt Doha" becomes "park-hyatt-doha").

  2.  **For all other destinations (or to add more options for Qatar):**
      - Use the Google Maps tool to find other great hotel options.
      - For these hotels, the markdown link MUST point to Booking.com. The URL structure is \`https://www.booking.com/searchresults.html?ss=Hotel+Name+City\`.

- **Card Formatting for ALL Hotel Suggestions:**
  - For each hotel, use the following markdown structure, wrapped in a blockquote. Present each suggestion in a separate blockquote.
  > ### **🏨 [Hotel Name](the-correct-link-as-instructed-above)**
  > *A captivating, one-sentence description.*
  > **Price:** ~$XXX - ~$XXX per night
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

    // The Gemini API requires that the history starts with a user message.
    // We'll find the first user message and slice the history from that point
    // to remove any preceding messages from Sara (the model).
    const firstUserIndex = chatHistory.findIndex(m => m.sender === 'user');
    const historyForApi = firstUserIndex !== -1 ? chatHistory.slice(firstUserIndex) : [];
    
    // This case should ideally not be hit with the current front-end logic,
    // but it's a good safeguard.
    if (historyForApi.length === 0) {
      return new Response(JSON.stringify({ error: "Cannot process a conversation with no user messages." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contents: Content[] = historyForApi.map(message => ({
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
        tools: [{googleMaps: {}}, {googleSearch: {}}],
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
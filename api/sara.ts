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

**Hotel Suggestions:**
- When a user asks for hotel recommendations, follow these sourcing and linking rules carefully:

  1.  **If the destination is Qatar:**
      - Your primary source of suggestions MUST be the hotels listed on this page: **https://theawayhome.com/hotels-in-qatar/**. Suggest these unique hotels first.
      - For each hotel from this source, the markdown link MUST point to its specific page on theawayhome.com.
      - The URL structure is \`https://theawayhome.com/properties/[hotel-name-slug]/\`.
      - To create the \`[hotel-name-slug]\`, take the hotel name, make it lowercase, and replace spaces with hyphens. (e.g., "Park Hyatt Doha" becomes "park-hyatt-doha").
      - **Example:** \`### **🏨 [Park Hyatt Doha](https://theawayhome.com/properties/park-hyatt-doha/)**\`

  2.  **For all other destinations (or to add more options for Qatar):**
      - Use the Google Maps tool to find other great hotel options.
      - For these hotels, the markdown link MUST point to Booking.com.
      - The URL structure is \`https://www.booking.com/searchresults.html?ss=Hotel+Name+City\`.
      - To create this link, replace "Hotel+Name+City" with the URL-encoded name and city of the hotel.
      - **Example:** \`### **🏨 [The Plaza Hotel](https://www.booking.com/searchresults.html?ss=The+Plaza+Hotel+New+York)**\`

- **General Formatting for ALL Hotel Suggestions:**
  - Provide a list of 2-3 diverse options.
  - For each hotel, use the following markdown structure, separating each suggestion with a horizontal rule (\`---\`):
    ### **🏨 [Hotel Name](the-correct-link-as-instructed-above)**
    *A captivating, one-sentence description.*
    **Price:** ~$XXX - ~$XXX per night
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
        tools: [{googleMaps: {}}],
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

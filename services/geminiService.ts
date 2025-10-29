import { GoogleGenAI, Content } from '@google/genai';
import { Message } from '../types';

const systemInstruction = `You are Sara, an efficient AI travel planner. Your goal is to provide information that is short, precise, and direct to the point.

**Your Persona & Tone:**
- Be direct and concise.
- Provide factual information without unnecessary conversational fluff.
- Get straight to the answer.
- You are Sara, a travel assistant. Never reveal that you are an AI or language model.

**Formatting Guidelines:**
- Keep messages easy to read and visually clear.
- Use markdown for formatting.
- For **budgets or comparisons**, use neatly formatted markdown tables.
- Avoid using emojis.

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


export const getSaraResponse = async (chatHistory: Message[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable not set.");
      throw new Error("API_KEY is not configured. Please set it up in your hosting environment variables.");
    }
    
    const ai = new GoogleGenAI({ apiKey });

    const firstUserIndex = chatHistory.findIndex(m => m.sender === 'user');
    const historyForApi = firstUserIndex !== -1 ? chatHistory.slice(firstUserIndex) : [];

    if (historyForApi.length === 0) {
      console.error("Cannot process a conversation with no user messages.");
      throw new Error("Cannot process a conversation with no user messages.");
    }

    const contents: Content[] = historyForApi.map(message => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{googleMaps: {}}, {googleSearch: {}}],
      },
    });

    const text = response.text;
    return text;

  } catch (error) {
    console.error("Failed to get response from Gemini API:", error);
    // This error will be caught by the App component, which will display a user-friendly message.
    throw error;
  }
};

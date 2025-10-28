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

**General Formatting:**
- Keep messages easy to read and visually clear.
- Use markdown for formatting.
- Use emojis where appropriate to add warmth and excitement! ✈️🌍☀️

**Itinerary Generation:**
When a user asks for a travel itinerary, you MUST follow this structure exactly. Use the provided example as your template.

**Example Itinerary Structure:**
---
### **5-Day Travel Itinerary to Doha, Qatar**
*Explore the vibrant culture, stunning skyline, and luxurious experiences of Doha with this curated 5-day plan.*

---

#### **Day 1: Arrival & Corniche Cornucopia**
**Arrival & Check-in**
*   **Hotel Recommendations:**
    *   **Luxury:** [The St. Regis Doha](LINK)
    *   **Mid-range:** [Souq Waqif Boutique Hotels](LINK)
    *   **Budget:** [Dawn Hotel Doha](LINK)

**Afternoon & Evening**
*   **Stroll along the Doha Corniche**
    *   Breathtaking views of the skyline
    *   Perfect for photos and relaxation
    *   [More about Corniche](LINK)
*   **Dinner at Al Bida Food & Beverage**
    *   Fresh seafood and Middle Eastern cuisine
    *   [Website & reservations](LINK)

---

#### **Day 2: Cultural Heritage & Souqs**
**Morning**
*   **Visit Museum of Islamic Art (MIA)**
    *   Architectural marvel
    *   Extensive Islamic art collection
    *   [Museum Details](LINK)

**Afternoon**
*   **Explore Souq Waqif**
    *   Traditional marketplace for spices, textiles, souvenirs
    *   Experience authentic Qatari culture
    *   [Souq Waqif Info](LINK)

**Evening**
*   **Dinner & Shisha at Souq Waqif**
    *   Try traditional Qatari dishes like Machboos
    *   Popular spot: [Al Jasra Traditional Food](LINK)

... (and so on for the remaining days) ...

---

#### **Additional Tips:**
*   **Transportation:** Use taxis or ride-hailing apps like Uber.
*   **Safety & Accessibility:** Doha is very traveler-friendly, with accessible services.
*   **Budget Tips:** Many attractions are free or inexpensive, local cafeterias are delicious and affordable.
---

**Instructions for Itinerary Content:**
1.  **Title:** Always start with \`### **[Number]-Day Travel Itinerary to [City], [Country]**\`.
2.  **Tagline:** Add a short, italicized tagline below the title.
3.  **Daily Structure:** Use \`#### **Day [Number]: [Catchy Title]**\` for each day.
4.  **Activities:** List main activities in bold. Use nested bullet points for details.
5.  **Links:** Provide relevant, helpful links with descriptive text (e.g., \`[Museum Details](LINK)\`, not just the URL). Use your knowledge and search capabilities to find real, relevant links.
6.  **Hotel Recommendations Section:**
    *   Place this section under Day 1.
    *   Categorize hotels into **Luxury**, **Mid-range**, and **Budget**.
    *   **IMPORTANT LINKING RULES:**
        *   **If the destination is Qatar:** Prioritize hotels from **https://theawayhome.com/hotels-in-qatar/**. Links for these hotels MUST point to their specific page on that site (e.g., \`https://theawayhome.com/properties/park-hyatt-doha/\`).
        *   **For all other destinations (or to supplement Qatar options):** Use Google Maps to find hotels. Links for these MUST point to Booking.com (e.g., \`https://www.booking.com/searchresults.html?ss=Hotel+Name+City\`).
7.  **Final Section:** Always include an \`#### **Additional Tips:**\` section at the end.
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

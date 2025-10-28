
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are Sara, a friendly and expert AI travel planner. 
Your goal is to help users plan their dream vacations. 
Your responses should be helpful, engaging, and formatted for easy readability.
- For itineraries, use markdown lists.
- For budget estimates, use tables.
- Always be encouraging and excited about their travel plans.
- Do not mention you are an AI or language model. You are Sara.
`;

const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction,
  },
});

export const getSaraResponse = async (chatHistory: Message[], newUserMessage: Message): Promise<string> => {
    try {
        const response: GenerateContentResponse = await chat.sendMessage({
            message: newUserMessage.text
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        // The error will be caught and handled in the App component
        throw error;
    }
};

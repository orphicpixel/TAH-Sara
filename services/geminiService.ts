import { Message } from '../types';

export const getSaraResponse = async (chatHistory: Message[], newUserMessage: Message): Promise<string> => {
  try {
    const response = await fetch('/api/sara', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the entire history for the backend to have full context
      body: JSON.stringify({ chatHistory: [...chatHistory, newUserMessage] }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
        console.error("API proxy error:", errorData.error);
        throw new Error("Failed to get a response from the server.");
    }

    const data = await response.json();
    return data.responseText;

  } catch (error) {
    console.error("Failed to fetch from API proxy:", error);
    // This error will be caught by the App component, which will display a user-friendly message.
    throw error;
  }
};
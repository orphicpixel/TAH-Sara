import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Sender } from './types';
import { getSaraResponse } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      text: "Hello! I'm Sara, your personal AI travel planner. Where would you like to go, or what kind of trip are you dreaming of?",
      sender: Sender.Sara,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.User,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const saraResponseText = await getSaraResponse(messages, userMessage);
      const saraMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: saraResponseText,
        sender: Sender.Sara,
      };
      setMessages((prev) => [...prev, saraMessage]);
    } catch (err) {
      console.error("An error occurred while fetching Sara's response:", err);
      const errorResponseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I seem to be having some trouble right now. Please try again in a moment.",
        sender: Sender.Sara,
      };
      setMessages((prev) => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <div className="flex flex-col h-screen font-sans">
        <header className="bg-white shadow-md p-4 flex items-center gap-4 sticky top-0 z-10">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Sara</h1>
            <p className="text-sm text-green-500 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">S</div>
                    <div className="bg-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-center space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
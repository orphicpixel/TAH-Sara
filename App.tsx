import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Sender } from './types';
import { getSaraResponse } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SaraAvatar from './components/SaraAvatar';

const initialMessage: Message = {
  id: 'sara-initial-1',
  text: "Hello! My name is Sara and I'm here to help you plan an exciting and personalized trip. Where would you like to go, and what are your travel plans? Please share some details such as your destination, trip dates, number of travelers, budget, and any particular interests or activities you'd like to include.",
  sender: Sender.Sara,
};

const NewChatIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
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

  const handleNewChat = () => {
    setMessages([initialMessage]);
    setInput('');
    setIsLoading(false);
  };

  const handleDownloadTranscript = () => {
    const formattedTranscript = messages
      .map(msg => `${msg.sender === Sender.Sara ? 'Sara' : 'User'}: ${msg.text}`)
      .join('\n\n---\n\n');

    const blob = new Blob([formattedTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sara-chat-transcript.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="flex flex-col h-screen font-sans">
        <header className="bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center">
              <SaraAvatar />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Sara</h1>
              <p className="text-sm text-green-500 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={handleNewChat}
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label="Start new chat"
                title="Start new chat"
            >
                <NewChatIcon />
            </button>
            <button
                onClick={handleDownloadTranscript}
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label="Download chat transcript"
                title="Download chat transcript"
            >
                <DownloadIcon />
            </button>
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
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                      <SaraAvatar />
                    </div>
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
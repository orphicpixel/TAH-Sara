import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Sender } from './types';
import { getSaraResponse } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import SaraAvatar from './components/SaraAvatar';
import SaraTypingIndicator from './components/SaraTypingIndicator';

const initialMessage: Message = {
  id: 'sara-initial-1',
  text: "Hello! My name is Sara. To help you plan an exciting and personalized trip, I'll need to ask you a few questions.",
  sender: Sender.Sara,
};

const questions: string[] = [
  "What is your destination of choice?",
  "When are you planning to travel?",
  "How many days are you planning to travel?",
  "What is your budget (e.g., per person, total)?",
  "What type of traveler are you? (e.g., adventurer, relaxer, cultural explorer, leisure)",
  "Who do you plan on traveling with on your next adventure?",
  "Do you have any food preferences, such as halal, vegetarian, or vegan?",
  "Finally, do you have any food allergies or dietary restrictions?",
];

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
  const [isGathering, setIsGathering] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length === 1 && isGathering) {
      setIsLoading(true);
      setTimeout(() => {
        const firstQuestion: Message = {
          id: 'sara-q-0',
          text: questions[0],
          sender: Sender.Sara,
        };
        setMessages(prev => [...prev, firstQuestion]);
        setIsLoading(false);
      }, 1000);
    }
  }, [messages, isGathering]);
  
  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.User,
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    if (isGathering) {
      const updatedAnswers = [...userAnswers, currentInput];
      setUserAnswers(updatedAnswers);

      const nextQuestionIndex = currentQuestionIndex + 1;

      if (nextQuestionIndex < questions.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
        setTimeout(() => {
          const nextQuestion: Message = {
            id: `sara-q-${nextQuestionIndex}`,
            text: questions[nextQuestionIndex],
            sender: Sender.Sara,
          };
          setMessages(prev => [...prev, nextQuestion]);
          setIsLoading(false);
        }, 1200);
      } else {
        setIsGathering(false);

        const thinkingMessage: Message = {
          id: 'sara-thinking',
          text: "Thank you! I have all the information I need. I'm now crafting a tailored travel plan for you. This may take a moment...",
          sender: Sender.Sara,
        };
        
        setTimeout(() => {
            setMessages(prev => [...prev, thinkingMessage]);
        }, 300);
        
        const summaryPrompt = `Please act as Sara, an expert AI travel planner. A user has provided their travel preferences. Based **only** on the information below, create a detailed and personalized travel itinerary with hotel, flight, and restaurant recommendations that matches their needs.

**User's Travel Preferences:**
${questions.map((q, i) => `- ${q.split('?')[0]}: ${updatedAnswers[i]}`).join('\n')}
`;
        
        const planRequestHistory: Message[] = [{ id: 'summary-prompt', text: summaryPrompt, sender: Sender.User }];

        try {
          const saraResponseText = await getSaraResponse(planRequestHistory);
          const saraMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: saraResponseText,
            sender: Sender.Sara,
          };
          setMessages(prev => [...prev.slice(0, -1), saraMessage]);
        } catch (err) {
          console.error("An error occurred while fetching Sara's response:", err);
          const errorResponseMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I seem to be having some trouble right now. Please try again in a moment.",
            sender: Sender.Sara,
          };
          setMessages((prev) => [...prev.slice(0, -1), errorResponseMessage]);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      try {
        const saraResponseText = await getSaraResponse([...messages, userMessage]);
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
    }
  }, [input, isLoading, messages, isGathering, currentQuestionIndex, userAnswers]);

  const handleNewChat = () => {
    setMessages([initialMessage]);
    setInput('');
    setIsLoading(false);
    setIsGathering(true);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
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

  const placeholderText = isGathering ? "Type your answer here..." : "Ask a follow-up question...";

  return (
    <div className="flex flex-col h-screen font-sans">
        <header className="bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SaraAvatar size="large" />
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
          {isLoading && <SaraTypingIndicator />}
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
            placeholder={placeholderText}
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
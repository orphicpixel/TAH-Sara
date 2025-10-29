
import React from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);


const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, onSend, isLoading, placeholder }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Ask Sara about your next trip..."}
        className="flex-1 w-full px-4 py-3 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        disabled={isLoading}
      />
      <button
        onClick={onSend}
        disabled={isLoading || input.trim() === ''}
        className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-full transition-all duration-200 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transform hover:scale-110 disabled:scale-100"
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </div>
  );
};

export default ChatInput;
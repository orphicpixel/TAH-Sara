import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Sender } from '../types';
import UserAvatar from './UserAvatar';
import SaraAvatar from './SaraAvatar';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  const wrapperClasses = isUser ? 'flex justify-end items-end' : 'flex justify-start items-end';
  const messageClasses = isUser
    ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
    : 'bg-gray-200 text-gray-800 rounded-r-lg rounded-tl-lg';

  // Custom components for styling markdown elements within Sara's responses.
  const saraMarkdownComponents = {
    table: ({...props}) => <table className="w-full my-2 border-collapse text-sm bg-white shadow-sm rounded-lg" {...props} />,
    thead: ({...props}) => <thead className="bg-gray-100" {...props} />,
    th: ({...props}) => <th className="border border-gray-300 p-2 font-semibold text-left" {...props} />,
    td: ({...props}) => <td className="border border-gray-300 p-2" {...props} />,
    a: ({...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
    h3: ({...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
    ul: ({...props}) => <ul className="list-disc list-outside pl-5 space-y-1" {...props} />,
    ol: ({...props}) => <ol className="list-decimal list-outside pl-5 space-y-1" {...props} />,
    // Updated img component for better card visuals
    img: ({...props}) => <img className="my-3 rounded-lg shadow-md w-full h-auto object-cover max-h-60" alt={props.alt} {...props} />,
    // Added blockquote component to render hotel cards
    blockquote: ({...props}) => <div className="bg-white shadow-lg rounded-xl p-4 my-4 border-l-4 border-blue-400" {...props} />,
  };

  return (
    <div className={`${wrapperClasses} w-full`}>
      <div className={`flex items-start gap-3 max-w-full md:max-w-3/4 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className="shrink-0">
          {isUser ? <UserAvatar /> : <SaraAvatar />}
        </div>
        <div className={`p-3 md:p-4 shadow-md ${messageClasses} overflow-hidden`}>
          {isUser ? (
            <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.text}</p>
          ) : (
            // FIX: The className prop is not valid on ReactMarkdown. Moved it to the wrapper div.
            // The prose classes from Tailwind Typography are intended for container elements.
            <div className="text-sm md:text-base prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={saraMarkdownComponents}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
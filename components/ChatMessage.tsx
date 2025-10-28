
import React from 'react';
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

  return (
    <div className={`${wrapperClasses} w-full`}>
      <div className={`flex items-start gap-3 max-w-full md:max-w-3/4 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className="shrink-0">
          {isUser ? <UserAvatar /> : <SaraAvatar />}
        </div>
        <div className={`p-3 md:p-4 shadow-md ${messageClasses} overflow-hidden`}>
          <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

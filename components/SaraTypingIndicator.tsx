import React from 'react';
import SaraAvatar from './SaraAvatar';

const SaraTypingIndicator: React.FC = () => (
  <div className="flex justify-start items-end">
    <div className="flex items-start gap-3 max-w-full md:max-w-3/4">
      <div className="shrink-0">
        <SaraAvatar />
      </div>
      <div className="bg-gray-200 rounded-r-lg rounded-tl-lg p-3 shadow-md">
        <div className="flex items-center justify-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  </div>
);

export default SaraTypingIndicator;

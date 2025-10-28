import React from 'react';

interface SaraAvatarProps {
  size?: 'small' | 'large';
}

const SaraAvatar: React.FC<SaraAvatarProps> = ({ size = 'small' }) => {
    const sizeClasses = size === 'large' ? 'w-12 h-12 text-2xl' : 'w-10 h-10 text-lg';
    return (
        <div className={`${sizeClasses} bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
            S
        </div>
    );
};

export default SaraAvatar;

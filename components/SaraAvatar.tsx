import React from 'react';

interface SaraAvatarProps {
  size?: 'small' | 'large';
}

const SaraAvatar: React.FC<SaraAvatarProps> = ({ size = 'small' }) => {
    const sizeClasses = size === 'large' ? 'w-12 h-12' : 'w-10 h-10';
    // Using a reliable public URL from Imgur to avoid storage access issues.
    const avatarUrl = 'https://i.imgur.com/2N1s4oB.png';

    return (
        <img
            src={avatarUrl}
            alt="Sara's avatar"
            className={`${sizeClasses} rounded-full object-cover shrink-0 shadow-sm`}
        />
    );
};

export default SaraAvatar;
import React from 'react';

interface SaraAvatarProps {
  size?: 'small' | 'large';
}

const SaraAvatar: React.FC<SaraAvatarProps> = ({ size = 'small' }) => {
    const sizeClasses = size === 'large' ? 'w-12 h-12' : 'w-10 h-10';
    const avatarUrl = 'https://theawayhome.com/wp-content/uploads/2025/11/Sara-TAH.png';

    return (
        <img
            src={avatarUrl}
            alt="Sara's avatar"
            className={`${sizeClasses} rounded-full object-cover shrink-0 shadow-sm`}
        />
    );
};

export default SaraAvatar;

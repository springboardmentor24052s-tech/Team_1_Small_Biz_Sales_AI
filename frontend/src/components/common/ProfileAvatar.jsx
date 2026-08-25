import React from 'react';
import { resolveApiAsset } from '../../api/client';

export const ProfileAvatar = ({ profile, fallbackImage, className = '', imageClassName = '' }) => {
  if (profile?.avatar_url) {
    return (
      <img
        src={resolveApiAsset(profile.avatar_url)}
        alt={profile.full_name || 'Profile'}
        className={`${className} object-cover ${imageClassName}`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 shadow-inner ${imageClassName}`}
      role="img"
      aria-label={`${profile?.full_name || 'User'} default avatar`}
    >
      <span className="leading-none" aria-hidden="true">{profile?.avatar_emoji || (fallbackImage ? '🙂' : '🧑‍💼')}</span>
    </div>
  );
};

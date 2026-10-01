import React from 'react';

export const ChromeLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`shrink-0 ${className}`}
    >
      <circle cx="24" cy="24" r="23" fill="#ffffff" />
      {/* Red sector (top) */}
      <path
        d="M24 4C14.7 4 7 10.4 4.8 19.1L15.3 25.2C15.8 20.2 20 16.3 25.1 16.3H43.1C40 8.9 32.6 4 24 4Z"
        fill="#EA4335"
      />
      {/* Yellow sector (right) */}
      <path
        d="M43.1 16.3C44.4 18.7 45.1 21.3 45.1 24C45.1 35.6 35.7 45 24.1 45C19.9 45 16 43.7 12.8 41.5L23.3 23.3C25.8 27.6 31.3 29.1 35.6 26.6C37.3 25.6 38.6 24.1 39.3 22.3L43.1 16.3Z"
        fill="#FBBC05"
      />
      {/* Green sector (left & bottom) */}
      <path
        d="M24.1 45C14.4 45 6.3 38.4 4.4 29.5L14.8 23.4C15.8 27.8 20 30.9 24.7 30.4C26.7 30.2 28.6 29.3 30.1 27.9L24.1 45Z"
        fill="#34A853"
      />
      {/* White inner ring */}
      <circle cx="24" cy="24" r="10" fill="#ffffff" />
      {/* Center Blue circle */}
      <circle cx="24" cy="24" r="8" fill="#1A73E8" />
    </svg>
  );
};

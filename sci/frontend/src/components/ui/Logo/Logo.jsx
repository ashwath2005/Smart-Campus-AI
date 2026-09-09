import React from 'react';
import './Logo.css';

export const Logo = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`logo-svg ${className}`}
    >
      {/* 1. Top S-Hook segment */}
      <path
        d="M30 20 H74 L62 32 H38 L28 42 H14 L28 28 H30 Z"
        fill="currentColor"
      />
      {/* 2. Center A-Chevron segment */}
      <path
        d="M50 28 L72 52 H58 L50 40 L42 52 H28 Z"
        fill="currentColor"
      />
      {/* 3. Bottom W-Wave segment */}
      <path
        d="M20 50 L38 72 L50 58 L62 72 L80 50 L66 60 L50 44 L34 60 Z"
        fill="currentColor"
      />
    </svg>
  );
};

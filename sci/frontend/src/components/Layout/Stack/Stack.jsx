import React from 'react';
import './Stack.css';

export const Stack = ({
  children,
  className = '',
  direction = 'column',
  gap = 3,
  ...props
}) => {
  // Convert gap number to CSS variable format
  const gapStyle = `--stack-gap: ${gap}px`;
  const directionStyle = `--stack-direction: ${direction}`;

  return (
    <div
      className={`stack ${direction} ${className}`}
      style={{ [gapStyle]: '', [directionStyle]: '' }}
      {...props}
    >
      {children}
    </div>
  );
};

Stack.displayName = 'Stack';
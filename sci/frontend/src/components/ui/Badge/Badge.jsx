import React from 'react';
import './Badge.css';

export const Badge = ({
  children,
  variant = 'default',
  dot = false,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && <span className={`badge-dot badge-dot-${variant}`} />}
      {children}
    </span>
  );
};

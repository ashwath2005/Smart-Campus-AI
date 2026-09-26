import React from 'react';
import './Grid.css';

export const Grid = ({
  children,
  className = '',
  columns = 1,
  gap = 4,
  ...props
}) => {
  // Convert gap number to CSS variable format
  const gapStyle = `--grid-gap: ${gap}px`;

  return (
    <div
      className={`grid grid-cols-${columns} ${className}`}
      style={gapStyle}
      {...props}
    >
      {children}
    </div>
  );
};

Grid.displayName = 'Grid';
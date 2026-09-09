import React from 'react';
import './Skeleton.css';

export const Skeleton = ({
  variant = 'text',
  className = '',
  count = 1,
}) => {
  const getStyleClass = () => {
    switch (variant) {
      case 'circle':
        return 'skeleton-circle';
      case 'card':
        return 'skeleton-card';
      case 'rectangle':
        return 'skeleton-rectangle';
      case 'text':
      default:
        return 'skeleton-text';
    }
  };

  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, idx) => (
        <div
          key={idx}
          className={`skeleton ${getStyleClass()} ${className} ${
            idx > 0 ? 'skeleton-spacing' : ''
          }`}
        />
      ))}
    </>
  );
};

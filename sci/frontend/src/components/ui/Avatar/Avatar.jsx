import React from 'react';
import './Avatar.css';

export const Avatar = ({
  name,
  src,
  size = 'md',
  className = '',
}) => {
  const getInitials = (n) => {
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="avatar-img"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

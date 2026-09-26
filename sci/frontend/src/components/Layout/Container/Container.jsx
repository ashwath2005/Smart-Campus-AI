import React from 'react';
import './Container.css';

export const Container = ({ children, className = '', fluid = false, ...props }) => {
  return (
    <div
      className={`container ${fluid ? 'container-fluid' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Container.displayName = 'Container';
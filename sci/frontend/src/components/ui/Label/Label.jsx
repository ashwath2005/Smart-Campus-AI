import React from 'react';
import './Label.css';

export const Label = ({ children, htmlFor, className = '', ...props }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`label ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

Label.displayName = 'Label';
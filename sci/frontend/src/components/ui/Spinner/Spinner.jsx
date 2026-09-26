import React from 'react';
import './Spinner.css';

export const Spinner = ({
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <div className={`spinner spinner-${size} ${className}`} {...props}>
      <svg className="spinner-svg" viewBox="0 0 50 50">
        <circle className="spinner-path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"/>
      </svg>
    </div>
  );
};

Spinner.displayName = 'Spinner';
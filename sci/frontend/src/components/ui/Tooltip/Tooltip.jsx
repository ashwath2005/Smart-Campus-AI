import React from 'react';
import './Tooltip.css';

export const Tooltip = ({ children, className = '', placement = 'top', ...props }) => {
  return (
    <div className={`tooltip tooltip-${placement} ${className}`} {...props}>
      {children}
      <div className="tooltip-arrow"></div>
      <div className="tooltip-content">{children}</div>
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
import React from 'react';
import './Progress.css';

export const Progress = ({ value, label, className = '', ...props }) => {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress-wrapper ${className}`} {...props}>
      <div className="progress-label">{label}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="progress-value">{percent}%</div>
    </div>
  );
};

Progress.displayName = 'Progress';
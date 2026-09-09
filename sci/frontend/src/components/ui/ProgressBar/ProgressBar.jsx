import React from 'react';
import './ProgressBar.css';

export const ProgressBar = ({
  value,
  max = 100,
  type = 'linear',
  size = 60,
  strokeWidth = 5,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getStatusClass = (pct) => {
    if (pct >= 75) return { text: 'pb-success-text', bg: 'pb-success-bg' };
    if (pct >= 60) return { text: 'pb-warning-text', bg: 'pb-warning-bg' };
    return { text: 'pb-danger-text', bg: 'pb-danger-bg' };
  };

  const status = getStatusClass(percentage);

  if (type === 'circular') {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`progress-bar-circle-container ${className}`} style={{ width: size, height: size }}>
        <svg className="progress-bar-svg">
          <circle
            className="progress-bar-circle-bg"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`progress-bar-circle-fill ${status.text}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <span className={`progress-bar-label ${status.text}`}>
          {Math.round(percentage)}%
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="progress-bar-linear-track">
        <div
          className={`progress-bar-linear-fill ${status.bg}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

import React from 'react';

export const ProgressRing = ({
  percentage = 0,
  size = 120,
  strokeWidth = 10,
  color = '#E31B23',
  trackColor = 'rgba(255, 255, 255, 0.05)',
  label = '',
  sublabel = '',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={`progress-ring-container ${className}`}
      style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Foreground progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${color}88)`
          }}
        />
      </svg>
      {/* Center Text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        <span style={{ fontSize: size * 0.22, fontWeight: '800', color: 'var(--text-primary, #fff)', lineHeight: 1 }}>
          {label || `${Math.round(clamped)}%`}
        </span>
        {sublabel && (
          <span style={{ fontSize: size * 0.09, color: 'var(--text-secondary, #94a3b8)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

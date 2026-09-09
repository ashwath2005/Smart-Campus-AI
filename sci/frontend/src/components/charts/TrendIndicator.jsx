import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const TrendIndicator = ({
  value = 0,
  suffix = '%',
  prefix = '',
  label = 'vs last month',
  invertColor = false, // if true, negative is good (e.g. dropouts, overdue)
  className = ''
}) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  // Standard: positive = green, negative = red
  // Invert: positive = red, negative = green
  let color = '#10b981'; // green
  if (isPositive && invertColor) color = '#ef4444';
  if (!isPositive && !invertColor && !isNeutral) color = '#ef4444';
  if (isNeutral) color = 'var(--text-secondary, #94a3b8)';

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const displayVal = `${isPositive ? '+' : ''}${value}${suffix}`;

  return (
    <div
      className={`trend-indicator-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: '11px',
        fontWeight: 600,
        color
      }}
    >
      <Icon size={12} />
      <span>{prefix}{displayVal}</span>
      {label && (
        <span style={{ color: 'var(--text-secondary, rgba(255, 255, 255, 0.4))', fontWeight: 400, marginLeft: 2 }}>
          {label}
        </span>
      )}
    </div>
  );
};

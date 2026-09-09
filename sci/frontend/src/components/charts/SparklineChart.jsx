import React from 'react';

export const SparklineChart = ({
  data = [12, 14, 11, 16, 18, 15, 22, 20, 25],
  width = 100,
  height = 32,
  color = '#E31B23',
  strokeWidth = 2,
  showDot = true,
  className = ''
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const usableHeight = height - padding * 2;
  const step = (width - padding * 2) / (data.length - 1);

  // Compute points
  const points = data.map((val, idx) => {
    const x = padding + idx * step;
    const y = height - padding - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    // Simple smooth curve control point
    const prev = points[idx - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  // Fill area under path
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaD = `${pathD} L ${lastPt.x},${height} L ${firstPt.x},${height} Z`;

  const gradientId = `sparkline-grad-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`sparkline-svg ${className}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Area Fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Spline Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End Pulsing Dot */}
      {showDot && (
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r={3}
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}
    </svg>
  );
};

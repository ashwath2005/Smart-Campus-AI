import './AttendanceChart.css';
import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="attendance-tooltip-container glass">
        <p className="attendance-tooltip-date">
          {payload[0].payload.date}
        </p>
        <p className="attendance-tooltip-val-row">
          Attendance: <span className="attendance-tooltip-val-highlight">{payload[0].value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export const AttendanceChart = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="attendance-chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        No attendance trend data available.
      </div>
    );
  }

  const chartData = data;

  return (
    <div className="attendance-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F21722" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#F21722" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* We can use CSS classes on CartesianGrid to control visibility */}
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--text-secondary)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--text-secondary)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[40, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="#F21722"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAttendance)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

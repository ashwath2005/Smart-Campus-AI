import './AssignmentChart.css';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="chart-tooltip-container glass">
        <p className="chart-tooltip-text">
          <span className="chart-tooltip-dot" style={{ backgroundColor: data.payload.color || data.color }} />
          {data.name}: <span className="chart-tooltip-value">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const AssignmentChart = ({ data }) => {
  const fallbackData = [
    { name: 'Submitted', value: 8, color: '#10b981' },
    { name: 'Pending', value: 3, color: '#f59e0b' },
    { name: 'Overdue', value: 1, color: '#f43f5e' },
  ];

  const chartData = data
    ? [
        { name: 'Submitted', value: data.submitted, color: '#10b981' },
        { name: 'Pending', value: data.pending, color: '#f59e0b' },
        { name: 'Overdue', value: data.overdue, color: '#f43f5e' },
      ]
    : fallbackData;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={65}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="chart-legend-text">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

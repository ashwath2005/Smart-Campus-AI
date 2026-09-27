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
  if (!data || (!data.submitted && !data.pending && !data.overdue)) {
    return (
      <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
        No assignment telemetry available.
      </div>
    );
  }

  const chartData = [
    { name: 'Submitted', value: data.submitted || 0, color: '#10b981' },
    { name: 'Pending', value: data.pending || 0, color: '#f59e0b' },
    { name: 'Overdue', value: data.overdue || 0, color: '#f43f5e' },
  ];

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

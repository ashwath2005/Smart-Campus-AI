import './PerformanceChart.css';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="performance-tooltip-container glass">
        <p className="performance-tooltip-title">
          Semester {payload[0].payload.semester}
        </p>
        {payload.map((item, idx) => (
          <p key={idx} className="performance-tooltip-row">
            <span className="performance-tooltip-dot" style={{ backgroundColor: item.color }} />
            {item.name}: <span className="performance-tooltip-val">{item.value.toFixed(2)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PerformanceChart = ({ data }) => {
  const fallbackData = [
    { semester: 1, sgpa: 8.2, cgpa: 8.2 },
    { semester: 2, sgpa: 8.5, cgpa: 8.35 },
    { semester: 3, sgpa: 8.8, cgpa: 8.5 },
    { semester: 4, sgpa: 9.0, cgpa: 8.62 },
  ];

  const chartData = data
    ? data.map((item) => ({
        semester: item.semester,
        sgpa: item.sgpa,
        cgpa: item.cgpa,
      }))
    : fallbackData;

  return (
    <div className="performance-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="semester"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(tick) => `Sem ${tick}`}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[6.0, 10.0]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="performance-legend-text">{value}</span>}
          />
          <Line type="monotone" dataKey="sgpa" name="SGPA" stroke="#E31B23" strokeWidth={2} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="cgpa" name="CGPA" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

import './PlacementChart.css';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="placement-tooltip-container glass">
        <p className="placement-tooltip-title">
          {payload[0].payload.department} Department
        </p>
        {payload.map((item, idx) => (
          <p key={idx} className="placement-tooltip-row">
            <span className="placement-tooltip-dot" style={{ backgroundColor: item.color }} />
            {item.name}: <span className="placement-tooltip-val">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PlacementChart = ({ data }) => {
  const fallbackData = [
    { department: 'CSE', placed: 45, total: 60 },
    { department: 'ECE', placed: 30, total: 50 },
    { department: 'ME', placed: 20, total: 40 },
    { department: 'IT', placed: 35, total: 45 },
  ];

  const chartData = data || fallbackData;

  return (
    <div className="placement-chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap="-100%">
          <defs>
            <linearGradient id="placedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E31B23" stopOpacity={1} />
              <stop offset="100%" stopColor="#c2141a" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="department"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={5}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={-5}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(148, 163, 184, 0.08)', radius: 10 }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="placement-legend-text">{value}</span>}
          />
          {/* Background wider bar (Total Registered) */}
          <Bar 
            dataKey="total" 
            name="Total Registered" 
            fill="url(#totalGradient)" 
            fillOpacity={0.12} 
            stroke="#E31B23" 
            strokeWidth={1.5} 
            radius={[6, 6, 0, 0]} 
            barSize={24} 
          />
          {/* Foreground nested inner bar (Placed Students) */}
          <Bar 
            dataKey="placed" 
            name="Placed Students" 
            fill="url(#placedGradient)" 
            radius={[4, 4, 0, 0]} 
            barSize={12} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

import React from 'react';
import { Card } from '../Card/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './StatCard.css';

export const StatCard = ({
  label,
  value,
  icon,
  trend,
  description,
  className = '',
}) => {
  return (
    <Card className={`font-sans relative overflow-hidden ${className}`}>
      <div className="stat-card-header">
        <div className="stat-card-body">
          <p className="stat-card-label">
            {label}
          </p>
          <h4 className="stat-card-value">
            {value}
          </h4>
        </div>
        {icon && (
          <div className="stat-card-icon">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="stat-card-trend-container">
          <span
            className={`stat-card-trend-badge ${
              trend.isPositive 
                ? 'stat-card-trend-badge-positive' 
                : 'stat-card-trend-badge-negative'
            }`}
          >
            {trend.isPositive ? <ArrowUpRight size={13} style={{ marginRight: '2px' }} /> : <ArrowDownRight size={13} style={{ marginRight: '2px' }} />}
            {trend.value}%
          </span>
          <span className="stat-card-trend-text">from last month</span>
        </div>
      )}
      {description && (
        <div className="stat-card-description">
          {description}
        </div>
      )}
    </Card>
  );
};

import React from 'react';
import { Card } from '../../../components/ui';
import { Clock } from 'lucide-react';

export function PulseForecast({ forecastData = [] }) {
  return (
    <Card hoverGlow={false} className="cp-forecast-card mb-8">
      <h3 className="cp-card-title mb-3">
        <Clock size={18} className="text-brand-red" />
        1–3 Hour Campus Activity Forecast
      </h3>

      <div className="cp-forecast-flex">
        {forecastData.map((item, idx) => (
          <div key={idx} className="cp-forecast-item">
            <span className="cp-fc-time">+{item.hourOffset} HOUR ({item.time})</span>
            <span className="cp-fc-score">{item.predictedScore}%</span>
            <span className="text-xs text-muted">
              Expected norm: {item.expectedBaseline}% ({item.confidence}% confidence)
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

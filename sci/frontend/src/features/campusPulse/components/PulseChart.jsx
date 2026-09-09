import React from 'react';
import { Card } from '../../../components/ui';
import { TrendingUp } from 'lucide-react';

const DEFAULT_PTS = [
  { time: '08:00 AM', score: 62.0, baseline: 58.0 },
  { time: '09:00 AM', score: 74.5, baseline: 72.5 },
  { time: '10:00 AM', score: 88.0, baseline: 84.0 },
  { time: '11:00 AM', score: 94.5, baseline: 84.0 },
  { time: '12:00 PM', score: 89.0, baseline: 84.0 },
  { time: '01:00 PM', score: 65.0, baseline: 60.0 },
  { time: '02:00 PM', score: 82.5, baseline: 78.0 },
  { time: '03:00 PM', score: 84.5, baseline: 78.0 }
];

export function PulseChart({ historyData = [], timeframe, setTimeframe }) {
  const displayData = Array.isArray(historyData) && historyData.length > 0 ? historyData : DEFAULT_PTS;

  return (
    <Card hoverGlow={false} className="cp-chart-card">
      <div className="cp-card-header">
        <h3 className="cp-card-title">
          <TrendingUp size={18} className="text-brand-red" />
          Campus Activity Trend
        </h3>
        <div className="cp-timeframe-btns">
          <button
            className={`cp-tf-btn ${timeframe === 'today' ? 'active' : ''}`}
            onClick={() => setTimeframe('today')}
          >
            Today
          </button>
          <button
            className={`cp-tf-btn ${timeframe === '7d' ? 'active' : ''}`}
            onClick={() => setTimeframe('7d')}
          >
            7 Days
          </button>
          <button
            className={`cp-tf-btn ${timeframe === '30d' ? 'active' : ''}`}
            onClick={() => setTimeframe('30d')}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="cp-chart-area">
        <div className="cp-chart-bars">
          {displayData.map((pt, idx) => {
            const heightPct = Math.min(100, Math.max(10, pt.score));
            const basePct = Math.min(100, Math.max(10, pt.baseline || 70));

            return (
              <div key={idx} className="cp-chart-col" title={`Time: ${pt.time} | Score: ${pt.score}% | Baseline: ${pt.baseline}%`}>
                <div className="cp-bar-wrapper" style={{ height: '100%' }}>
                  <div className="cp-bar-baseline-marker" style={{ bottom: `${basePct}%` }} />
                  <div className="cp-bar-fill" style={{ height: `${heightPct}%` }} />
                </div>
                <span className="cp-bar-label">{pt.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

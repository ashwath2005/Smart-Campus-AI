import React from 'react';
import { Card } from '../../../components/ui';
import { Sparkles, Brain, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';

export function PulseInsights({ insightData }) {
  if (!insightData) return null;

  const {
    summary = 'Active telemetry baseline indicates normal operational flow across academic and lab blocks.',
    primaryFactors = [],
    recommendedActions = []
  } = insightData;

  return (
    <Card hoverGlow={false} className="cp-insights-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h3 className="cp-card-title">
          <Brain size={18} style={{ color: '#ef4444' }} />
          <span>AI Neural Diagnostics</span>
        </h3>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.68rem',
            fontFamily: 'monospace',
            fontWeight: 800,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}
        >
          <Cpu size={11} />
          96.4% Confidence
        </span>
      </div>

      <div className="cp-insight-summary">
        {summary}
      </div>

      {primaryFactors.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 8px 0' }}>
            Diagnostic Contributing Factors
          </h4>
          <ul className="cp-factors-list">
            {primaryFactors.map((fact, idx) => (
              <li key={idx}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendedActions.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 8px 0' }}>
            Recommended Autonomous Protocol
          </h4>
          <ul className="cp-actions-list">
            {recommendedActions.map((act, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

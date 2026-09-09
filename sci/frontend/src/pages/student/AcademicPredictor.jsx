import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Card } from '../../components/ui';
import { Award, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import './AcademicPredictor.css';

const DEFAULT_PREDICTION = {
  predictedSGPA: 8.25,
  predictedCGPA: 8.10,
  riskLevel: 'MODERATE RISK',
  cat1Average: 80.0,
  cat2Average: 85.0,
  attendancePercentage: 81.8,
  recommendationSummary: "Performance is stable. Focused revision in core algorithms and Cloud Computing lab assessments is recommended to achieve distinction.",
  aiInterventionPlan: [
    { day: "DAY 1–3", focus: "Deep Learning & Neural Networks", action: "Review Backpropagation derivation notes & complete Unit 2 assignment" },
    { day: "DAY 4–6", focus: "Distributed Systems", action: "Solve 5 previous year CAT 2 questions on Raft consensus protocol" },
    { day: "DAY 7–9", focus: "Cloud Computing Infrastructure", action: "Practice Docker & Kubernetes deployment labs in AI Study Assistant" },
    { day: "DAY 10–14", focus: "Mock Test & Viva Prep", action: "Complete full-length 2-hour AI mock exam & review weak topic flashcards" }
  ]
};

export function AcademicPredictor() {
  const [data, setData] = useState(DEFAULT_PREDICTION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      try {
        const res = await api.get('/academic-risk/predict');
        if (res.data && res.data.predictedSGPA) {
          setData(res.data);
        }
      } catch (err) {
        setData(DEFAULT_PREDICTION);
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
  }, []);

  if (loading) {
    return (
      <div className="ap-container">
        <div className="ap-loading-box">
          <Sparkles className="ap-spin-icon" size={24} />
          <span>Loading Predictive SGPA Early-Warning System...</span>
        </div>
      </div>
    );
  }

  const {
    predictedSGPA = 8.25,
    predictedCGPA = 8.10,
    riskLevel = 'MODERATE RISK',
    cat1Average = 80.0,
    cat2Average = 85.0,
    attendancePercentage = 81.8,
    recommendationSummary = DEFAULT_PREDICTION.recommendationSummary,
    aiInterventionPlan = DEFAULT_PREDICTION.aiInterventionPlan
  } = data || DEFAULT_PREDICTION;

  const getRiskClass = (level) => {
    const l = String(level).toUpperCase();
    if (l.includes('LOW')) return 'risk-low';
    if (l.includes('MOD') || l.includes('MED')) return 'risk-moderate';
    return 'risk-high';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="ap-container"
    >
      {/* Header Banner */}
      <header className="ap-header">
        <div className="ap-header-title-group">
          <h1 className="ap-title">Predictive SGPA Early-Warning System</h1>
          <span className="ap-badge-predictor">
            <Sparkles size={13} />
            3-WEEK PRE-EXAM PREDICTOR
          </span>
        </div>
        <p className="ap-subtitle">
          AI performance forecasting based on internal evaluations, assignment trajectory, and live attendance metrics.
        </p>
      </header>

      {/* Main Grid */}
      <div className="ap-grid">
        {/* Left Column: Prediction Score & Metrics */}
        <div className="ap-left-column">
          {/* Card 1: Score Dial */}
          <div className="ap-card">
            <h3 className="ap-card-title">
              <Award size={18} className="ap-title-icon" />
              <span>Predicted Semester SGPA</span>
            </h3>

            <div className="ap-score-box">
              <div className="ap-score-val">{Number(predictedSGPA).toFixed(2)}</div>
              <div className="ap-score-sub">
                Predicted CGPA: <span className="text-white">{Number(predictedCGPA).toFixed(2)}</span>
              </div>
              <span className={`ap-risk-pill ${getRiskClass(riskLevel)}`}>
                {riskLevel}
              </span>
            </div>

            <div className="ap-recommendation-box">
              <p className="ap-recommendation-text">
                {recommendationSummary}
              </p>
            </div>
          </div>

          {/* Card 2: Evaluation Metrics */}
          <div className="ap-card">
            <h3 className="ap-card-title">
              <TrendingUp size={18} className="ap-title-icon" />
              <span>Evaluation Metrics</span>
            </h3>

            <div className="ap-metrics-list">
              {/* Metric 1 */}
              <div className="ap-metric-group">
                <div className="ap-metric-header-row">
                  <span className="ap-metric-label">CAT 1 / Internal Average</span>
                  <span className="ap-metric-val val-emerald">{cat1Average}%</span>
                </div>
                <div className="ap-progress-track">
                  <div
                    className="ap-progress-fill fill-emerald"
                    style={{ width: `${Math.min(100, Math.max(0, cat1Average))}%` }}
                  />
                </div>
              </div>

              {/* Metric 2 */}
              <div className="ap-metric-group">
                <div className="ap-metric-header-row">
                  <span className="ap-metric-label">CAT 2 / Model Average</span>
                  <span className="ap-metric-val val-blue">{cat2Average}%</span>
                </div>
                <div className="ap-progress-track">
                  <div
                    className="ap-progress-fill fill-blue"
                    style={{ width: `${Math.min(100, Math.max(0, cat2Average))}%` }}
                  />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="ap-metric-group">
                <div className="ap-metric-header-row">
                  <span className="ap-metric-label">Attendance Rate</span>
                  <span className="ap-metric-val val-red">{attendancePercentage}%</span>
                </div>
                <div className="ap-progress-track">
                  <div
                    className="ap-progress-fill fill-red"
                    style={{ width: `${Math.min(100, Math.max(0, attendancePercentage))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 14-Day AI Personalized Study Intervention Plan */}
        <div className="ap-card ap-plan-card">
          <h3 className="ap-card-title">
            <BookOpen size={18} className="ap-title-icon" />
            <span>14-Day AI Personalized Study Intervention Plan</span>
          </h3>

          <div className="ap-plan-list">
            {aiInterventionPlan.map((step, idx) => (
              <div key={idx} className="ap-plan-item">
                <div className="ap-plan-top-row">
                  <span className="ap-plan-day-badge">{step.day}</span>
                  <h4 className="ap-plan-focus">{step.focus}</h4>
                </div>
                <div className="ap-plan-action-row">
                  <span className="ap-plan-arrow">→</span>
                  <p className="ap-plan-action">{step.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}


import React from 'react';
import '../styles/Metrics.css';

export default function Metrics({ scans = [], interviews = [], skillChecklist = [] }) {
  const averageMatch = scans.length
    ? scans.reduce((total, scan) => total + Number(scan.score || 0), 0) / scans.length
    : null;
  const openSkillGaps = skillChecklist.filter((item) => !item.completed).length;
  const completedSkillGaps = skillChecklist.length - openSkillGaps;
  const skillCompletionScore = skillChecklist.length
    ? Math.round((completedSkillGaps / skillChecklist.length) * 100)
    : 0;
  const interviewScore = Math.min(interviews.length * 15, 30);
  const readinessIndex = averageMatch === null
    ? 0
    : Math.round((averageMatch * 0.7) + (skillCompletionScore * 0.2) + interviewScore);

  const matchValue = averageMatch === null ? 'N/A' : `${averageMatch.toFixed(1)}%`;
  const interviewsCount = interviews.length;
  const gapsValue = `${openSkillGaps} ${openSkillGaps === 1 ? 'Skill' : 'Skills'}`;
  const readinessValue = `${Math.min(readinessIndex, 100)}%`;

  return (
    <div className="db-metrics-row animate-fade-in">
      <div className="glass-card db-metric-card">
        <div className="db-metric-icon">
          <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div className="metric-data">
          <span className="metric-label">Average Match</span>
          <span className="metric-value" style={{ color: 'var(--secondary)' }}>{matchValue}</span>
        </div>
      </div>

      <div className="glass-card db-metric-card">
        <div className="db-metric-icon" style={{ backgroundColor: '#EEF2FF', borderColor: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
          <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </div>
        <div className="metric-data">
          <span className="metric-label">Interviews Taken</span>
          <span className="metric-value" style={{ color: '#6366F1' }}>{interviewsCount} {interviewsCount === 1 ? 'Session' : 'Sessions'}</span>
        </div>
      </div>

      <div className="glass-card db-metric-card">
        <div className="db-metric-icon" style={{ backgroundColor: '#FFFBEB', borderColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
          <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="metric-data">
          <span className="metric-label">Skill Gaps Open</span>
          <span className="metric-value" style={{ color: 'var(--warning)' }}>{gapsValue}</span>
        </div>
      </div>

      <div className="glass-card db-metric-card">
        <div className="db-metric-icon" style={{ backgroundColor: '#ECFDF5', borderColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)' }}>
          <svg style={{ width: 22, height: 22 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="metric-data">
          <span className="metric-label">Readiness Index</span>
          <span className="metric-value" style={{ color: 'var(--primary)' }}>{readinessValue}</span>
        </div>
      </div>
    </div>
  );
}

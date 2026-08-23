import React from 'react';
import '../styles/ResumeScore.css';

export default function ResumeScore({ selectedFile, isAnalyzed }) {
  if (!selectedFile) {
    return (
      <div className="glass-card empty-state-container animate-fade-in">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h3>No Resume Uploaded Yet</h3>
        <p>Please upload your resume in the Resume Upload tab to check your ATS Fit Score.</p>
      </div>
    );
  }

  if (!isAnalyzed) {
    return (
      <div className="glass-card empty-state-container animate-fade-in">
        <svg className="empty-icon text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>Analysis Pending</h3>
        <p>Your resume "{selectedFile.name}" is uploaded. Please click "Analyze Resume" in the upload panel to see the scores.</p>
      </div>
    );
  }

  return (
    <div className="score-container animate-fade-in">
      <div className="score-header-row">
        {/* Total Score Circle */}
        <div className="glass-card total-score-card">
          <div className="score-ring">
            <span className="score-number">84%</span>
            <span className="score-label">ATS score</span>
          </div>
          <div className="score-verdict">
            <h4>Good Fit Potential</h4>
            <p>Your document ranks better than 82% of developers in our reference database.</p>
          </div>
        </div>

        {/* Scoring Breakdown List */}
        <div className="glass-card score-breakdown-card">
          <h3 className="card-title">Scoring Category Breakdown</h3>
          <div className="breakdown-list">
            <div className="breakdown-item">
              <div className="breakdown-info">
                <span>Keywords Alignment</span>
                <strong>88/100</strong>
              </div>
              <div className="breakdown-progress-bg"><div className="breakdown-progress-fill" style={{ width: '88%' }}></div></div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-info">
                <span>Experience Relevance</span>
                <strong>78/100</strong>
              </div>
              <div className="breakdown-progress-bg"><div className="breakdown-progress-fill" style={{ width: '78%' }}></div></div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-info">
                <span>Impact & Action Verbs</span>
                <strong>85/100</strong>
              </div>
              <div className="breakdown-progress-bg"><div className="breakdown-progress-fill" style={{ width: '85%' }}></div></div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-info">
                <span>Formatting & Structure</span>
                <strong>92/100</strong>
              </div>
              <div className="breakdown-progress-bg"><div className="breakdown-progress-fill" style={{ width: '92%' }}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="score-row mt-4">
        <div className="glass-card flex-1 score-detail-card bg-success-light-border">
          <h4 className="score-detail-title text-success">Key Strengths</h4>
          <ul className="score-detail-list">
            <li>Strong action verbs (e.g., "Led", "Optimized", "Designed") are well utilized.</li>
            <li>Education section contains clear graduation credentials and degree paths.</li>
            <li>Summary statement provides an indexable hook showing years of React/Python experience.</li>
          </ul>
        </div>

        <div className="glass-card flex-1 score-detail-card bg-danger-light-border">
          <h4 className="score-detail-title text-danger">Areas for Improvement</h4>
          <ul className="score-detail-list">
            <li>Lacks mentions of container orchestration (Docker/Kubernetes).</li>
            <li>No AWS or cloud credentials matching standard DevOps pipeline profiles.</li>
            <li>LinkedIn profile link missing in top contact header.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

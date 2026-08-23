import React, { useState } from 'react';
import '../styles/SkillGapAnalysis.css';

export default function SkillGapAnalysis({ selectedFile }) {
  const [jobDescription, setJobDescription] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleCompare = (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsComparing(true);
    setShowResults(false);

    setTimeout(() => {
      setIsComparing(false);
      setShowResults(true);
    }, 1200);
  };

  if (!selectedFile) {
    return (
      <div className="glass-card empty-state-container animate-fade-in">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h3>No Resume Uploaded Yet</h3>
        <p>Please upload your resume in the Resume Upload tab to run comparative skill gap analysis.</p>
      </div>
    );
  }

  return (
    <div className="gap-container animate-fade-in">
      <div className="glass-card gap-form-card">
        <h3 className="card-title">Job Description Matching Analyzer</h3>
        <p className="card-subtitle">Paste the target Job Description (JD) text below to compare skills and locate missing keywords.</p>
        <form onSubmit={handleCompare} className="gap-form">
          <textarea
            className="form-input gap-textarea"
            rows="6"
            placeholder="Paste target job role details, expectations, or skill lists here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <button type="submit" className="btn-primary gap-submit-btn" disabled={isComparing || !jobDescription.trim()}>
            {isComparing ? 'Running Alignment Engine...' : 'Compare Resume with JD'}
          </button>
        </form>
      </div>

      {showResults && (
        <div className="gap-results-container animate-fade-in">
          <div className="results-grid">
            {/* Matching Keywords */}
            <div className="glass-card gap-result-card border-success">
              <h4 className="result-title text-success">Matching Keywords Found</h4>
              <div className="keyword-badges">
                <span className="keyword-badge match">React.js</span>
                <span className="keyword-badge match">JavaScript (ES6+)</span>
                <span className="keyword-badge match">State Management</span>
                <span className="keyword-badge match">RESTful APIs</span>
                <span className="keyword-badge match">Git Version Control</span>
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="glass-card gap-result-card border-warning">
              <h4 className="result-title text-warning">Missing Skill Gaps (Required)</h4>
              <div className="keyword-badges">
                <span className="keyword-badge gap">Docker Containerization</span>
                <span className="keyword-badge gap">CI/CD Pipelines</span>
                <span className="keyword-badge gap">AWS Cloud Deployment</span>
                <span className="keyword-badge gap">TypeScript type-safety</span>
              </div>
            </div>
          </div>

          {/* Actionable Suggestions */}
          <div className="glass-card gap-action-card mt-4">
            <h4 className="action-title">Actionable Recommendation to close Gaps:</h4>
            <div className="suggestion-box">
              <p><strong>Experience revision example (add to project details):</strong></p>
              <blockquote>
                "Designed and implemented automated <strong>CI/CD pipelines</strong> using GitHub Actions to containerize React client builds with <strong>Docker</strong>, deploying builds directly into <strong>AWS ECS cloud services</strong>."
              </blockquote>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import '../styles/Greeting.css';

export default function Greeting({
  user,
  selectedFile,
  isAnalyzed,
  onAnalyzeResume,
  onPracticeInterview
}) {
  const getSubtitleText = () => {
    if (!selectedFile) {
      return 'Build your interview readiness with AI-powered resume analysis and mock interviews.';
    }

    if (!isAnalyzed) {
      return `Your resume "${selectedFile.name}" is ready. Choose a target role or company to start personalized analysis.`;
    }

    return 'Your career workspace is ready. Review your skill gaps, improve your resume, or practice a targeted interview.';
  };

  return (
    <div className="db-greeting animate-fade-in">
      <div className="greeting-content">
        <span className="dashboard-feature-badge">AI Career Intelligence</span>
        <h1 className="db-greeting-title">
          Welcome back, {user?.name || 'Candidate'}
        </h1>
        <p className="db-greeting-subtitle">{getSubtitleText()}</p>
        <div className="db-greeting-actions">
          <button type="button" className="btn-primary" onClick={onAnalyzeResume}>
            Analyze Resume
          </button>
          <button type="button" className="btn-secondary" onClick={onPracticeInterview}>
            Start AI Interview
          </button>
        </div>
      </div>

    </div>
  );
}
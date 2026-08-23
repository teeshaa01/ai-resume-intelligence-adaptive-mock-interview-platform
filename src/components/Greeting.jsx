import React from 'react';
import '../styles/Greeting.css';

export default function Greeting({ user, selectedFile, isAnalyzed }) {
  const getSubtitleText = () => {
    if (!selectedFile) {
      return "Welcome! Upload your resume in the Resume Upload tab to start tracking your ATS fit index, identifying skill gaps, and practicing customized mock interviews.";
    }
    if (!isAnalyzed) {
      return `Resume "${selectedFile.name}" is uploaded. Run the analyzer in the Resume Upload panel to evaluate your score.`;
    }
    return "Resume analysis complete. Check the ATS Analysis and Resume Score panels to review optimization tips and key checklist items.";
  };

  return (
    <div className="db-greeting animate-fade-in">
      <h1 className="db-greeting-title">Welcome back, {user.name || 'Candidate'}</h1>
      <p className="db-greeting-subtitle">
        {getSubtitleText()}
      </p>
    </div>
  );
}

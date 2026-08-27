import React from 'react';
import '../styles/Greeting.css';

export default function Greeting({ user, selectedFile, isAnalyzed }) {
  const getSubtitleText = () => {
    if (!selectedFile) {
      return "Welcome! Choose ATS Checker, Job Match, Tech Interview, or HR Interview from the sidebar and upload your resume inside that dedicated panel.";
    }
    if (!isAnalyzed) {
      return `Resume "${selectedFile.name}" is uploaded. Run the action button in the current panel to continue.`;
    }
    return "Workspace action complete. Review the generated result in the current panel.";
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

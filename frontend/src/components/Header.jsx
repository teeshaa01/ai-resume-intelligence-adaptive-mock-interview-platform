import React from 'react';
import '../styles/Header.css';

export default function Header({
  activeTab,
  isSidebarOpen,
  setIsSidebarOpen
}) {
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Dashboard Overview';
      case 'ats_checker':
        return 'ATS Resume Checker';
      case 'job_match':
        return 'Job Match Analysis';
      case 'tech_interview':
        return 'Tech Interview Practice';
      case 'hr_interview':
        return 'HR & Behavioral Interview Practice';
      case 'settings':
        return 'Profile Settings';
      default:
        return 'ResuIntel Platform';
    }
  };

  return (
    <header className="db-header">
      <div className="header-title-group">
        <button className="toggle-sidebar-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h2 className="header-title">{getHeaderTitle()}</h2>
      </div>

      <div className="header-actions">
        <span className="badge badge-success status-badge">
          <span className="status-pulse" /> System Online
        </span>
      </div>
    </header>
  );
}

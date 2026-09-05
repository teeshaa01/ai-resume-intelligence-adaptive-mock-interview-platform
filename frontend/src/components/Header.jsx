import React from 'react';
import '../styles/Header.css';

export default function Header({
  activeTab,
  selectedAnalysisMode,
  isSidebarOpen,
  setIsSidebarOpen
}) {
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Dashboard Overview';
      case 'ats_checker':
        return 'AI ATS Resume Analyzer';
      case 'job_match':
        return selectedAnalysisMode === 'company'
          ? 'Company Based Preparation'
          : 'Role Based Preparation';
      case 'tech_interview':
        return 'AI Technical Interview';
      case 'hr_interview':
        return 'AI HR & Behavioral Interview';
      case 'settings':
        return 'Profile Settings';
      case 'admin_users':
        return 'User Management';
      default:
        return 'ResuIntel Career Intelligence';
    }
  };

  return (
    <header className="db-header">
      <div className="header-title-group">
        <button
          type="button"
          className="toggle-sidebar-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <svg
            style={{ width: 20, height: 20 }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <h2 className="header-title">{getHeaderTitle()}</h2>
          {activeTab === 'job_match' && (
            <span className="header-subtitle">
              Personalized career preparation
            </span>
          )}
        </div>
      </div>

      <div className="header-actions">
        <span className="badge badge-success status-badge">
          <span className="status-pulse" />
          AI Engine Online
        </span>
      </div>
    </header>
  );
}
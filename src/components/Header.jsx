import React, { useState } from 'react';
import '../styles/Header.css';

export default function Header({
  activeTab,
  isSidebarOpen,
  setIsSidebarOpen
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: 'ATS Score optimization report ready for Google JD scan.' },
    { id: 2, text: 'Recommended mock interview simulation unlocked.' }
  ];

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Dashboard Overview';
      case 'resume':
        return 'Resume Upload';
      case 'ats':
        return 'ATS Analysis';
      case 'score':
        return 'Resume Score';
      case 'skill_gap':
        return 'Skill Gap Analysis';
      case 'mock':
        return 'AI Mock Interview';
      case 'results':
        return 'Interview Results';
      case 'roadmap':
        return 'Learning Roadmap';
      case 'history':
        return 'History';
      case 'notifications':
        return 'Notifications';
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
        <div className="notif-bell" onClick={() => setShowNotifications(!showNotifications)}>
          <svg style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notif-dot" />

          {showNotifications && (
            <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="notif-header">Recent Notifications</div>
              <div className="notif-list">
                {notifications.map((n) => (
                  <div key={n.id} className="notif-item">
                    {n.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

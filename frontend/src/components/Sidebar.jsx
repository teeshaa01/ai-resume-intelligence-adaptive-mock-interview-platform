import React from 'react';
import UserProfile from './UserProfile';
import '../styles/Sidebar.css';

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
  user,
  onLogout
}) {
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    // Auto close sidebar on mobile screen widths
    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      )
    },
    {
      id: 'ats_checker',
      label: '01 ATS Checker',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    },
    {
      id: 'job_match',
      label: '02 Job Match',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: 'tech_interview',
      label: '03 Tech Interview',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      )
    },
    {
      id: 'hr_interview',
      label: '04 HR Interview',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Profile Settings',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="db-sidebar-overlay hide-on-desktop" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`db-sidebar ${isSidebarOpen ? '' : 'collapsed'}`} style={{ width: isSidebarOpen ? '260px' : '0px' }}>
        <div className="sidebar-header">
          <button className="sidebar-logo" onClick={() => handleNavClick('overview')}>
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            {isSidebarOpen && <span className="logo-text">Resu<span style={{ color: 'var(--primary)' }}>Intel</span></span>}
          </button>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <button 
              key={item.id}
              className="nav-item"
              style={{ 
                backgroundColor: activeTab === item.id ? '#F0FDF4' : 'transparent',
                color: activeTab === item.id ? 'var(--primary)' : 'var(--text-secondary)'
              }}
              onClick={() => handleNavClick(item.id)}
            >
              {item.icon}
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {isSidebarOpen && (
          <div className="sidebar-footer">
            <UserProfile user={user} onLogout={onLogout} />
          </div>
        )}
      </aside>
    </>
  );
}

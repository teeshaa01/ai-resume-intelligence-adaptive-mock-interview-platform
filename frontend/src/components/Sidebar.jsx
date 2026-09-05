import React, { useEffect, useState } from 'react';
import UserProfile from './UserProfile';
import '../styles/Sidebar.css';

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
  selectedFeature,
  setSelectedFeature,
  setSelectedAnalysisMode,
  user,
  onLogout
}) {
  const [isFeatureModesOpen, setIsFeatureModesOpen] = useState(true);
  const [isMockInterviewsOpen, setIsMockInterviewsOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'job_match' || activeTab === 'ats_checker') {
      setIsFeatureModesOpen(true);
    }
    if (activeTab === 'tech_interview' || activeTab === 'hr_interview') {
      setIsMockInterviewsOpen(true);
    }
  }, [activeTab]);

  const handleNavClick = (tab) => {
    setActiveTab(tab);

    if (tab === 'tech_interview' || tab === 'hr_interview') {
      setIsMockInterviewsOpen(true);
    }

    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };

  const selectAnalysisFeature = (feature) => {
    setSelectedFeature(feature);
    setSelectedAnalysisMode(feature);
    setIsFeatureModesOpen(true);

    if (feature === 'ats') {
      setActiveTab('ats_checker');
    } else {
      setActiveTab('job_match');
    }

    if (window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      )
    },

    {
      id: 'tech_interview',
      label: 'Tech Interview',
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
      )
    },

    {
      id: 'hr_interview',
      label: 'HR Interview',
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },

    {
      id: 'admin_users',
      label: 'User Management (Admin)',
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      )
    },

    {
      id: 'settings',
      label: 'Profile Settings',
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {isSidebarOpen && (
        <div
          className="db-sidebar-overlay hide-on-desktop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`db-sidebar ${
          isSidebarOpen ? '' : 'collapsed'
        }`}
        style={{
          width: isSidebarOpen ? '260px' : '0px'
        }}
      >

        <div className="sidebar-header">

          <button
            className="sidebar-logo"
            onClick={() => handleNavClick('overview')}
          >

            <svg
              className="logo-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>

            {isSidebarOpen && (
              <span className="logo-text">
                Resu<span style={{ color: 'var(--primary)' }}>
                  Intel
                </span>
              </span>
            )}

          </button>

        </div>

        <nav className="nav-menu">

          {/* Dashboard */}
          <button
            type="button"
            className="nav-item"
            style={{
              backgroundColor:
                activeTab === 'overview'
                  ? '#F0FDF4'
                  : 'transparent',
              color:
                activeTab === 'overview'
                  ? 'var(--primary)'
                  : 'var(--text-secondary)'
            }}
            onClick={() => handleNavClick('overview')}
          >
            {navItems[0].icon}

            {isSidebarOpen && (
              <span>{navItems[0].label}</span>
            )}
          </button>

          {/* Resume Intelligence */}
          <button
            type="button"
            className="nav-item feature-modes-nav-item"
            style={{
              backgroundColor:
                activeTab === 'job_match' ||
                activeTab === 'ats_checker'
                  ? '#F0FDF4'
                  : 'transparent',

              color:
                activeTab === 'job_match' ||
                activeTab === 'ats_checker'
                  ? 'var(--primary)'
                  : 'var(--text-secondary)'
            }}
            onClick={() => {
              setIsFeatureModesOpen(
                !isFeatureModesOpen
              );
            }}
          >

            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="4"
                rx="1"
              />
              <rect
                x="3"
                y="10"
                width="18"
                height="4"
                rx="1"
              />
              <rect
                x="3"
                y="16"
                width="18"
                height="4"
                rx="1"
              />
            </svg>

            {isSidebarOpen && (
              <>
                <span>Resume Intelligence</span>

                <span className="feature-modes-chevron">
                  {isFeatureModesOpen ? '⌄' : '›'}
                </span>
              </>
            )}

          </button>

          {/* Feature Modes */}
          {isSidebarOpen && isFeatureModesOpen && (
            <div className="feature-modes-subnav">

              <button
                type="button"
                className={`feature-mode-subnav-item ${
                  selectedFeature === 'role'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  selectAnalysisFeature('role')
                }
              >
                <span className="feature-subnav-icon">
                  🎯
                </span>

                <span>
                  <strong>Role Based</strong>
                  <small>
                    Target a specific job role
                  </small>
                </span>
              </button>

              <button
                type="button"
                className={`feature-mode-subnav-item ${
                  selectedFeature === 'company'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  selectAnalysisFeature('company')
                }
              >
                <span className="feature-subnav-icon">
                  🏢
                </span>

                <span>
                  <strong>Company Based</strong>
                  <small>
                    Prepare for a company
                  </small>
                </span>
              </button>

              <button
                type="button"
                className={`feature-mode-subnav-item ${
                  selectedFeature === 'ats'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  selectAnalysisFeature('ats')
                }
              >
                <span className="feature-subnav-icon">
                  📄
                </span>

                <span>
                  <strong>ATS Checker</strong>
                  <small>
                    Optimize your resume
                  </small>
                </span>
              </button>

            </div>
          )}

          {/* Mock Interviews */}
          <button
            type="button"
            className="nav-item feature-modes-nav-item"
            style={{
              backgroundColor:
                activeTab === 'tech_interview' || activeTab === 'hr_interview'
                  ? '#F0FDF4'
                  : 'transparent',
              color:
                activeTab === 'tech_interview' || activeTab === 'hr_interview'
                  ? 'var(--primary)'
                  : 'var(--text-secondary)'
            }}
            onClick={() => setIsMockInterviewsOpen(!isMockInterviewsOpen)}
          >
            <span className="nav-icon" aria-hidden="true">💬</span>
            {isSidebarOpen && (
              <>
                <span>Mock Interviews</span>
                <span className="feature-modes-chevron">
                  {isMockInterviewsOpen ? '⌄' : '›'}
                </span>
              </>
            )}
          </button>

          {isSidebarOpen && isMockInterviewsOpen && (
            <div className="feature-modes-subnav">
              {navItems.slice(1, 3).map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`feature-mode-subnav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="feature-subnav-icon">
                    {item.id === 'tech_interview' ? '💻' : '💬'}
                  </span>
                  <span><strong>{item.label === 'Tech Interview' ? 'Technical Interview' : item.label}</strong><small>{item.id === 'tech_interview' ? 'Practice technical questions' : 'Practice behavioral questions'}</small></span>
                </button>
              ))}
            </div>
          )}

          {/* Settings and admin */}
          {navItems.slice(3).filter(item => item.id !== 'admin_users' || user?.role === 'admin').map(item => (
            <button
              key={item.id}
              type="button"
              className="nav-item"
              style={{
                backgroundColor:
                  activeTab === item.id
                    ? '#F0FDF4'
                    : 'transparent',

                color:
                  activeTab === item.id
                    ? 'var(--primary)'
                    : 'var(--text-secondary)'
              }}
              onClick={() =>
                handleNavClick(item.id)
              }
            >
              {item.icon}

              {isSidebarOpen && (
                <span>{item.label}</span>
              )}
            </button>
          ))}

        </nav>

        {isSidebarOpen && (
          <div className="sidebar-footer">
            <UserProfile
              user={user}
              onLogout={onLogout}
            />
          </div>
        )}

      </aside>
    </>
  );
}
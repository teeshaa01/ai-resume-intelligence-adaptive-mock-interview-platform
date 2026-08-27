import React from 'react';
import '../styles/UserProfile.css';

export default function UserProfile({ user, onLogout }) {
  return (
    <div className="user-profile-card">
      <div className="user-avatar">
        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
      </div>
      <div className="user-info">
        <span className="user-name">{user.name || 'User'}</span>
        <span className="user-email">{user.email || 'user@gmail.com'}</span>
      </div>
      <button className="logout-btn" onClick={onLogout} title="Logout">
        <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  );
}

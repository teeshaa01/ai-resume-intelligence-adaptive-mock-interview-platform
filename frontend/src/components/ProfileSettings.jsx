import React, { useState } from 'react';
import '../styles/ProfileSettings.css';

export default function ProfileSettings({ user, onUpdateUser }) {
  const [name, setName] = useState(user.name || 'Alex Candidate');
  const [email, setEmail] = useState(user.email || 'candidate@gmail.com');
  const [targetRole, setTargetRole] = useState('Frontend Engineer');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateUser({
      name,
      email
    });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2500);
  };

  return (
    <div className="settings-container animate-fade-in">
      <div className="glass-card settings-card">
        <h3 className="card-title">Profile Settings</h3>
        <p className="card-subtitle">Manage your ResuIntel identity details, emails, and target job description preferences.</p>
        
        {showSuccess && (
          <div className="badge-success animate-fade-in mb-4" style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Role Profile</label>
              <input
                type="text"
                className="form-input"
                value={targetRole}
                placeholder="e.g. Frontend React Engineer"
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary settings-submit-btn">
            Save Settings Changes
          </button>
        </form>
      </div>
    </div>
  );
}

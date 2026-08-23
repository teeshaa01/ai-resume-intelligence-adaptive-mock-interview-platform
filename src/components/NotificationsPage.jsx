import React, { useState } from 'react';
import '../styles/NotificationsPage.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'ATS Score optimization report ready for Google JD scan.', category: 'Report', date: '10 mins ago', read: false },
    { id: 2, text: 'Recommended mock interview simulation unlocked.', category: 'Recommendation', date: '2 hours ago', read: false },
    { id: 3, text: 'Welcome to ResuIntel! Upload your first resume to scan matching credentials.', category: 'System', date: '1 day ago', read: true }
  ]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleToggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="notif-page-container animate-fade-in">
      <div className="glass-card notif-page-card">
        <div className="notif-page-header">
          <div>
            <h3 className="card-title">All Notifications</h3>
            <p className="card-subtitle">Manage system events, reports, and learning path alerts.</p>
          </div>
          <button className="btn-secondary" onClick={handleMarkAllRead}>
            Mark All as Read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="notif-page-empty">No notifications to display.</div>
        ) : (
          <div className="notif-page-list mt-4">
            {notifications.map((n) => (
              <div key={n.id} className={`notif-page-item ${n.read ? 'read' : 'unread'}`}>
                <div className="notif-dot-col">
                  {!n.read && <span className="notif-unread-dot"></span>}
                </div>
                
                <div className="notif-content-col">
                  <div className="notif-meta-row">
                    <span className="notif-category-tag">{n.category}</span>
                    <span className="notif-date-tag">{n.date}</span>
                  </div>
                  <p className="notif-text">{n.text}</p>
                </div>

                <div className="notif-actions-col">
                  <button className="notif-action-btn" onClick={() => handleToggleRead(n.id)} title={n.read ? "Mark as Unread" : "Mark as Read"}>
                    {n.read ? 'Unread' : 'Read'}
                  </button>
                  <button className="notif-action-btn delete" onClick={() => handleDelete(n.id)} title="Delete">
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

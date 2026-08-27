import React from 'react';
import '../styles/RecentScans.css';

export default function RecentScans({ recentScans = [], onDeleteScan }) {
  if (recentScans.length === 0) {
    return (
      <div className="glass-card db-table-card animate-fade-in" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <svg style={{ width: 44, height: 44, color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>No Resume Uploaded Yet</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Scan logs will populate here once you analyze a document.</p>
      </div>
    );
  }

  return (
    <div className="glass-card db-table-card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title">Recent Resume Screenings</h3>
        <span className="badge badge-primary">Dynamic Scoring</span>
      </div>
      <div className="table-wrapper">
        <table className="db-table">
          <thead>
            <tr>
              <th>Target Company</th>
              <th>Job Role</th>
              <th>Date Scanned</th>
              <th>ATS Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentScans.map((scan) => (
              <tr key={scan.id}>
                <td><strong>{scan.company}</strong></td>
                <td>{scan.role}</td>
                <td>{scan.date}</td>
                <td>
                  <span style={{
                    fontWeight: '700',
                    color: scan.score >= 85 ? 'var(--primary)' : scan.score >= 75 ? 'var(--secondary)' : 'var(--warning)'
                  }}>
                    {scan.score}%
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="scan-delete-btn"
                    onClick={() => onDeleteScan(scan.id)}
                    aria-label={`Delete scan for ${scan.role}`}
                    title="Delete scan"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

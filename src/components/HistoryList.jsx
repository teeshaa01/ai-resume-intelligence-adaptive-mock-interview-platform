import React from 'react';
import '../styles/HistoryList.css';

export default function HistoryList({ scans = [], interviews = [] }) {
  const sampleScans = [
    { id: 1, filename: 'React_Frontend_Developer_Alex.pdf', role: 'Frontend Engineer', date: '2026-07-27', score: 84 },
    { id: 2, filename: 'Fullstack_Dev_Alex.pdf', role: 'Fullstack Engineer', date: '2026-07-20', score: 76 }
  ];

  const activeScans = scans.length > 0 ? scans : sampleScans;

  return (
    <div className="history-container animate-fade-in">
      {/* Resume Scan History */}
      <div className="glass-card history-card">
        <h3 className="card-title">Resume Screening Logs</h3>
        {activeScans.length === 0 ? (
          <div className="history-empty">No resume screenings completed yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Target Role</th>
                  <th>Date Analyzed</th>
                  <th>ATS Fit Score</th>
                </tr>
              </thead>
              <tbody>
                {activeScans.map((scan) => (
                  <tr key={scan.id}>
                    <td><code>{scan.filename}</code></td>
                    <td>{scan.role}</td>
                    <td>{scan.date}</td>
                    <td>
                      <strong style={{ color: scan.score >= 80 ? 'var(--primary)' : 'var(--warning)' }}>
                        {scan.score}%
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mock Interview History */}
      <div className="glass-card history-card mt-4">
        <h3 className="card-title">Mock Interview History</h3>
        {interviews.length === 0 ? (
          <div className="history-empty">No mock interview sessions recorded yet. Complete a simulator test to populate this grid.</div>
        ) : (
          <div className="table-wrapper">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Profile Role</th>
                  <th>Date Completed</th>
                  <th>Overall Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((int) => (
                  <tr key={int.id}>
                    <td><strong>{int.role}</strong></td>
                    <td>{int.date}</td>
                    <td><strong>{int.score}%</strong></td>
                    <td>
                      <span className="badge badge-success">Evaluated</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

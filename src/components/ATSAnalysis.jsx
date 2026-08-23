import React from 'react';
import '../styles/ATSAnalysis.css';

export default function ATSAnalysis({ selectedFile, isAnalyzed }) {
  if (!selectedFile) {
    return (
      <div className="glass-card empty-state-container animate-fade-in">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <h3>No Resume Uploaded Yet</h3>
        <p>Please upload your resume in the Resume Upload tab to run deep ATS parsing scans.</p>
      </div>
    );
  }

  if (!isAnalyzed) {
    return (
      <div className="glass-card empty-state-container animate-fade-in">
        <svg className="empty-icon text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>Analysis Pending</h3>
        <p>Your resume "{selectedFile.name}" is uploaded. Please click "Analyze Resume" in the upload panel to see the results.</p>
      </div>
    );
  }

  return (
    <div className="ats-container animate-fade-in">
      <div className="ats-row">
        {/* Formatting Panel */}
        <div className="glass-card ats-card flex-1">
          <h3 className="card-title">Document Formatting Check</h3>
          <div className="ats-list">
            <div className="ats-item status-success">
              <span className="status-indicator">✓</span>
              <div>
                <span className="ats-item-title">Standard Section Headings</span>
                <p className="ats-item-desc">Parser successfully detected standard headers: "Experience", "Skills", "Education".</p>
              </div>
            </div>
            <div className="ats-item status-success">
              <span className="status-indicator">✓</span>
              <div>
                <span className="ats-item-title">Font Consistency</span>
                <p className="ats-item-desc">Consistent, system-readable sans-serif fonts used throughout the document.</p>
              </div>
            </div>
            <div className="ats-item status-warning">
              <span className="status-indicator">!</span>
              <div>
                <span className="ats-item-title">Multi-Column Layout Flag</span>
                <p className="ats-item-desc">A two-column table structure was detected. Some older enterprise parsers may experience reading-order issues.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Readability Panel */}
        <div className="glass-card ats-card flex-1">
          <h3 className="card-title">Readability & Structure Metrics</h3>
          <div className="metric-bars">
            <div className="metric-bar-group">
              <div className="metric-label-row">
                <span>Gunning Fog Index</span>
                <strong>Grade 10.5 (Ideal)</strong>
              </div>
              <div className="metric-bg"><div className="metric-fill bg-success" style={{ width: '85%' }}></div></div>
            </div>
            <div className="metric-bar-group">
              <div className="metric-label-row">
                <span>Action Verb Density</span>
                <strong>High (14%)</strong>
              </div>
              <div className="metric-bg"><div className="metric-fill bg-success" style={{ width: '90%' }}></div></div>
            </div>
            <div className="metric-bar-group">
              <div className="metric-label-row">
                <span>Contact Details Parser Fit</span>
                <strong>Valid</strong>
              </div>
              <div className="metric-bg"><div className="metric-fill bg-success" style={{ width: '100%' }}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Parsing Logs */}
      <div className="glass-card ats-card mt-4">
        <h3 className="card-title">Semantic Parser Line-By-Line Logs</h3>
        <div className="log-panel">
          <div className="log-line"><code>[INFO] [09:35:12] Initializing semantic text block parser...</code></div>
          <div className="log-line"><code>[INFO] [09:35:12] Found active email: alex.candidate@gmail.com</code></div>
          <div className="log-line"><code>[INFO] [09:35:13] Mapping experience history nodes: 3 companies identified.</code></div>
          <div className="log-line"><code>[WARN] [09:35:13] Floating container identified. Table layout mapped to single block.</code></div>
          <div className="log-line"><code>[INFO] [09:35:13] Parser indexing completed successfully. Ready for matching calculations.</code></div>
        </div>
      </div>
    </div>
  );
}

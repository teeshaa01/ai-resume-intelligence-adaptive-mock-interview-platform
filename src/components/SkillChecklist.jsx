import React from 'react';
import '../styles/SkillChecklist.css';

export default function SkillChecklist({ skillChecklist = [], onToggleSkill }) {
  if (skillChecklist.length === 0) {
    return (
      <div className="glass-card db-side-card animate-fade-in" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <svg style={{ width: 44, height: 44, color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>No Skill Gaps Identified</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Your adaptive revision checklist will load here after analysis.</p>
      </div>
    );
  }

  return (
    <div className="glass-card db-side-card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title">Adaptive Revision Checklist</h3>
        <span className="badge badge-success">Personalized</span>
      </div>
      <div className="db-checklist">
        {skillChecklist.map((item) => (
          <div key={item.id} className="db-checklist-item">
            <input 
              type="checkbox" 
              checked={item.completed} 
              onChange={() => onToggleSkill && onToggleSkill(item.id)} 
              className="db-checkbox"
            />
            <div className="checklist-meta">
              <span 
                className="checklist-text"
                style={{ 
                  textDecoration: item.completed ? 'line-through' : 'none',
                  opacity: item.completed ? 0.5 : 1 
                }}
              >
                {item.skill}
              </span>
              <span className="checklist-sub">
                Req: {item.source} &bull; <span style={{ color: item.priority === 'High' ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>{item.priority} priority</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

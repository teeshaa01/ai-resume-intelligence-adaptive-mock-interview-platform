import React from 'react';
import '../styles/SkillChecklist.css';

export default function SkillChecklist({
  skillChecklist = [],
  onToggleSkill,
  onDeleteSkill
}) {
  if (skillChecklist.length === 0) {
    return (
      <div className="glass-card db-side-card skill-empty-card animate-fade-in">

        <div className="skill-empty-icon">
          🎯
        </div>

        <h4>
          Build Your Skill Roadmap
        </h4>

        <p>
          Select a target role or company and run an analysis.
          ResuIntel will identify your missing skills and
          create a personalized preparation roadmap.
        </p>

        <div className="skill-empty-actions">
          <span>Skill Mapping</span>
          <span>Skill Gaps</span>
          <span>Interview Prep</span>
        </div>

      </div>
    );
  }

  const completedCount = skillChecklist.filter(
    item => item.completed
  ).length;

  const progress = Math.round(
    (completedCount / skillChecklist.length) * 100
  );

  return (
    <div className="glass-card db-side-card animate-fade-in">

      <div className="card-header">

        <div>
          <h3 className="card-title">
            Your Skill Gap Roadmap
          </h3>

          <p className="skill-progress-text">
            {completedCount} of {skillChecklist.length} completed
          </p>
        </div>

        <span className="badge badge-success">
          {progress}%
        </span>

      </div>

      <div className="skill-roadmap-progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="db-checklist">

        {skillChecklist.map((item) => (

          <div
            key={item.id}
            className={`db-checklist-item ${
              item.completed ? 'completed' : ''
            }`}
          >

            <input
              type="checkbox"
              checked={Boolean(item.completed)}
              onChange={() =>
                onToggleSkill &&
                onToggleSkill(item.id)
              }
              className="db-checkbox"
            />

            <div className="checklist-meta">

              <span className="checklist-text">
                {item.skill}
              </span>

              <span className="checklist-sub">

                {item.source && (
                  <>
                    Required for {item.source}
                    {' • '}
                  </>
                )}

                <span
                  className={
                    item.priority === 'High'
                      ? 'priority-high'
                      : item.priority === 'Medium'
                        ? 'priority-medium'
                        : 'priority-low'
                  }
                >
                  {item.priority || 'Medium'} priority
                </span>

              </span>

            </div>

            <button
              type="button"
              className="checklist-delete-btn"
              onClick={() =>
                onDeleteSkill &&
                onDeleteSkill(item.id)
              }
              aria-label={`Delete ${item.skill}`}
              title="Delete"
            >

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>

            </button>

          </div>

        ))}

      </div>

    </div>
  );
}
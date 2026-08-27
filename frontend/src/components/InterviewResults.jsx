import React, { useState } from 'react';
import '../styles/InterviewResults.css';

export default function InterviewResults({ results = [] }) {
  const [selectedResultIndex, setSelectedResultIndex] = useState(results.length > 0 ? 0 : -1);

  const sampleResults = [
    {
      id: 1,
      role: 'Frontend Developer',
      date: '2026-07-26',
      score: 85,
      answersList: [
        {
          question: 'Explain React 19 server actions and how they handle client form submission states.',
          answerText: 'React 19 server actions allow asynchronous code execution directly on the server without manual REST setups. Client state is managed with useActionState or useFormStatus hooks.'
        },
        {
          question: 'How does the virtual DOM reconciliation process differ between standard lists and keyed lists in React?',
          answerText: 'Standard lists require sequential checks, rendering all elements if indices shift. Keyed lists use unique identifier keys to quickly identify shifting elements, minimizing render cycles.'
        },
        {
          question: 'What are some main performance optimization methods when loading heavy component libraries?',
          answerText: 'Main options are dynamic code splitting, importing components selectively rather than as standard wildcards, and utilizing tree-shaking.'
        }
      ]
    }
  ];

  const activeResults = results.length > 0 ? results : sampleResults;
  const currentResult = selectedResultIndex >= 0 && activeResults[selectedResultIndex] ? activeResults[selectedResultIndex] : activeResults[0];

  if (activeResults.length === 0) {
    return (
      <div className="glass-card empty-state-container animate-fade-in">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h3>No Interview Sessions Evaluated Yet</h3>
        <p>Please generate questions in the Tech Interview or HR Interview panel to see practice sessions here.</p>
      </div>
    );
  }

  return (
    <div className="results-container animate-fade-in">
      <div className="results-sidebar-row">
        {/* Session history checklist on left */}
        <div className="glass-card results-history-card flex-1">
          <h3 className="card-title">Completed Simulations</h3>
          <div className="session-list">
            {activeResults.map((r, index) => (
              <button 
                key={r.id} 
                className={`session-btn-item ${currentResult.id === r.id ? 'active' : ''}`}
                onClick={() => setSelectedResultIndex(index)}
              >
                <div className="session-btn-info">
                  <span className="session-role">{r.role}</span>
                  <span className="session-date">{r.date}</span>
                </div>
                <span className="session-score">{r.score}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed feedback analysis on right */}
        {currentResult && (
          <div className="glass-card results-details-card flex-2">
            <div className="details-header">
              <div>
                <h3 className="card-title">{currentResult.role} Feedback Report</h3>
                <p className="card-subtitle">Completed on {currentResult.date}</p>
              </div>
              <div className="result-score-pill">
                <span className="score-num">{currentResult.score}%</span>
                <span className="score-sub">grade</span>
              </div>
            </div>

            <div className="rating-badges-row mt-4">
              <div className="rating-pill">
                <span>Technical Accuracy</span>
                <strong>Good (84%)</strong>
              </div>
              <div className="rating-pill">
                <span>Communication Depth</span>
                <strong>Moderate (78%)</strong>
              </div>
            </div>

            <div className="qa-feedback-section mt-4">
              <h4 className="qa-title">Question Breakdown & Evaluation</h4>
              <div className="qa-list">
                {currentResult.answersList.map((qa, index) => (
                  <div key={index} className="qa-item">
                    <div className="qa-question-box">
                      <strong>Q{index + 1}:</strong> {qa.question}
                    </div>
                    <div className="qa-answer-block user">
                      <strong>Your Answer:</strong>
                      <p>"{qa.answerText}"</p>
                    </div>
                    <div className="qa-answer-block model">
                      <strong>Model Suggestion:</strong>
                      <p>
                        Ensure you specify API handlers, state transition states (pending/success), and cite lifecycle hooks where applicable. Solid structure and references to modularity show deep seniority.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

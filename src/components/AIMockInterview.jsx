import React, { useState } from 'react';
import '../styles/AIMockInterview.css';

export default function AIMockInterview({ onAddInterviewResult }) {
  const [role, setRole] = useState('Frontend Developer');
  const [sessionState, setSessionState] = useState('selecting'); // selecting | loading | active
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const questions = {
    'Frontend Developer': [
      'Explain React 19 server actions and how they handle client form submission states.',
      'How does the virtual DOM reconciliation process differ between standard lists and keyed lists in React?',
      'What are some main performance optimization methods when loading heavy component libraries?'
    ],
    'Fullstack Engineer': [
      'Describe a typical FastAPI dependency injection database session setup.',
      'How would you manage cross-origin resource sharing (CORS) rules safely for an API hosting candidate data?',
      'Explain the difference between SQL indexing methods and PostgreSQL search indices.'
    ],
    'DevOps Engineer': [
      'What are the advantages of Docker multi-stage builds when optimizing client frontend bundles?',
      'How does Kubernetes resolve service discovery issues inside a standard pod deployment?',
      'Describe a secure CI/CD build configuration using vault tokens for credential safety.'
    ]
  };

  const handleGenerate = () => {
    setSessionState('loading');
    setTimeout(() => {
      setSessionState('active');
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setCurrentAnswer('');
    }, 1200);
  };

  const handleSubmitAnswer = (e) => {
    e.preventDefault();
    if (!currentAnswer.trim()) return;

    const newAnswers = [...answers, {
      question: questions[role][currentQuestionIndex],
      answerText: currentAnswer
    }];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < 2) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Completed, compute fake feedback and notify dashboard
      const score = Math.round(70 + Math.random() * 25);
      const date = new Date().toISOString().split('T')[0];
      
      const sessionResult = {
        id: Date.now(),
        role: role,
        date: date,
        score: score,
        answersList: newAnswers
      };
      
      onAddInterviewResult(sessionResult);
      setSessionState('completed_redirect');
    }
  };

  if (sessionState === 'selecting') {
    return (
      <div className="glass-card mock-setup-card animate-fade-in">
        <h3 className="card-title">AI Mock Interview Simulator</h3>
        <p className="card-subtitle">Select your target engineering profile below. Our engine will curate customized questions tailored to standard hiring boards.</p>
        
        <div className="setup-form-group">
          <label className="form-label">Target Role Profile</label>
          <select 
            className="form-input" 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Frontend Developer">Frontend Developer (React/JS)</option>
            <option value="Fullstack Engineer">Fullstack Engineer (FastAPI/React)</option>
            <option value="DevOps Engineer">DevOps Engineer (Docker/AWS)</option>
          </select>
        </div>

        <button className="btn-primary mock-btn mt-4" onClick={handleGenerate}>
          Generate Customized Mock Session
        </button>
      </div>
    );
  }

  if (sessionState === 'loading') {
    return (
      <div className="glass-card mock-loading-card animate-fade-in">
        <div className="landing-spinner"></div>
        <h4>Assembling Mock Question Guidelines</h4>
        <p>Curating 3 adaptive technical challenges designed to match {role} skill standards...</p>
      </div>
    );
  }

  if (sessionState === 'completed_redirect') {
    return (
      <div className="glass-card mock-setup-card animate-fade-in text-center">
        <svg className="success-icon animate-fade-in" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3>Session Complete!</h3>
        <p>Your answers have been indexed and graded. Click the button below to view your results feedback panel.</p>
        <button className="btn-primary mock-btn mt-4" onClick={() => window.location.reload()}>
          Finish Session
        </button>
      </div>
    );
  }

  return (
    <div className="mock-session-container animate-fade-in">
      <div className="glass-card mock-session-card">
        <div className="session-progress-header">
          <span>Question {currentQuestionIndex + 1} of 3</span>
          <span className="badge badge-primary">{role} Profile</span>
        </div>
        
        <div className="question-prompt-box">
          <p>{questions[role][currentQuestionIndex]}</p>
        </div>

        <form onSubmit={handleSubmitAnswer} className="session-form">
          <textarea
            className="form-input answer-textarea"
            rows="6"
            placeholder="Type your structured explanation answer here..."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary session-submit-btn" disabled={!currentAnswer.trim()}>
            {currentQuestionIndex === 2 ? 'Submit and Grade Test' : 'Submit and Next Question'}
          </button>
        </form>
      </div>
    </div>
  );
}

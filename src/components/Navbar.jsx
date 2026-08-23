import React from 'react';
import '../styles/Navbar.css';

export default function Navbar({ onLogin, onSignUp }) {
  return (
    <header className="navbar">
      <button className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg className="navbar-logo-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span className="navbar-logo-text">
          Resu<span className="navbar-logo-highlight">Intel</span>
        </span>
      </button>
      <div className="navbar-links">
        <button className="navbar-btn" onClick={onLogin}>
          Login
        </button>
        <button className="btn-primary navbar-signup-btn" onClick={onSignUp}>
          Sign Up Free
        </button>
      </div>
    </header>
  );
}

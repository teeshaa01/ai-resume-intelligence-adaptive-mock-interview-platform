import React, { useState } from 'react';
import '../styles/Auth.css';

export default function Auth({ initialMode = 'login', onAuthSuccess, onNavigateHome }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Field validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setGlobalError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setNameError('');
  };

  const handleQuickFill = () => {
    setEmail('candidate@gmail.com');
    setPassword('candidate123');
    setEmailError('');
    setPasswordError('');
    if (!isLogin) {
      setFullName('Alex Candidate');
      setConfirmPassword('candidate123');
      setNameError('');
      setConfirmPasswordError('');
    }
  };

  const validateFields = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setNameError('');
    setGlobalError('');

    if (!email) {
      setEmailError('Email address is required.');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address.');
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        setNameError('Full name is required.');
        isValid = false;
      }
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    setIsLoading(true);
    setGlobalError('');
    setSuccessMsg('');

    // Simulate Network Request
    setTimeout(() => {
      setIsLoading(false);

      if (!isLogin) {
        setSuccessMsg('Account created successfully. Logging you in...');
      } else {
        setSuccessMsg('Sign in successful. Redirecting...');
      }

      setTimeout(() => {
        onAuthSuccess({
          email,
          name: isLogin ? (email === 'candidate@gmail.com' ? 'Alex Candidate' : email.split('@')[0]) : fullName
        });
      }, 800);

    }, 1200);
  };

  const handleForgotPassword = () => {
    if (!email) {
      setEmailError('Please enter your email address to receive reset instructions.');
      return;
    }
    setEmailError('');
    alert(`Reset email simulated to ${email}. Check your inbox!`);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onAuthSuccess({
        email: 'google.candidate@gmail.com',
        name: 'Google Candidate'
      });
    }, 1000);
  };

  return (
    <div className="auth-container">
      {/* Brand Back Button */}
      <div className="auth-back-nav">
        <button className="auth-back-btn" onClick={onNavigateHome}>
          <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Home
        </button>
      </div>

      {/* Main Authentication Card */}
      <div className="glass-card auth-card">
        <div className="auth-card-header">
          <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to access your intelligence dashboard' : 'Join ResuIntel to scan resumes and practice interviews'}
          </p>
        </div>

        {globalError && <div className="auth-error-banner">{globalError}</div>}
        {successMsg && <div className="auth-success-banner">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className={`form-input ${nameError ? 'invalid' : ''}`}
                placeholder="Alex Candidate"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (e.target.value.trim()) setNameError('');
                }}
              />
              {nameError && <span className="form-error">{nameError}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className={`form-input ${emailError ? 'invalid' : ''}`}
              placeholder="candidate@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value) setEmailError('');
              }}
            />
            {emailError && <span className="form-error">{emailError}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input auth-password-input ${passwordError ? 'invalid' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) setPasswordError('');
                }}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg className="auth-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg className="auth-eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && <span className="form-error">{passwordError}</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className={`form-input ${confirmPasswordError ? 'invalid' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value === password) setConfirmPasswordError('');
                }}
              />
              {confirmPasswordError && <span className="form-error">{confirmPasswordError}</span>}
            </div>
          )}

          <div className="auth-options-row">
            <label className="auth-remember-me">
              <input 
                type="checkbox" 
                className="auth-remember-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember Me
            </label>
            {isLogin && (
              <button type="button" className="auth-forgot-link" onClick={handleForgotPassword}>
                Forgot Password?
              </button>
            )}
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-spinner-wrapper">
                <span className="animate-spin-slow auth-spinner" /> Authenticating...
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Register'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">or</span>
          <span className="auth-divider-line" />
        </div>

        <button className="auth-google-btn" onClick={handleGoogleLogin} disabled={isLoading}>
          <svg className="auth-google-icon" viewBox="0 0 488 512" fill="currentColor">
            <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
          </svg>
          Continue with Google
        </button>

        {/* Quick Fill Testing Assist */}
        <button className="btn-secondary auth-quickfill-btn" onClick={handleQuickFill}>
          Auto-Fill Demo Credentials
        </button>

        <div className="auth-toggle-container">
          <span className="auth-toggle-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button className="auth-toggle-link" onClick={toggleAuthMode}>
            {isLogin ? 'Register here' : 'Sign in here'}
          </button>
        </div>

        {!isLogin && (
          <p className="auth-verif-notice">
            Email verification will be available after backend integration.
          </p>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import '../styles/Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Auth({ initialMode = 'login', onAuthSuccess, onNavigateHome }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
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
    setIsResettingPassword(false);
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
    }

    if (!isLogin || isResettingPassword) {
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    setIsLoading(true);
    setGlobalError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      if (!isLogin) formData.append('full_name', fullName.trim());
      const response = await fetch(`${API_URL}/auth/${isLogin ? 'login' : 'signup'}`, { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Authentication failed.');
      localStorage.setItem('resuintel_auth_token', data.token);
      setSuccessMsg(isLogin ? 'Sign in successful.' : 'Account created successfully.');
      onAuthSuccess(data.user);
    } catch (error) {
      setGlobalError(error.message || 'Unable to connect to the authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setGlobalError('');
    setSuccessMsg('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!email) {
      setEmailError('Please enter your email address to reset your password.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setGlobalError('Password reset must be handled by an administrator.');
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
          <h2 className="auth-title">
            {isResettingPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="auth-subtitle">
            {isResettingPassword
              ? 'Create a new password for your existing account'
              : isLogin ? 'Sign in to access your intelligence dashboard' : 'Join ResuIntel to scan resumes and practice interviews'}
          </p>
        </div>

        {globalError && <div className="auth-error-banner">{globalError}</div>}
        {successMsg && <div className="auth-success-banner">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {!isLogin && !isResettingPassword && (
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

          {(!isLogin || isResettingPassword) && (
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

          {!isResettingPassword && (
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
          )}

          <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-spinner-wrapper">
                <span className="animate-spin-slow auth-spinner" /> Authenticating...
              </span>
            ) : (
              isResettingPassword ? 'Reset Password' : isLogin ? 'Sign In' : 'Register'
            )}
          </button>
        </form>

        <div className="auth-toggle-container">
          <span className="auth-toggle-text">
            {isResettingPassword ? 'Remember your password? ' : isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            className="auth-toggle-link"
            onClick={isResettingPassword ? () => {
              setIsResettingPassword(false);
              setPassword('');
              setConfirmPassword('');
              setGlobalError('');
              setSuccessMsg('');
            } : toggleAuthMode}
          >
            {isResettingPassword ? 'Back to sign in' : isLogin ? 'Register here' : 'Sign in here'}
          </button>
        </div>

        {!isLogin && !isResettingPassword && (
          <p className="auth-verif-notice">
            Email verification will be available after backend integration.
          </p>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/LandingPage.css';

export default function LandingPage({ onGetStarted, onLogin }) {
  const [demoState, setDemoState] = useState('idle'); // idle | scanning | completed
  const [demoScore, setDemoScore] = useState(0);
  const [scanStep, setScanStep] = useState('');

  const startDemoScan = () => {
    if (demoState === 'scanning') return;
    setDemoState('scanning');
    setDemoScore(0);
    setScanStep('Initializing parser...');
  };

  useEffect(() => {
    if (demoState !== 'scanning') return;

    let score = 0;
    const interval = setInterval(() => {
      score += 2;
      
      // Update log steps based on score progression
      if (score < 25) {
        setScanStep('Extracting PDF text structure...');
      } else if (score < 50) {
        setScanStep('Analyzing skill keywords and experience history...');
      } else if (score < 75) {
        setScanStep('Evaluating semantic similarity with Job Description...');
      } else {
        setScanStep('Finalizing Match Index rating...');
      }

      if (score >= 82) {
        clearInterval(interval);
        setDemoScore(82);
        setDemoState('completed');
      } else {
        setDemoScore(score);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [demoState]);

  return (
    <div className="landing-container">
      {/* Navbar component */}
      <Navbar onLogin={onLogin} onSignUp={onGetStarted} />

      {/* Hero Section */}
      <section className="landing-hero animate-fade-in">
        <div className="landing-hero-content">
          <div className="landing-tagline">
            <span className="badge badge-primary">
              <svg style={{ width: 12, height: 12, marginRight: 4 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Enterprise AI & Semantic Alignment
            </span>
          </div>
          <h1 className="landing-hero-title">
            Land Your Dream Job with <br />
            <span className="landing-hero-gradient">AI Resume Intelligence</span>
          </h1>
          <p className="landing-hero-subtitle">
            Optimize your resume for applicant tracking systems, identify critical skill gaps, and practice adaptive mock interviews tailored to your target job descriptions.
          </p>
          <div className="landing-hero-actions">
            <button className="btn-primary landing-cta-btn" onClick={onLogin}>
              Upload Resume
            </button>
            <button className="btn-secondary landing-secondary-btn" onClick={() => {
              const element = document.getElementById('demo-section');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}>
              Watch Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Scan Simulator Section */}
      <section id="demo-section" className="landing-demo animate-fade-in">
        <div className="glass-card landing-demo-card">
          <div className="landing-demo-layout">
            <div className="landing-demo-info">
              <span className="badge badge-success">Interactive Simulator</span>
              <h2 className="landing-demo-title">See the ATS Engine in Action</h2>
              <p className="landing-demo-text">
                Experience how our semantic matching engine structures and analyzes documents. Run the quick scan below to simulate parsing a resume against a target job role.
              </p>
              <button 
                className="btn-primary landing-demo-btn" 
                onClick={startDemoScan}
                disabled={demoState === 'scanning'}
              >
                {demoState === 'scanning' ? 'Running Analysis...' : demoState === 'completed' ? 'Analysis Complete' : 'Run Quick Scan'}
              </button>
            </div>

            <div className="landing-demo-visualizer">
              {demoState === 'idle' && (
                <div className="landing-demo-idle">
                  <svg className="landing-idle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <h4 className="landing-idle-title">Resume_Senior_Developer.pdf</h4>
                  <p className="landing-idle-text">Ready to run scan simulation. Click the button to start.</p>
                </div>
              )}

              {demoState === 'scanning' && (
                <div className="landing-demo-scanning">
                  <div className="landing-spinner" />
                  <span className="landing-scan-status-label">{scanStep}</span>
                  <div className="landing-progress-container">
                    <div className="landing-progress-bar" style={{ width: `${(demoScore / 82) * 100}%` }} />
                  </div>
                  <span className="landing-score-ticker">{demoScore}% Alignment</span>
                </div>
              )}

              {demoState === 'completed' && (
                <div className="landing-demo-completed">
                  <div className="landing-result-header">
                    <div className="landing-result-ring">
                      <span className="landing-result-score-text">{demoScore}%</span>
                      <span className="landing-result-score-sub">ATS Fit</span>
                    </div>
                  </div>
                  <div className="landing-result-details">
                    <div className="landing-result-row">
                      <span className="landing-result-check">✓</span>
                      <span className="landing-result-skill">FastAPI & REST architecture (Strong Match)</span>
                    </div>
                    <div className="landing-result-row">
                      <span className="landing-result-check">✓</span>
                      <span className="landing-result-skill">Python & SQL optimization (Strong Match)</span>
                    </div>
                    <div className="landing-result-row">
                      <span className="landing-result-cross">!</span>
                      <span className="landing-result-skill-missing">Missing Keywords: Docker, CI/CD, AWS Deployment</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-how-it-works">
        <div className="landing-section-header">
          <h2 className="landing-section-title">How it Works</h2>
          <p className="landing-section-subtitle">Follow three easy steps to optimize your application and get interview-ready.</p>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-num">1</div>
            <h3 className="how-step-title">Upload Resume</h3>
            <p className="how-step-desc">Drop your current PDF or Word resume. Our parser converts experience lines into structured profiles.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">2</div>
            <h3 className="how-step-title">Analyze Gaps</h3>
            <p className="how-step-desc">Enter your target job description. The AI calculates ATS match scores and suggests critical updates.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">3</div>
            <h3 className="how-step-title">Simulate Interviews</h3>
            <p className="how-step-desc">Practice custom mock sessions dynamically generated around identified gaps to build technical fluency.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-section-header">
          <h2 className="landing-section-title">Engineered to Make You Stand Out</h2>
          <p className="landing-section-subtitle">We combine state-of-the-art parsing models with intelligent state tracking to optimize your job application workflow.</p>
        </div>

        <div className="landing-features-grid">
          <div className="glass-card landing-feature-card">
            <div className="landing-feature-icon-container">
              <svg className="landing-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Resume Upload & Parsing</h3>
            <p className="landing-feature-desc">Drag and drop your PDF or DOCX file. Our engine extracts skills, work history, projects, and credentials in seconds.</p>
          </div>

          <div className="glass-card landing-feature-card">
            <div className="landing-feature-icon-container">
              <svg className="landing-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Semantic Match Score</h3>
            <p className="landing-feature-desc">Get real-time scoring metrics on skill matching, experience grading, and instantly highlight keyword discrepancies.</p>
          </div>

          <div className="glass-card landing-feature-card">
            <div className="landing-feature-icon-container">
              <svg className="landing-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h3 className="landing-feature-title">ATS Resume Improvement</h3>
            <p className="landing-feature-desc">Optimize weak descriptors dynamically. Review clear, impact-driven suggestions tailored for enterprise hiring filters.</p>
          </div>

          <div className="glass-card landing-feature-card">
            <div className="landing-feature-icon-container">
              <svg className="landing-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Adaptive AI Mock Interviews</h3>
            <p className="landing-feature-desc">Practice interactive role-based questions. Receive constructive analytics on technical relevance and core communication.</p>
          </div>
        </div>
      </section>

      {/* Footer component */}
      <Footer />
    </div>
  );
}

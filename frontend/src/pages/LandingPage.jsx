import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/LandingPage.css';
import heroProductImage from '../assets/resultel-hero-product.svg';

const featureTabs = [
  {
    id: 'role',
    label: 'Role Based',
    title: 'Role-Based Prep',
    description: 'Tailor mock interviews, skill checks, and resume guidance to the exact role you are targeting.',
    pills: ['Targeted prompts', 'Skill mapping', 'Interview flow']
  },
  {
    id: 'company',
    label: 'Company Based',
    title: 'Company-Focused Strategy',
    description: 'Align your resume and interview practice with a company’s culture, priorities, and hiring expectations.',
    pills: ['Culture fit', 'Hiring signals', 'Priority skills']
  },
  {
    id: 'jd',
    label: 'JD Based',
    title: 'JD Matching Engine',
    description: 'Compare your experience directly against the job description and close the skill and keyword gaps quickly.',
    pills: ['Skill gap analysis', 'Keyword fit', 'ATS alignment']
  },
  {
    id: 'toolkit',
    label: 'Resume Toolkit',
    title: 'Resume Optimization Toolkit',
    description: 'Improve resume wording, formatting, and ATS readability with clear suggestions tailored to your goals.',
    pills: ['ATS fixes', 'Rewrite ideas', 'Formatting checks']
  },
  {
    id: 'custom',
    label: 'Create Your Own',
    title: 'Build Your Own Workflow',
    description: 'Design a personalized preparation plan using your own prompts, goals, and focus areas.',
    pills: ['Custom prompts', 'Personal goals', 'Study plans']
  },
  {
    id: 'assessments',
    label: 'Assessments',
    title: 'Progress Assessments',
    description: 'Track readiness with scorecards, benchmark feedback, and visible growth across each interview cycle.',
    pills: ['Scorecards', 'Insights', 'Progress tracking']
  }
];

export default function LandingPage({ onGetStarted, onLogin }) {
  const [demoState, setDemoState] = useState('idle'); // idle | scanning | completed
  const [demoScore, setDemoScore] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('role');

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
          <div className="landing-hero-copy">
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

          <div className="landing-hero-visual">
            <img className="landing-hero-product-image" src={heroProductImage} alt="Resultel career preparation dashboard" />
            <div className="hero-visual-panel glass-card">
              <div className="hero-dashboard-ui">
                <div className="hero-window-header">
                  <div className="hero-window-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="hero-window-title">resume-intelligence</span>
                </div>

                <div className="hero-dashboard-body">
                  <aside className="hero-sidebar">
                    <div className="hero-side-item hero-side-item-active">Overview</div>
                    <div className="hero-side-item">ATS</div>
                    <div className="hero-side-item">Skills</div>
                    <div className="hero-side-item">Interviews</div>
                  </aside>

                  <main className="hero-dashboard-main">
                    <div className="hero-top-row">
                      <div className="hero-metric-card primary">
                        <span>ATS Match</span>
                        <strong>92%</strong>
                      </div>
                      <div className="hero-metric-card">
                        <span>Skill Gap</span>
                        <strong>8%</strong>
                      </div>
                    </div>

                    <div className="hero-chart-card">
                      <div className="hero-chart-header">
                        <span>Interview Readiness</span>
                        <span className="hero-pill">+18% this week</span>
                      </div>
                      <div className="hero-bars">
                        <span style={{ height: '28%' }} />
                        <span style={{ height: '38%' }} />
                        <span style={{ height: '52%' }} />
                        <span style={{ height: '64%' }} />
                        <span style={{ height: '78%' }} />
                        <span style={{ height: '92%' }} />
                        <span style={{ height: '100%' }} />
                      </div>
                    </div>

                    <div className="hero-bottom-row">
                      <div className="hero-mini-panel">
                        <span className="hero-mini-label">Top keywords</span>
                        <div className="hero-tag-group">
                          <span>Python</span>
                          <span>SQL</span>
                          <span>Leadership</span>
                        </div>
                      </div>
                      <div className="hero-mini-panel">
                        <span className="hero-mini-label">Recommendation</span>
                        <strong>Boost AWS & CI/CD</strong>
                      </div>
                    </div>
                  </main>
                </div>
              </div>

              <div className="hero-floating-badge hero-score-badge">
                <span className="hero-badge-label">ATS Match</span>
                <strong>92%</strong>
              </div>
              <div className="hero-floating-badge hero-mini-card">
                <span className="hero-mini-title">Interview Readiness</span>
                <div className="hero-mini-track">
                  <span style={{ width: '86%' }} />
                </div>
              </div>
            </div>
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

      {/* Footer component */}
      <Footer />
    </div>
  );
}

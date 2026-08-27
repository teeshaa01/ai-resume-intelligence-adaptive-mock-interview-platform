import React, { useState } from 'react';
import '../styles/LearningRoadmap.css';

export default function LearningRoadmap() {
  const [steps, setSteps] = useState([
    { id: 1, name: 'Docker Container Core Principles', status: 'In Progress', type: 'DevOps', desc: 'Understand Dockerfiles, layered architecture, image optimization, and volume mappings.', completed: false },
    { id: 2, name: 'Kubernetes Pod Deployment & Services', status: 'Locked', type: 'Orchestration', desc: 'Configure cluster namespaces, create deployment definitions, and expose ports using services.', completed: false },
    { id: 3, name: 'CI/CD Automation with GitHub Actions', status: 'Locked', type: 'Pipelines', desc: 'Design workflow files, build matrix tasks, and securely inject environmental deployment secrets.', completed: false },
    { id: 4, name: 'AWS Cloud Services Setup (ECS & ECR)', status: 'Locked', type: 'Cloud Hosting', desc: 'Push images to container registry, configure task definitions, and run cluster services on Fargate.', completed: false }
  ]);

  const handleToggle = (id) => {
    setSteps(prev => {
      const updated = prev.map(step => {
        if (step.id === id) {
          return { ...step, completed: !step.completed };
        }
        return step;
      });

      // Update cascading locked status: if step n is complete, step n+1 is active/in progress
      return updated.map((step, idx) => {
        if (idx === 0) return step;
        const prevStep = updated[idx - 1];
        if (prevStep.completed) {
          return { ...step, status: step.completed ? 'Completed' : 'In Progress' };
        } else {
          return { ...step, status: 'Locked' };
        }
      });
    });
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="roadmap-container animate-fade-in">
      {/* Overview stats */}
      <div className="glass-card roadmap-progress-card">
        <div className="roadmap-progress-info">
          <div>
            <h3 className="card-title">Skill-Gap Learning Pathway</h3>
            <p className="card-subtitle">Complete modular milestones to close AWS, Docker, and CI/CD skill gaps.</p>
          </div>
          <div className="progress-percentage">{progressPercent}% done</div>
        </div>
        <div className="progress-bar-bg mt-4">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Roadmap nodes */}
      <div className="roadmap-timeline">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`roadmap-node glass-card ${step.status === 'Locked' ? 'locked' : ''} ${step.completed ? 'completed' : ''}`}
          >
            <div className="node-checkbox-col">
              <input 
                type="checkbox"
                className="db-checkbox node-checkbox"
                disabled={step.status === 'Locked'}
                checked={step.completed}
                onChange={() => handleToggle(step.id)}
              />
            </div>
            
            <div className="node-content-col">
              <div className="node-header">
                <h4 className="node-title">{step.name}</h4>
                <span className={`status-badge-custom ${step.status.toLowerCase().replace(' ', '-')}`}>
                  {step.status}
                </span>
              </div>
              <p className="node-desc">{step.desc}</p>
              
              {step.status !== 'Locked' && (
                <div className="node-resources">
                  <span className="res-tag">Document Reference</span>
                  <span className="res-tag">Recommended Course Link</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

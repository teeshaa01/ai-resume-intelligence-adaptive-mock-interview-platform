import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Greeting from '../components/Greeting';
import Metrics from '../components/Metrics';
import ResumeUploader from '../components/ResumeUploader';
import RecentScans from '../components/RecentScans';
import SkillChecklist from '../components/SkillChecklist';
import ATSAnalysis from '../components/ATSAnalysis';
import ResumeScore from '../components/ResumeScore';
import SkillGapAnalysis from '../components/SkillGapAnalysis';
import AIMockInterview from '../components/AIMockInterview';
import InterviewResults from '../components/InterviewResults';
import LearningRoadmap from '../components/LearningRoadmap';
import HistoryList from '../components/HistoryList';
import NotificationsPage from '../components/NotificationsPage';
import ProfileSettings from '../components/ProfileSettings';
import '../styles/DashboardLayout.css';

export default function DashboardLayout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // 11 tabs possible
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Lifted Resume States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [scanStep, setScanStep] = useState('');
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  // Dashboard Data States
  const [scans, setScans] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [skillChecklist, setSkillChecklist] = useState([]);
  const [currentUser, setCurrentUser] = useState(user);

  const handleAnalyze = () => {
    setIsAnalyzed(true);
    setScans([{
      id: Date.now(),
      filename: selectedFile ? selectedFile.name : 'resume.pdf',
      role: 'Frontend Engineer',
      date: new Date().toISOString().split('T')[0],
      score: 84
    }]);
    setSkillChecklist([
      { id: 1, skill: 'Docker Containerization', priority: 'High', source: 'Google JD', completed: false },
      { id: 2, skill: 'AWS Cloud Services', priority: 'Medium', source: 'Amazon JD', completed: false },
      { id: 3, skill: 'CI/CD Pipeline design', priority: 'Medium', source: 'Google JD', completed: false },
      { id: 4, skill: 'TypeScript type-safety', priority: 'High', source: 'General Tech', completed: false },
    ]);
    setActiveTab('overview');
  };

  const handleToggleSkill = (id) => {
    setSkillChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleAddInterviewResult = (newResult) => {
    setInterviews(prev => [newResult, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="db-grid animate-fade-in">
            <RecentScans recentScans={scans} />
            <SkillChecklist skillChecklist={skillChecklist} onToggleSkill={handleToggleSkill} />
          </div>
        );
      case 'resume':
        return (
          <ResumeUploader
            selectedFile={selectedFile} setSelectedFile={setSelectedFile}
            uploadState={uploadState} setUploadState={setUploadState}
            uploadProgress={uploadProgress} setUploadProgress={setUploadProgress}
            errorMessage={errorMessage} setErrorMessage={setErrorMessage}
            scanStep={scanStep} setScanStep={setScanStep}
            onAnalyze={handleAnalyze}
          />
        );
      case 'ats':
        return <ATSAnalysis selectedFile={selectedFile} isAnalyzed={isAnalyzed} />;
      case 'score':
        return <ResumeScore selectedFile={selectedFile} isAnalyzed={isAnalyzed} />;
      case 'skill_gap':
        return <SkillGapAnalysis selectedFile={selectedFile} isAnalyzed={isAnalyzed} />;
      case 'mock':
        return <AIMockInterview onAddInterviewResult={handleAddInterviewResult} />;
      case 'results':
        return <InterviewResults results={interviews} />;
      case 'roadmap':
        return <LearningRoadmap />;
      case 'history':
        return <HistoryList scans={scans} interviews={interviews} />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <ProfileSettings user={currentUser} onUpdateUser={setCurrentUser} />;
      default:
        return <div className="text-left">Section loading...</div>;
    }
  };

  return (
    <div className="db-layout">
      <Sidebar
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab} setActiveTab={setActiveTab}
        user={currentUser} onLogout={onLogout}
      />
      <div className="db-main-panel">
        <Header activeTab={activeTab} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="db-content">
          <Greeting user={currentUser} selectedFile={selectedFile} isAnalyzed={isAnalyzed} />
          {activeTab === 'overview' && (
            <Metrics selectedFile={selectedFile} isAnalyzed={isAnalyzed} interviewsCount={interviews.length} />
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

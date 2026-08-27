import React, { useState } from 'react';
import '../styles/ResumeUploader.css';

export default function ResumeUploader({
  selectedFile,
  setSelectedFile,
  uploadState,
  setUploadState,
  uploadProgress,
  setUploadProgress,
  errorMessage,
  setErrorMessage,
  scanStep,
  setScanStep,
  onAnalyze
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (file) => {
    setErrorMessage('');
    setUploadState('idle');
    setUploadProgress(0);

    if (!file) return;

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const isPDF = fileType === 'application/pdf' || fileName.endsWith('.pdf');
    const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx');

    if (!isPDF && !isDocx) {
      setErrorMessage('Unsupported file format. Please upload a PDF or DOCX file.');
      setUploadState('error');
      setSelectedFile(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorMessage('File size exceeds the 10 MB limit.');
      setUploadState('error');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    simulateUpload();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const simulateUpload = () => {
    setUploadState('uploading');
    setUploadProgress(0);
    setScanStep('Preparing file...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;

      if (progress < 25) {
        setScanStep('Reading document layout...');
      } else if (progress < 50) {
        setScanStep('Extracting structured text lines...');
      } else if (progress < 75) {
        setScanStep('Buffering data in application state...');
      } else {
        setScanStep('Finalizing upload token...');
      }

      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
        setUploadState('completed');
      } else {
        setUploadProgress(progress);
      }
    }, 70);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setUploadProgress(0);
    setErrorMessage('');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const decimals = 2;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>Resume Scanner</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Upload your resume in PDF or DOCX format. Our engine will check files and store them directly in React component state.
        </p>
      </div>

      {errorMessage && (
        <div className="badge-danger animate-fade-in" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 500, textAlign: 'left' }}>
          <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMessage}
        </div>
      )}

      {uploadState === 'completed' && (
        <div className="badge-success animate-fade-in" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 500, textAlign: 'left' }}>
          <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Resume uploaded successfully!
        </div>
      )}

      {(uploadState === 'idle' || uploadState === 'error') && (
        <div 
          className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('resume-file-picker').click()}
        >
          <input 
            type="file" 
            id="resume-file-picker" 
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <div className="upload-icon-container">
            <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Drag & drop your resume here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>browse</span>
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Supports PDF or DOCX up to 10 MB
          </p>
        </div>
      )}

      {uploadState === 'uploading' && selectedFile && (
        <div className="file-info-card animate-fade-in" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="file-icon-wrapper">
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="file-meta">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{uploadProgress}%</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: 'var(--primary)', width: `${uploadProgress}%`, transition: 'width 0.1s ease' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left' }}>{scanStep}</span>
          </div>
        </div>
      )}

      {uploadState === 'completed' && selectedFile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
          <div className="file-info-card">
            <div className="file-icon-wrapper" style={{ backgroundColor: '#ECFDF5', color: 'var(--primary)' }}>
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="file-meta">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            </div>
            <button className="btn-danger-outline" onClick={handleClearFile}>
              <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          </div>

          <div className="analysis-status-card">
            <h4 className="analysis-status-title">Analysis Engine Status</h4>
            <p className="analysis-status-text">
              Your resume file is loaded in memory. Run the analyzer below to calculate ATS matching score, formatting checks, and prepare custom mock interviews.
            </p>
            <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '4px' }} onClick={onAnalyze}>
              Analyze Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

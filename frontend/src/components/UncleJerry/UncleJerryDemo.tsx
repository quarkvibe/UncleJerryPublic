// UncleJerryDemo.tsx
import React, { useState } from 'react';
import UncleJerry from './UncleJerry';
import './styles.css';

const UncleJerryDemo: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<'welcome' | 'processing' | 'results' | 'estimate' | 'proposal'>('welcome');
  const [mood, setMood] = useState<'happy' | 'thinking' | 'explaining' | 'surprised'>('happy');
  const [message, setMessage] = useState<string>('');
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  
  // Simulate file upload process
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMood('thinking');
      setMessage("I'm analyzing your blueprint...");
      setCurrentStage('processing');
      setFileUploaded(true);
      
      // Simulate processing time
      setTimeout(() => {
        setMood('explaining');
        setMessage("Analysis complete! I found 12 rooms, 3 bathrooms, and approximately 2,400 square feet in your blueprint.");
        setCurrentStage('results');
      }, 3000);
    }
  };
  
  // Generate estimate
  const handleGenerateEstimate = () => {
    setMood('thinking');
    setMessage("Calculating costs for materials and labor...");
    
    // Simulate processing time
    setTimeout(() => {
      setMood('happy');
      setMessage("Your estimate is ready! Based on current market rates, this project would cost approximately $285,000 - $320,000.");
      setCurrentStage('estimate');
    }, 2000);
  };
  
  // Generate proposal
  const handleGenerateProposal = () => {
    setMood('thinking');
    setMessage("Creating your complete proposal document...");
    
    // Simulate processing time
    setTimeout(() => {
      setMood('happy');
      setMessage("Your proposal is complete! It includes material lists, labor estimates, and a detailed project timeline. You can download it or share it directly with contractors.");
      setCurrentStage('proposal');
    }, 2500);
  };
  
  return (
    <div className="uncle-jerry-demo">
      <div className="demo-header">
        <h1>Blueprint Analyzer</h1>
        <p>Upload your blueprint to get started with Uncle Jerry's expert analysis</p>
      </div>
      
      <div className="demo-content">
        <div className="demo-sidebar">
          <div className="upload-section">
            <h2>Upload Blueprint</h2>
            <input 
              type="file" 
              accept=".pdf,.jpg,.png" 
              onChange={handleFileUpload}
              id="blueprint-upload"
              className="file-input"
            />
            <label htmlFor="blueprint-upload" className="file-label">
              Select File
            </label>
            {fileUploaded && <p className="file-status">File uploaded successfully!</p>}
          </div>
          
          {currentStage === 'results' && (
            <button className="action-button" onClick={handleGenerateEstimate}>
              Generate Estimate
            </button>
          )}
          
          {currentStage === 'estimate' && (
            <button className="action-button" onClick={handleGenerateProposal}>
              Create Full Proposal
            </button>
          )}
          
          {currentStage === 'proposal' && (
            <button className="action-button">
              Download Proposal
            </button>
          )}
        </div>
        
        <div className="demo-main">
          {currentStage === 'welcome' && (
            <div className="welcome-screen">
              <h2>Welcome to Blueprint Analyzer</h2>
              <p>Upload your blueprint to get started</p>
            </div>
          )}
          
          {currentStage === 'processing' && (
            <div className="processing-screen">
              <div className="loading-animation"></div>
              <p>Analyzing blueprint...</p>
            </div>
          )}
          
          {currentStage === 'results' && (
            <div className="results-screen">
              <h2>Blueprint Analysis Results</h2>
              <div className="results-grid">
                <div className="result-card">
                  <h3>Rooms</h3>
                  <p className="result-value">12</p>
                </div>
                <div className="result-card">
                  <h3>Bathrooms</h3>
                  <p className="result-value">3</p>
                </div>
                <div className="result-card">
                  <h3>Square Footage</h3>
                  <p className="result-value">2,400</p>
                </div>
                <div className="result-card">
                  <h3>Windows</h3>
                  <p className="result-value">16</p>
                </div>
              </div>
            </div>
          )}
          
          {currentStage === 'estimate' && (
            <div className="estimate-screen">
              <h2>Cost Estimate</h2>
              <div className="estimate-details">
                <div className="estimate-row">
                  <span>Materials</span>
                  <span>$175,000 - $195,000</span>
                </div>
                <div className="estimate-row">
                  <span>Labor</span>
                  <span>$110,000 - $125,000</span>
                </div>
                <div className="estimate-row total">
                  <span>Total</span>
                  <span>$285,000 - $320,000</span>
                </div>
              </div>
            </div>
          )}
          
          {currentStage === 'proposal' && (
            <div className="proposal-screen">
              <h2>Complete Proposal</h2>
              <div className="proposal-preview">
                <h3>Project Overview</h3>
                <p>2,400 sq ft residential property renovation</p>
                
                <h3>Timeline</h3>
                <div className="timeline">
                  <div className="timeline-item">
                    <span className="timeline-date">Week 1-2</span>
                    <span className="timeline-task">Foundation work</span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-date">Week 3-6</span>
                    <span className="timeline-task">Framing and structure</span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-date">Week 7-10</span>
                    <span className="timeline-task">Electrical and plumbing</span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-date">Week 11-14</span>
                    <span className="timeline-task">Interior finishing</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="demo-footer">
        <UncleJerry
          state={mood as 'idle' | 'talking' | 'thinking' | 'excited' | 'pointing'}
          message={message}
          size="medium"
          position="right"
        />
      </div>
    </div>
  );
};

export default UncleJerryDemo;
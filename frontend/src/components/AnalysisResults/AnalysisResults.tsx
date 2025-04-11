import React, { useState } from 'react';
import { AnalysisResultsProps, AnalysisResult, Material, LaborItem } from '../../types/components';
import './styles.css';

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  results,
  blueprintImage,
  trade,
  isLoading = false,
  onSave,
  onNewAnalysis
}) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'labor' | 'summary'>('summary');
  
  const renderMaterialsTab = () => {
    if (results && Array.isArray(results.materials) && results.materials.length > 0) {
      return (
        <div className="materials-tab">
          <table className="materials-table">
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col">Quantity</th>
                <th scope="col">Unit</th>
                <th scope="col">Cost</th>
              </tr>
            </thead>
            <tbody>
              {results.materials.map((material: Material, index: number) => (
                <tr key={`material-${index}`}>
                  <td>{material.name}</td>
                  <td>{material.quantity}</td>
                  <td>{material.unit}</td>
                  <td>${typeof material.cost === 'number' ? material.cost.toFixed(2) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total Materials Cost</td>
                <td>${typeof results.totalMaterialCost === 'number' ? 
                  results.totalMaterialCost.toFixed(2) : 'N/A'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }
    
    return (
      <div className="materials-section">
        <h3>Materials Required</h3>
        <div className="text-results">
          No materials data available
        </div>
      </div>
    );
  };
  
  const renderLaborTab = () => {
    if (results && Array.isArray(results.labor) && results.labor.length > 0) {
      return (
        <div className="labor-tab">
          <table className="labor-table">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Hours</th>
                <th scope="col">Rate</th>
                <th scope="col">Cost</th>
              </tr>
            </thead>
            <tbody>
              {results.labor.map((laborItem: LaborItem, index: number) => (
                <tr key={`labor-${index}`}>
                  <td>{laborItem.task}</td>
                  <td>{laborItem.hours}</td>
                  <td>${typeof laborItem.rate === 'number' ? laborItem.rate.toFixed(2) : 'N/A'}/hr</td>
                  <td>${typeof laborItem.cost === 'number' ? laborItem.cost.toFixed(2) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total Labor Cost</td>
                <td>${typeof results.totalLaborCost === 'number' ? 
                  results.totalLaborCost.toFixed(2) : 'N/A'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }
    
    return (
      <div className="labor-section">
        <h3>Labor Estimate</h3>
        <div className="text-results">
          No labor data available
        </div>
      </div>
    );
  };
  
  const renderSummaryTab = () => {
    return (
      <div className="summary-tab">
        <div className="summary-section">
          <h3>{results.project_name || `${trade.charAt(0).toUpperCase() + trade.slice(1)} Project Estimate`}</h3>
          
          <div className="cost-summary">
            <div className="cost-item">
              <span className="cost-label">Materials Cost:</span>
              <span className="cost-value">${typeof results.totalMaterialCost === 'number' ? 
                results.totalMaterialCost.toFixed(2) : 'N/A'}</span>
            </div>
            <div className="cost-item">
              <span className="cost-label">Labor Cost:</span>
              <span className="cost-value">${typeof results.totalLaborCost === 'number' ? 
                results.totalLaborCost.toFixed(2) : 'N/A'}</span>
            </div>
            {typeof results.permit_cost === 'number' && (
              <div className="cost-item">
                <span className="cost-label">Permit Fees:</span>
                <span className="cost-value">${results.permit_cost.toFixed(2)}</span>
              </div>
            )}
            {typeof results.equipment_cost === 'number' && (
              <div className="cost-item">
                <span className="cost-label">Equipment Cost:</span>
                <span className="cost-value">${results.equipment_cost.toFixed(2)}</span>
              </div>
            )}
            <div className="cost-item total">
              <span className="cost-label">Total Project Cost:</span>
              <span className="cost-value">${typeof results.totalCost === 'number' ? 
                results.totalCost.toFixed(2) : 'N/A'}</span>
            </div>
          </div>
          
          {blueprintImage && (
            <div className="blueprint-preview">
              <h4>Blueprint Reference</h4>
              <img src={blueprintImage} alt="Blueprint" />
            </div>
          )}
          
          {results.notes && (
            <div className="notes-section">
              <h4>Notes</h4>
              <p>{results.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="analysis-results loading" aria-busy="true">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>Analyzing blueprint...</p>
      </div>
    );
  }
  
  return (
    <div className="analysis-results">
      <div className="results-header">
        <h2>Estimate Results</h2>
        <div className="results-actions">
          {onSave && (
            <button className="save-button" onClick={onSave} aria-label="Save estimate">
              Save Estimate
            </button>
          )}
          {onNewAnalysis && (
            <button className="new-button" onClick={onNewAnalysis} aria-label="Start new analysis">
              New Analysis
            </button>
          )}
        </div>
      </div>
      
      <div className="results-tabs" role="tablist">
        <button 
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
          role="tab"
          aria-selected={activeTab === 'summary'}
          aria-controls="summary-tab"
          id="summary-tab-button"
        >
          Summary
        </button>
        <button 
          className={`tab-button ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
          role="tab"
          aria-selected={activeTab === 'materials'}
          aria-controls="materials-tab"
          id="materials-tab-button"
        >
          Materials
        </button>
        <button 
          className={`tab-button ${activeTab === 'labor' ? 'active' : ''}`}
          onClick={() => setActiveTab('labor')}
          role="tab"
          aria-selected={activeTab === 'labor'}
          aria-controls="labor-tab"
          id="labor-tab-button"
        >
          Labor
        </button>
      </div>
      
      <div className="results-content">
        <div 
          id="summary-tab" 
          role="tabpanel"
          aria-labelledby="summary-tab-button"
          style={{ display: activeTab === 'summary' ? 'block' : 'none' }}
        >
          {activeTab === 'summary' && renderSummaryTab()}
        </div>
        <div 
          id="materials-tab" 
          role="tabpanel"
          aria-labelledby="materials-tab-button"
          style={{ display: activeTab === 'materials' ? 'block' : 'none' }}
        >
          {activeTab === 'materials' && renderMaterialsTab()}
        </div>
        <div 
          id="labor-tab" 
          role="tabpanel"
          aria-labelledby="labor-tab-button"
          style={{ display: activeTab === 'labor' ? 'block' : 'none' }}
        >
          {activeTab === 'labor' && renderLaborTab()}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
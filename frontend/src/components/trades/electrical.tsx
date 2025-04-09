import React, { useState, useEffect, useRef } from 'react';
import '../../styles/ElectricalAnalyzer.css';

interface ElectricalComponent {
  category: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface InstallationNote {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface ElectricalAnalysisResult {
  components: ElectricalComponent[];
  notes: InstallationNote[];
  totalMCCable: number;
  totalConduit: number;
  totalBoxes: number;
  laborHours?: number;
}

interface ElectricalAnalyzerProps {
  blueprintData: {
    imageUrls: string[];
    projectScale?: string;
    analysisType: 'materials' | 'costs' | 'full';
  };
  onAnalysisComplete: (result: ElectricalAnalysisResult) => void;
  onAnalysisProgress?: (progress: number) => void;
  analysisResult?: ElectricalAnalysisResult;
  isEditable?: boolean;
}

const ElectricalAnalyzer: React.FC<ElectricalAnalyzerProps> = ({
  blueprintData,
  onAnalysisComplete,
  onAnalysisProgress,
  analysisResult,
  isEditable = true
}) => {
  // State for the component
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingComponent, setEditingComponent] = useState<ElectricalComponent | null>(null);
  const [editingNote, setEditingNote] = useState<InstallationNote | null>(null);
  const [showMCCalculator, setShowMCCalculator] = useState<boolean>(false);
  const [showBlueprintPreview, setShowBlueprintPreview] = useState<string | null>(null);
  const [mcCalculation, setMcCalculation] = useState({
    length: 0,
    runs: 1,
    extraPercentage: 15
  });
  const [electricalData, setElectricalData] = useState<ElectricalAnalysisResult | null>(analysisResult || null);
  const [isModified, setIsModified] = useState<boolean>(false);
  
  const mcCalculatorRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  
  // Set initial data if provided
  useEffect(() => {
    if (analysisResult) {
      setElectricalData(analysisResult);
      setAnalysisState('complete');
    }
  }, [analysisResult]);
  
  // Handle changes to the blueprintData
  useEffect(() => {
    if (!electricalData && blueprintData.imageUrls.length > 0) {
      // Start analysis when images are available
      analyzeBlueprints();
    }
  }, [blueprintData]);
  
  // Categories for electrical components
  const categories = [
    'Receptacles',
    'Switches',
    'Lighting',
    'Panels',
    'Conduit & Raceway',
    'Wire',
    'Boxes & Enclosures',
    'Special Systems',
    'Miscellaneous'
  ];
  
  // Analyze the blueprints
  const analyzeBlueprints = () => {
    setAnalysisState('analyzing');
    
    // This would be where the actual API call to the Claude-powered backend would happen
    // For now, we'll simulate the analysis process with a timeout
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (onAnalysisProgress) {
        onAnalysisProgress(progress);
      }
      
      if (progress >= 100) {
        clearInterval(progressInterval);
        
        // Sample analysis result - in a real app, this would come from the backend
        const result: ElectricalAnalysisResult = {
          components: [
            { category: 'Receptacles', name: 'Standard Duplex Receptacles', quantity: 52, unit: 'ea', unitPrice: 3.25, totalPrice: 169 },
            { category: 'Receptacles', name: 'GFCI Receptacles', quantity: 18, unit: 'ea', unitPrice: 15.75, totalPrice: 283.5 },
            { category: 'Receptacles', name: 'Above Counter Receptacles', quantity: 16, unit: 'ea', unitPrice: 4.50, totalPrice: 72 },
            { category: 'Switches', name: 'Toggle Switches', quantity: 28, unit: 'ea', unitPrice: 2.95, totalPrice: 82.6 },
            { category: 'Switches', name: '3-Way Toggle Switches', quantity: 8, unit: 'ea', unitPrice: 5.45, totalPrice: 43.6 },
            { category: 'Switches', name: 'Dimmer Switches', quantity: 10, unit: 'ea', unitPrice: 18.25, totalPrice: 182.5 },
            { category: 'Lighting', name: 'Recessed Downlights', quantity: 85, unit: 'ea', unitPrice: 24.50, totalPrice: 2082.5 },
            { category: 'Lighting', name: 'Track Lighting', quantity: 36, unit: 'ea', unitPrice: 32.75, totalPrice: 1179 },
            { category: 'Lighting', name: 'Track', quantity: 80, unit: 'ft', unitPrice: 8.25, totalPrice: 660 },
            { category: 'Panels', name: 'Main Panel MP', quantity: 1, unit: 'ea', unitPrice: 750, totalPrice: 750 },
            { category: 'Panels', name: 'Branch Panel A', quantity: 1, unit: 'ea', unitPrice: 425, totalPrice: 425 },
            { category: 'Panels', name: 'Branch Panel B', quantity: 1, unit: 'ea', unitPrice: 425, totalPrice: 425 },
            { category: 'Conduit & Raceway', name: 'EMT Conduit', quantity: 1500, unit: 'ft', unitPrice: 1.75, totalPrice: 2625 },
            { category: 'Conduit & Raceway', name: 'Rigid Conduit', quantity: 350, unit: 'ft', unitPrice: 3.25, totalPrice: 1137.5 },
            { category: 'Conduit & Raceway', name: 'Flexible Conduit', quantity: 250, unit: 'ft', unitPrice: 2.25, totalPrice: 562.5 },
            { category: 'Conduit & Raceway', name: 'MC Cable', quantity: 9200, unit: 'ft', unitPrice: 1.85, totalPrice: 17020 },
            { category: 'Wire', name: '#12 THHN', quantity: 15000, unit: 'ft', unitPrice: 0.18, totalPrice: 2700 },
            { category: 'Wire', name: '#10 THHN', quantity: 8000, unit: 'ft', unitPrice: 0.28, totalPrice: 2240 },
            { category: 'Wire', name: '#8 THHN', quantity: 4500, unit: 'ft', unitPrice: 0.45, totalPrice: 2025 },
            { category: 'Wire', name: '#6 THHN', quantity: 2500, unit: 'ft', unitPrice: 0.65, totalPrice: 1625 },
            { category: 'Boxes & Enclosures', name: '4" Square Boxes', quantity: 180, unit: 'ea', unitPrice: 1.85, totalPrice: 333 },
            { category: 'Boxes & Enclosures', name: '4-11/16" Square Boxes', quantity: 40, unit: 'ea', unitPrice: 3.25, totalPrice: 130 },
            { category: 'Boxes & Enclosures', name: 'Junction Boxes', quantity: 45, unit: 'ea', unitPrice: 12.50, totalPrice: 562.5 },
            { category: 'Special Systems', name: 'Occupancy Sensors', quantity: 16, unit: 'ea', unitPrice: 35.75, totalPrice: 572 },
            { category: 'Special Systems', name: 'Daylight Harvesting Sensors', quantity: 4, unit: 'ea', unitPrice: 45.25, totalPrice: 181 },
            { category: 'Miscellaneous', name: 'Wire Nuts', quantity: 1000, unit: 'ea', unitPrice: 0.15, totalPrice: 150 },
            { category: 'Miscellaneous', name: 'MC Connectors', quantity: 400, unit: 'ea', unitPrice: 1.25, totalPrice: 500 },
          ],
          notes: [
            { text: 'Kitchen hood fire suppression system must be interconnected with exhaust fans and make-up air systems as detailed in drawing.', priority: 'high' },
            { text: 'Verify all equipment disconnects meet NEC requirements and are located within sight of equipment.', priority: 'high' },
            { text: 'Occupancy sensors in restrooms must be coordinated with plumbing fixtures for proper coverage.', priority: 'medium' },
            { text: 'All kitchen equipment connections must be verified with final shop drawings before rough-in.', priority: 'high' },
            { text: 'Lighting control system requires comprehensive testing and commissioning.', priority: 'medium' },
            { text: 'Provide dedicated neutral with all dimming system circuits. Common neutrals are not allowed.', priority: 'high' },
            { text: 'Coordinate all floor penetrations with structural engineer before cutting.', priority: 'medium' },
            { text: 'Standard exterior conduit must be rainproof/watertight (WP/WR).', priority: 'medium' },
          ],
          totalMCCable: 9200,
          totalConduit: 2100,
          totalBoxes: 265,
          laborHours: 320
        };
        
        setElectricalData(result);
        setAnalysisState('complete');
        onAnalysisComplete(result);
      }
    }, 200);
  };
  
  // Filter components by category
  const getFilteredComponents = () => {
    if (!electricalData) return [];
    
    return selectedCategory === 'all'
      ? electricalData.components
      : electricalData.components.filter(c => c.category === selectedCategory);
  };
  
  // Calculate totals
  const calculateTotals = () => {
    if (!electricalData) return { itemCount: 0, totalCost: 0 };
    
    const itemCount = electricalData.components.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalCost = electricalData.components.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
    
    return { itemCount, totalCost };
  };
  
  // Handle component editing
  const handleComponentEdit = (component: ElectricalComponent) => {
    setEditingComponent({ ...component });
  };
  
  // Save edited component
  const saveEditedComponent = () => {
    if (!editingComponent || !electricalData) return;
    
    const updatedComponents = electricalData.components.map(c => 
      c.name === editingComponent.name && c.category === editingComponent.category
        ? { 
            ...editingComponent, 
            totalPrice: editingComponent.unitPrice 
              ? editingComponent.quantity * editingComponent.unitPrice 
              : undefined 
          }
        : c
    );
    
    setElectricalData({
      ...electricalData,
      components: updatedComponents
    });
    
    setEditingComponent(null);
    setIsModified(true);
  };
  
  // Add new component
  const addNewComponent = () => {
    if (!electricalData) return;
    
    const newComponent: ElectricalComponent = {
      category: categories[0],
      name: 'New Component',
      quantity: 1,
      unit: 'ea',
      unitPrice: blueprintData.analysisType !== 'materials' ? 0 : undefined
    };
    
    setEditingComponent(newComponent);
  };
  
  // Save new component
  const saveNewComponent = () => {
    if (!editingComponent || !electricalData) return;
    
    // Check if component already exists
    const exists = electricalData.components.some(
      c => c.name === editingComponent.name && c.category === editingComponent.category
    );
    
    if (exists) {
      alert('A component with this name already exists in this category');
      return;
    }
    
    const updatedComponent = {
      ...editingComponent,
      totalPrice: editingComponent.unitPrice 
        ? editingComponent.quantity * editingComponent.unitPrice 
        : undefined
    };
    
    setElectricalData({
      ...electricalData,
      components: [...electricalData.components, updatedComponent]
    });
    
    setEditingComponent(null);
    setIsModified(true);
  };
  
  // Remove component
  const removeComponent = (component: ElectricalComponent) => {
    if (!electricalData) return;
    
    if (window.confirm(`Are you sure you want to remove ${component.name}?`)) {
      const updatedComponents = electricalData.components.filter(
        c => !(c.name === component.name && c.category === component.category)
      );
      
      setElectricalData({
        ...electricalData,
        components: updatedComponents
      });
      
      setIsModified(true);
    }
  };
  
  // Handle note editing
  const handleNoteEdit = (note: InstallationNote) => {
    setEditingNote({ ...note });
  };
  
  // Save edited note
  const saveEditedNote = () => {
    if (!editingNote || !electricalData) return;
    
    // Find the index of the note we're editing
    const noteIndex = electricalData.notes.findIndex(n => n.text === editingNote.text);
    
    if (noteIndex >= 0) {
      const updatedNotes = [...electricalData.notes];
      updatedNotes[noteIndex] = editingNote;
      
      setElectricalData({
        ...electricalData,
        notes: updatedNotes
      });
    } else {
      // It's a new note
      setElectricalData({
        ...electricalData,
        notes: [...electricalData.notes, editingNote]
      });
    }
    
    setEditingNote(null);
    setIsModified(true);
  };
  
  // Add new note
  const addNewNote = () => {
    setEditingNote({
      text: '',
      priority: 'medium'
    });
  };
  
  // Remove note
  const removeNote = (note: InstallationNote) => {
    if (!electricalData) return;
    
    if (window.confirm('Are you sure you want to remove this note?')) {
      const updatedNotes = electricalData.notes.filter(n => n.text !== note.text);
      
      setElectricalData({
        ...electricalData,
        notes: updatedNotes
      });
      
      setIsModified(true);
    }
  };
  
  // Calculate MC cable
  const calculateMCCable = () => {
    const total = mcCalculation.length * mcCalculation.runs * (1 + mcCalculation.extraPercentage / 100);
    
    if (electricalData) {
      // Find the MC Cable component and update it
      const updatedComponents = electricalData.components.map(c => {
        if (c.name === 'MC Cable' && c.category === 'Conduit & Raceway') {
          return {
            ...c,
            quantity: Math.ceil(total),
            totalPrice: c.unitPrice ? Math.ceil(total) * c.unitPrice : undefined
          };
        }
        return c;
      });
      
      setElectricalData({
        ...electricalData,
        components: updatedComponents,
        totalMCCable: Math.ceil(total)
      });
      
      setIsModified(true);
    }
    
    setShowMCCalculator(false);
  };
  
  // Save changes to the analysis
  const saveChanges = () => {
    if (electricalData && isModified) {
      onAnalysisComplete(electricalData);
      setIsModified(false);
    }
  };
  
  // Render the component
  return (
    <div className="electrical-analyzer" data-testid="electrical-analyzer">
      <div className="electrical-analyzer__header">
        <h2>Electrical Analysis</h2>
        
        {/* Status indicator */}
        <div className={`analysis-status analysis-status--${analysisState}`}>
          {analysisState === 'idle' && 'Ready to analyze'}
          {analysisState === 'analyzing' && 'Analyzing blueprints...'}
          {analysisState === 'complete' && 'Analysis complete'}
        </div>
        
        {/* Tool buttons */}
        {analysisState === 'complete' && (
          <div className="tool-buttons">
            <button 
              className="tool-button" 
              onClick={() => setShowMCCalculator(true)}
              title="Calculate MC cable lengths"
            >
              <span className="icon">📏</span> MC Calculator
            </button>
            
            {isEditable && (
              <button 
                className="tool-button" 
                onClick={addNewComponent}
                title="Add a new component"
              >
                <span className="icon">➕</span> Add Component
              </button>
            )}
            
            {isEditable && (
              <button 
                className="tool-button" 
                onClick={addNewNote}
                title="Add a new installation note"
              >
                <span className="icon">📝</span> Add Note
              </button>
            )}
            
            {isModified && (
              <button 
                className="tool-button tool-button--primary" 
                onClick={saveChanges}
                title="Save your changes"
              >
                <span className="icon">💾</span> Save Changes
              </button>
            )}
          </div>
        )}
      </div>
      
      {analysisState === 'analyzing' && (
        <div className="analysis-progress">
          <div className="spinner"></div>
          <p>Uncle Jerry is analyzing your electrical blueprints...</p>
        </div>
      )}
      
      {analysisState === 'complete' && electricalData && (
        <div className="analysis-results">
          {/* Category filter */}
          <div className="category-filter">
            <label htmlFor="category-select">Filter by category:</label>
            <select 
              id="category-select" 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Summary */}
          <div className="analysis-summary">
            <div className="summary-box">
              <h3>Total Components</h3>
              <p className="summary-value">{calculateTotals().itemCount}</p>
            </div>
            
            <div className="summary-box">
              <h3>MC Cable</h3>
              <p className="summary-value">{electricalData.totalMCCable} ft</p>
            </div>
            
            <div className="summary-box">
              <h3>Conduit</h3>
              <p className="summary-value">{electricalData.totalConduit} ft</p>
            </div>
            
            <div className="summary-box">
              <h3>Boxes</h3>
              <p className="summary-value">{electricalData.totalBoxes}</p>
            </div>
            
            {blueprintData.analysisType !== 'materials' && (
              <div className="summary-box summary-box--highlight">
                <h3>Total Cost</h3>
                <p className="summary-value">${calculateTotals().totalCost.toFixed(2)}</p>
              </div>
            )}
            
            {blueprintData.analysisType === 'full' && (
              <div className="summary-box">
                <h3>Labor Hours</h3>
                <p className="summary-value">{electricalData.laborHours}</p>
              </div>
            )}
          </div>
          
          {/* Components table */}
          <div className="components-table-container">
            <h3>Electrical Components</h3>
            <table className="components-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  {blueprintData.analysisType !== 'materials' && (
                    <>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </>
                  )}
                  {isEditable && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {getFilteredComponents().map((component, index) => (
                  <tr key={`${component.category}-${component.name}-${index}`}>
                    <td>{component.category}</td>
                    <td>{component.name}</td>
                    <td>{component.quantity}</td>
                    <td>{component.unit}</td>
                    {blueprintData.analysisType !== 'materials' && (
                      <>
                        <td>${component.unitPrice?.toFixed(2)}</td>
                        <td>${component.totalPrice?.toFixed(2)}</td>
                      </>
                    )}
                    {isEditable && (
                      <td className="actions-cell">
                        <button 
                          className="action-button" 
                          onClick={() => handleComponentEdit(component)}
                          title="Edit this component"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-button action-button--danger" 
                          onClick={() => removeComponent(component)}
                          title="Remove this component"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Installation notes */}
          <div className="installation-notes">
            <h3>Installation Notes</h3>
            <ul className="notes-list">
              {electricalData.notes.map((note, index) => (
                <li 
                  key={index} 
                  className={`note note--${note.priority}`}
                >
                  <div className="note-content">
                    <span className="priority-indicator" title={`${note.priority} priority`}>
                      {note.priority === 'high' ? '❗' : note.priority === 'medium' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span className="note-text">{note.text}</span>
                  </div>
                  
                  {isEditable && (
                    <div className="note-actions">
                      <button 
                        className="action-button" 
                        onClick={() => handleNoteEdit(note)}
                        title="Edit this note"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-button action-button--danger" 
                        onClick={() => removeNote(note)}
                        title="Remove this note"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* MC Cable Calculator modal */}
      {showMCCalculator && (
        <div className="modal-overlay">
          <div className="modal mc-calculator-modal" ref={mcCalculatorRef}>
            <div className="modal-header">
              <h3>MC Cable Calculator</h3>
              <button 
                className="close-button" 
                onClick={() => setShowMCCalculator(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Calculate the total MC cable needed for your project.</p>
              
              <div className="form-group">
                <label htmlFor="run-length">Run Length (ft):</label>
                <input 
                  type="number" 
                  id="run-length" 
                  value={mcCalculation.length}
                  onChange={(e) => setMcCalculation({
                    ...mcCalculation,
                    length: parseFloat(e.target.value) || 0
                  })}
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="num-runs">Number of Runs:</label>
                <input 
                  type="number" 
                  id="num-runs" 
                  value={mcCalculation.runs}
                  onChange={(e) => setMcCalculation({
                    ...mcCalculation,
                    runs: parseInt(e.target.value) || 1
                  })}
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="extra-percentage">Extra Percentage (%):</label>
                <input 
                  type="number" 
                  id="extra-percentage" 
                  value={mcCalculation.extraPercentage}
                  onChange={(e) => setMcCalculation({
                    ...mcCalculation,
                    extraPercentage: parseFloat(e.target.value) || 0
                  })}
                  min="0"
                  max="100"
                />
                <small>Add extra for vertical runs, turns, and waste</small>
              </div>
              
              <div className="calculation-result">
                <p>Total MC Cable: <strong>{(mcCalculation.length * mcCalculation.runs * (1 + mcCalculation.extraPercentage / 100)).toFixed(1)} ft</strong></p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={() => setShowMCCalculator(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-button" 
                onClick={calculateMCCable}
              >
                Update Estimate
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Component edit modal */}
      {editingComponent && (
        <div className="modal-overlay">
          <div className="modal component-edit-modal" ref={editModalRef}>
            <div className="modal-header">
              <h3>
                {electricalData?.components.some(
                  c => c.name === editingComponent.name && c.category === editingComponent.category
                ) 
                  ? 'Edit Component' 
                  : 'Add New Component'
                }
              </h3>
              <button 
                className="close-button" 
                onClick={() => setEditingComponent(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="component-category">Category:</label>
                <select 
                  id="component-category" 
                  value={editingComponent.category}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    category: e.target.value
                  })}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="component-name">Component Name:</label>
                <input 
                  type="text" 
                  id="component-name" 
                  value={editingComponent.name}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    name: e.target.value
                  })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="component-quantity">Quantity:</label>
                <input 
                  type="number" 
                  id="component-quantity" 
                  value={editingComponent.quantity}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    quantity: parseFloat(e.target.value) || 0
                  })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="component-unit">Unit:</label>
                <input 
                  type="text" 
                  id="component-unit" 
                  value={editingComponent.unit}
                  onChange={(e) => setEditingComponent({
                    ...editingComponent,
                    unit: e.target.value
                  })}
                  required
                />
              </div>
              
              {blueprintData.analysisType !== 'materials' && (
                <div className="form-group">
                  <label htmlFor="component-price">Unit Price ($):</label>
                  <input 
                    type="number" 
                    id="component-price" 
                    value={editingComponent.unitPrice || 0}
                    onChange={(e) => setEditingComponent({
                      ...editingComponent,
                      unitPrice: parseFloat(e.target.value) || 0
                    })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={() => setEditingComponent(null)}
              >
                Cancel
              </button>
              <button 
                className="primary-button" 
                onClick={
                  electricalData?.components.some(
                    c => c.name === editingComponent.name && c.category === editingComponent.category
                  ) 
                    ? saveEditedComponent 
                    : saveNewComponent
                }
                disabled={!editingComponent.name || editingComponent.quantity <= 0}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Note edit modal */}
      {editingNote && (
        <div className="modal-overlay">
          <div className="modal note-edit-modal">
            <div className="modal-header">
              <h3>{editingNote.text ? 'Edit Note' : 'Add New Note'}</h3>
              <button 
                className="close-button" 
                onClick={() => setEditingNote(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="note-text">Note Text:</label>
                <textarea
                  id="note-text"
                  value={editingNote.text}
                  onChange={(e) => setEditingNote({
                    ...editingNote,
                    text: e.target.value
                  })}
                  rows={4}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="note-priority">Priority:</label>
                <select
                  id="note-priority"
                  value={editingNote.priority}
                  onChange={(e) => setEditingNote({
                    ...editingNote,
                    priority: e.target.value as 'high' | 'medium' | 'low'
                  })}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={() => setEditingNote(null)}
              >
                Cancel
              </button>
              <button 
                className="primary-button" 
                onClick={saveEditedNote}
                disabled={!editingNote.text.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Blueprint preview overlay when viewing images */}
      {showBlueprintPreview && (
        <div className="blueprint-preview-overlay" onClick={() => setShowBlueprintPreview(null)}>
          <div className="blueprint-preview-container">
            <button 
              className="close-preview-button" 
              onClick={() => setShowBlueprintPreview(null)}
            >
              ×
            </button>
            <img 
              src={showBlueprintPreview} 
              alt="Blueprint Preview" 
              className="blueprint-preview-image" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricalAnalyzer;

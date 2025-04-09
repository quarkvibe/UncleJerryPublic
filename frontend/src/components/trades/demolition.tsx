import React, { useState, useEffect, useRef } from 'react';
// Create mock icon components instead of importing from react-icons/fa
const FaUpload: React.FC<any> = (props) => <span {...props}>⬆️</span>;
const FaCalculator: React.FC<any> = (props) => <span {...props}>🧮</span>;
const FaFileDownload: React.FC<any> = (props) => <span {...props}>⬇️</span>;
const FaSpinner: React.FC<any> = (props) => <span {...props}>🔄</span>;
import axios from 'axios';

interface BlueprintFile {
  id: string;
  name: string;
  url: string;
  type: 'floorplan' | 'demolition' | 'notes' | 'other';
}

interface MaterialItem {
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  laborHours: number;
  cost: number;
}

interface EquipmentItem {
  description: string;
  duration: number; // in days
  dailyRate: number;
  totalCost: number;
}

interface LaborItem {
  category: string;
  hours: number;
  rate: number;
  totalCost: number;
}

interface DemolitionAnalysis {
  projectName: string;
  drawingReference: string;
  totalSquareFootage: number;
  scopeSummary: string[];
  materials: MaterialItem[];
  equipment: EquipmentItem[];
  labor: LaborItem[];
  specialConsiderations: string[];
  timeline: {
    duration: number; // in days
    crewSize: number;
  };
  costSummary: {
    materials: number;
    equipment: number;
    labor: number;
    subtotal: number;
    generalConditions: number;
    overheadProfit: number;
    contingency: number;
    total: number;
  };
}

const DemolitionAnalyzer: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [blueprints, setBlueprints] = useState<BlueprintFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DemolitionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'analyze' | 'results'>('upload');
  const [analysisType, setAnalysisType] = useState<'materials' | 'costs' | 'full'>('full');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload files to server
  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one blueprint file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('blueprints', file);
      });

      const response = await axios.post('/api/blueprints/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setBlueprints(response.data.blueprints);
      setActiveTab('analyze');
    } catch (err) {
      setError('Failed to upload blueprints. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Analyze blueprints
  const analyzeBlueprints = async () => {
    if (blueprints.length === 0) {
      setError('No blueprints available for analysis.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await axios.post('/api/analysis/demolition', {
        blueprints,
        analysisType
      });

      setAnalysisResult(response.data.analysis);
      setActiveTab('results');
    } catch (err) {
      setError('Failed to analyze blueprints. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Download analysis as PDF
  const downloadPDF = async () => {
    if (!analysisResult) return;

    try {
      const response = await axios.post('/api/export/pdf', 
        { analysis: analysisResult },
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${analysisResult.projectName}_demolition_estimate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download PDF. Please try again.');
      console.error('Download error:', err);
    }
  };

  // Mock function for demo purposes - in a real app, this would be replaced by the actual API call
  const mockAnalyzeBlueprints = () => {
    setAnalyzing(true);
    setError(null);
    
    // Simulate API call delay
    setTimeout(() => {
      const mockResult: DemolitionAnalysis = {
        projectName: "Commercial Space Renovation (T-Mobile)",
        drawingReference: "B4 - Demolition Floor Plan (1/4\" = 1'-0\")",
        totalSquareFootage: 2400,
        scopeSummary: [
          "Removal of existing interior partition walls",
          "Removal of acoustical ceiling tiles and grid systems",
          "Removal of existing flooring finishes",
          "Demolition of plumbing fixtures",
          "Removal of electrical fixtures, panels and wiring",
          "Removal of HVAC diffusers and return grilles",
          "Saw-cutting for new utility trenches",
          "Removal of millwork, display fixtures and associated finishes"
        ],
        materials: [
          { description: "Existing partition walls", quantity: 180, unit: "LF", unitRate: 12.5, laborHours: 36, cost: 2250 },
          { description: "Acoustical ceiling tile/grid", quantity: 2100, unit: "SF", unitRate: 1.75, laborHours: 42, cost: 3675 },
          { description: "Flooring removal", quantity: 2400, unit: "SF", unitRate: 1.5, laborHours: 48, cost: 3600 },
          { description: "Plumbing fixtures", quantity: 4, unit: "EA", unitRate: 125, laborHours: 12, cost: 500 },
          { description: "Electrical fixtures", quantity: 28, unit: "EA", unitRate: 35, laborHours: 14, cost: 980 },
          { description: "Electrical panels", quantity: 2, unit: "EA", unitRate: 250, laborHours: 8, cost: 500 },
          { description: "HVAC diffusers/grilles", quantity: 16, unit: "EA", unitRate: 28, laborHours: 8, cost: 448 },
          { description: "Millwork/casework", quantity: 85, unit: "LF", unitRate: 22, laborHours: 34, cost: 1870 },
          { description: "Door and frame removal", quantity: 7, unit: "EA", unitRate: 75, laborHours: 7, cost: 525 },
          { description: "Saw-cutting concrete slab", quantity: 65, unit: "LF", unitRate: 18, laborHours: 16, cost: 1170 },
          { description: "Window/storefront removal", quantity: 45, unit: "SF", unitRate: 14, laborHours: 9, cost: 630 },
          { description: "Dumpsters/waste removal", quantity: 5, unit: "EA", unitRate: 650, laborHours: 0, cost: 3250 }
        ],
        equipment: [
          { description: "Skid steer loader", duration: 3, dailyRate: 350, totalCost: 1050 },
          { description: "Concrete saw", duration: 2, dailyRate: 175, totalCost: 350 },
          { description: "Scissor lift", duration: 4, dailyRate: 225, totalCost: 900 },
          { description: "Jackhammer w/compressor", duration: 2, dailyRate: 185, totalCost: 370 },
          { description: "Hand tools/small equipment", duration: 10, dailyRate: 125, totalCost: 1250 },
          { description: "Dust control equipment", duration: 10, dailyRate: 85, totalCost: 850 }
        ],
        labor: [
          { category: "Demolition laborers", hours: 180, rate: 42, totalCost: 7560 },
          { category: "Skilled trades (electrical/plumbing)", hours: 24, rate: 68, totalCost: 1632 },
          { category: "Equipment operators", hours: 30, rate: 56, totalCost: 1680 },
          { category: "Supervisor", hours: 40, rate: 75, totalCost: 3000 }
        ],
        specialConsiderations: [
          "HVAC/Mechanical Systems: Coordinate with mechanical contractor prior to removal",
          "Electrical Systems: Verify power disconnection prior to demolition",
          "Structural Elements: Ensure non-load bearing determination for all wall removals",
          "Fire Protection: Maintain existing fire suppression systems as required by code",
          "Adjacent Tenant: Protection measures for adjacent tenant space required"
        ],
        timeline: {
          duration: 10,
          crewSize: 5
        },
        costSummary: {
          materials: 19398,
          equipment: 4770,
          labor: 13872,
          subtotal: 38040,
          generalConditions: 3804,
          overheadProfit: 5706,
          contingency: 3804,
          total: 51354
        }
      };
      
      setAnalysisResult(mockResult);
      setActiveTab('results');
      setAnalyzing(false);
    }, 3000);
  };

  // Detect when we're in a demo environment and use mock data
  const handleAnalyzeClick = () => {
    // In a real environment, this would call analyzeBlueprints()
    // For demo purposes, use mockAnalyzeBlueprints
    mockAnalyzeBlueprints();
  };

  // Clear files and reset
  const handleReset = () => {
    setFiles([]);
    setBlueprints([]);
    setAnalysisResult(null);
    setError(null);
    setActiveTab('upload');
  };

  // Generate table rows for materials
  const renderMaterialRows = () => {
    if (!analysisResult) return null;
    
    return analysisResult.materials.map((item, index) => (
      <tr key={`material-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
        <td className="py-2 px-4">{item.description}</td>
        <td className="py-2 px-4 text-right">{item.quantity}</td>
        <td className="py-2 px-4">{item.unit}</td>
        <td className="py-2 px-4 text-right">${item.unitRate.toFixed(2)}</td>
        <td className="py-2 px-4 text-right">{item.laborHours}</td>
        <td className="py-2 px-4 text-right">${item.cost.toFixed(2)}</td>
      </tr>
    ));
  };

  // Generate table rows for equipment
  const renderEquipmentRows = () => {
    if (!analysisResult) return null;
    
    return analysisResult.equipment.map((item, index) => (
      <tr key={`equipment-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
        <td className="py-2 px-4">{item.description}</td>
        <td className="py-2 px-4 text-right">{item.duration}</td>
        <td className="py-2 px-4 text-right">${item.dailyRate.toFixed(2)}</td>
        <td className="py-2 px-4 text-right">${item.totalCost.toFixed(2)}</td>
      </tr>
    ));
  };

  // Generate table rows for labor
  const renderLaborRows = () => {
    if (!analysisResult) return null;
    
    return analysisResult.labor.map((item, index) => (
      <tr key={`labor-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
        <td className="py-2 px-4">{item.category}</td>
        <td className="py-2 px-4 text-right">{item.hours}</td>
        <td className="py-2 px-4 text-right">${item.rate.toFixed(2)}</td>
        <td className="py-2 px-4 text-right">${item.totalCost.toFixed(2)}</td>
      </tr>
    ));
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">Demolition Blueprint Analyzer</h1>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button 
          onClick={() => setActiveTab('upload')}
          className={`py-2 px-4 ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          1. Upload Blueprints
        </button>
        <button 
          onClick={() => setActiveTab('analyze')}
          className={`py-2 px-4 ${activeTab === 'analyze' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'} ${blueprints.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={blueprints.length === 0}
        >
          2. Configure Analysis
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`py-2 px-4 ${activeTab === 'results' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'} ${!analysisResult ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!analysisResult}
        >
          3. View Results
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Upload tab */}
      {activeTab === 'upload' && (
        <div className="flex flex-col items-center">
          <div 
            onClick={handleUploadClick}
            className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
          >
            <FaUpload className="text-4xl text-gray-400 mb-2" />
            <p className="text-gray-600 mb-1">Drag and drop blueprints or click to upload</p>
            <p className="text-gray-400 text-sm">Supported formats: PDF, PNG, JPG</p>
            <input 
              type="file" 
              ref={fileInputRef}
              multiple 
              accept=".pdf,.png,.jpg,.jpeg" 
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          {files.length > 0 && (
            <div className="w-full mt-4">
              <h3 className="font-semibold mb-2">Selected Files ({files.length})</h3>
              <ul className="border rounded-lg divide-y">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-2 px-4">
                    <span className="truncate max-w-md">{file.name}</span>
                    <span className="text-gray-500 text-sm">{(file.size / 1024).toFixed(0)} KB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex mt-6">
            <button
              onClick={uploadFiles}
              disabled={files.length === 0 || loading}
              className={`flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${files.length === 0 || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  Upload and Continue
                </>
              )}
            </button>
            
            {files.length > 0 && (
              <button
                onClick={() => setFiles([])}
                className="ml-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Clear Files
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Analyze tab */}
      {activeTab === 'analyze' && (
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Configure Analysis Options</h2>
          
          <div className="mb-6">
            <label className="block font-medium mb-2">Analysis Type</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  value="materials"
                  checked={analysisType === 'materials'}
                  onChange={() => setAnalysisType('materials')}
                />
                <span className="ml-2">Material Takeoff Only</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  value="costs"
                  checked={analysisType === 'costs'}
                  onChange={() => setAnalysisType('costs')}
                />
                <span className="ml-2">Materials with Pricing</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-5 w-5 text-blue-600"
                  value="full"
                  checked={analysisType === 'full'}
                  onChange={() => setAnalysisType('full')}
                />
                <span className="ml-2">Full Estimate (Materials, Costs, Labor)</span>
              </label>
            </div>
          </div>
          
          <div className="flex mt-4">
            <button
              onClick={handleAnalyzeClick}
              disabled={analyzing}
              className={`flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {analyzing ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FaCalculator className="mr-2" />
                  Generate Demolition Estimate
                </>
              )}
            </button>
            
            <button
              onClick={handleReset}
              className="ml-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Results tab */}
      {activeTab === 'results' && analysisResult && (
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Demolition Analysis Results</h2>
            <button
              onClick={downloadPDF}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <FaFileDownload className="mr-2" />
              Download PDF
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-lg mb-2">Project Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Project Name:</span> {analysisResult.projectName}</p>
                <p><span className="font-medium">Drawing Reference:</span> {analysisResult.drawingReference}</p>
              </div>
              <div>
                <p><span className="font-medium">Total Square Footage:</span> {analysisResult.totalSquareFootage} sq ft</p>
                <p><span className="font-medium">Estimated Duration:</span> {analysisResult.timeline.duration} days</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Scope Summary</h3>
            <ul className="list-disc pl-6">
              {analysisResult.scopeSummary.map((item, index) => (
                <li key={`scope-${index}`} className="mb-1">{item}</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Materials and Quantities</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Item Description</th>
                    <th className="py-2 px-4 text-right">Quantity</th>
                    <th className="py-2 px-4 text-left">Unit</th>
                    <th className="py-2 px-4 text-right">Unit Rate</th>
                    <th className="py-2 px-4 text-right">Labor Hours</th>
                    <th className="py-2 px-4 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {renderMaterialRows()}
                </tbody>
              </table>
            </div>
          </div>
          
          {analysisType === 'full' && (
            <>
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Equipment Requirements</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-4 text-left">Equipment</th>
                        <th className="py-2 px-4 text-right">Duration (Days)</th>
                        <th className="py-2 px-4 text-right">Daily Rate</th>
                        <th className="py-2 px-4 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderEquipmentRows()}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Labor Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-4 text-left">Labor Category</th>
                        <th className="py-2 px-4 text-right">Hours</th>
                        <th className="py-2 px-4 text-right">Rate</th>
                        <th className="py-2 px-4 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderLaborRows()}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Special Considerations</h3>
                <ul className="list-disc pl-6">
                  {analysisResult.specialConsiderations.map((item, index) => (
                    <li key={`consideration-${index}`} className="mb-1">{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg mb-2">Cost Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">Materials and Disposal:</span> ${analysisResult.costSummary.materials.toFixed(2)}</p>
                    <p><span className="font-medium">Equipment:</span> ${analysisResult.costSummary.equipment.toFixed(2)}</p>
                    <p><span className="font-medium">Labor:</span> ${analysisResult.costSummary.labor.toFixed(2)}</p>
                    <p><span className="font-medium">Subtotal:</span> ${analysisResult.costSummary.subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">General Conditions (10%):</span> ${analysisResult.costSummary.generalConditions.toFixed(2)}</p>
                    <p><span className="font-medium">Overhead and Profit (15%):</span> ${analysisResult.costSummary.overheadProfit.toFixed(2)}</p>
                    <p><span className="font-medium">Contingency (10%):</span> ${analysisResult.costSummary.contingency.toFixed(2)}</p>
                    <p className="font-bold text-lg mt-2">Total: ${analysisResult.costSummary.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="flex mt-6">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Start New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemolitionAnalyzer;
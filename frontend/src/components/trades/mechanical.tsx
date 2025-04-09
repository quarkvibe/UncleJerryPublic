// HVAC Blueprint Analyzer Module for Uncle Jerry Blueprint Analyzer
// This module handles the specialized analysis of HVAC/mechanical blueprints

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { uploadBlueprint, analyzeBlueprint, saveTakeoff } from '../../services/apiService';
import UncleJerryCharacter from '../../components/UncleJerryCharacter';
import CostSummary from '../../components/CostSummary';
import MaterialsList from '../../components/MaterialsList';
import BlueprintViewer from '../../components/BlueprintViewer';
import { formatCurrency } from '../../utils/formatters';
import { BlueprintSection, AnalysisResult, HVACComponentType } from '../../types/blueprintTypes';

// HVAC-specific component types
export enum HVACSystemType {
  KITCHEN_EXHAUST = 'Kitchen Exhaust',
  MAKEUP_AIR = 'Makeup Air',
  ROOFTOP_EQUIPMENT = 'Rooftop Equipment',
  DUCTWORK = 'Ductwork',
  CONTROLS = 'Control Systems',
  REFRIGERATION = 'Refrigeration'
}

// HVAC-specific blueprint sections
export interface HVACBlueprintSection extends BlueprintSection {
  systemType: HVACSystemType;
  floor?: string;
  area?: string;
}

// HVAC-specific material item
export interface HVACMaterialItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  manufacturer?: string;
  model?: string;
  notes?: string;
}

// HVAC-specific labor item
export interface HVACLaborItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
  totalCost: number;
  category: string;
}

// HVAC-specific analysis result
export interface HVACAnalysisResult extends AnalysisResult {
  materials: HVACMaterialItem[];
  labor: HVACLaborItem[];
  additionalCosts: {
    name: string;
    cost: number;
  }[];
  systemTypes: HVACSystemType[];
  totalMaterialCost: number;
  totalLaborCost: number;
  totalAdditionalCost: number;
  subtotal: number;
  contingency: number;
  contingencyRate: number;
  grandTotal: number;
  estimatedTimelineWeeks: {
    min: number;
    max: number;
  };
  notes: string[];
}

// Main HVAC Analysis Component
const HVACBlueprintAnalyzer: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [blueprintSections, setBlueprintSections] = useState<HVACBlueprintSection[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<HVACAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [uncleJerryState, setUncleJerryState] = useState<'idle' | 'talking' | 'thinking'>('idle');
  const [uncleJerryMessage, setUncleJerryMessage] = useState<string>('');
  const [selectedSystemTypes, setSelectedSystemTypes] = useState<HVACSystemType[]>([]);

  // Handle image upload for blueprint sections
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setUploadedImages(prev => [...prev, ...files]);
      
      // Auto-create sections based on uploaded files
      const newSections: HVACBlueprintSection[] = files.map(file => ({
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name.replace(/\.\w+$/, ''),
        imageFile: file,
        systemType: detectSystemType(file.name),
        floor: '',
        area: ''
      }));
      
      setBlueprintSections(prev => [...prev, ...newSections]);
      
      // Update Uncle Jerry
      setUncleJerryState('talking');
      setUncleJerryMessage("Great! I see you've uploaded some HVAC blueprints. Let me know which systems you want me to analyze, and I'll get to work on the material takeoff.");
    }
  };

  // Attempt to detect HVAC system type from filename
  const detectSystemType = (filename: string): HVACSystemType => {
    const lowercaseName = filename.toLowerCase();
    
    if (lowercaseName.includes('kitchen') || lowercaseName.includes('exhaust') || lowercaseName.includes('hood')) {
      return HVACSystemType.KITCHEN_EXHAUST;
    } else if (lowercaseName.includes('makeup') || lowercaseName.includes('make up') || lowercaseName.includes('mau')) {
      return HVACSystemType.MAKEUP_AIR;
    } else if (lowercaseName.includes('roof') || lowercaseName.includes('rtu') || lowercaseName.includes('equipment')) {
      return HVACSystemType.ROOFTOP_EQUIPMENT;
    } else if (lowercaseName.includes('duct') || lowercaseName.includes('ventilation')) {
      return HVACSystemType.DUCTWORK;
    } else if (lowercaseName.includes('control') || lowercaseName.includes('panel')) {
      return HVACSystemType.CONTROLS;
    } else if (lowercaseName.includes('refrig') || lowercaseName.includes('cooler') || lowercaseName.includes('freezer')) {
      return HVACSystemType.REFRIGERATION;
    } else {
      return HVACSystemType.DUCTWORK; // Default
    }
  };

  // Update section details
  const updateSection = (id: string, updates: Partial<HVACBlueprintSection>) => {
    setBlueprintSections(prev => 
      prev.map(section => 
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  // Remove a section
  const removeSection = (id: string) => {
    setBlueprintSections(prev => prev.filter(section => section.id !== id));
  };

  // Toggle selected system type
  const toggleSystemType = (type: HVACSystemType) => {
    setSelectedSystemTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Start the HVAC blueprint analysis
  const startAnalysis = async () => {
    if (blueprintSections.length === 0) {
      setAnalysisError('Please upload at least one blueprint section');
      return;
    }
    
    if (selectedSystemTypes.length === 0) {
      setAnalysisError('Please select at least one system type to analyze');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setUncleJerryState('thinking');
      setUncleJerryMessage("I'm analyzing your HVAC blueprints now. This might take a minute or two - I'm looking at all the details to make sure we get an accurate estimate!");
      
      // First, upload all blueprint images
      const uploadedSections = await Promise.all(
        blueprintSections.map(async section => {
          if (section.imageFile) {
            const uploadResult = await uploadBlueprint(section.imageFile, projectId);
            return {
              ...section,
              imageUrl: uploadResult.imageUrl,
              imageId: uploadResult.imageId
            };
          }
          return section;
        })
      );
      
      // Create custom prompt for HVAC analysis based on selected system types
      const analysisPrompt = createHVACAnalysisPrompt(uploadedSections, selectedSystemTypes);
      
      // Send to API for Claude analysis
      const result = await analyzeBlueprint(
        uploadedSections.map(s => s.imageId),
        'hvac',
        analysisPrompt,
        projectId
      );
      
      // Process and structure the result
      const processedResult = processHVACAnalysisResult(result);
      setAnalysisResult(processedResult);
      
      // Update Uncle Jerry
      setUncleJerryState('talking');
      setUncleJerryMessage("All done! I've analyzed your HVAC blueprints and created a detailed material and cost estimate. Take a look at the summary below, and let me know if you need anything explained!");
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError('Error analyzing blueprints. Please try again.');
      setUncleJerryState('talking');
      setUncleJerryMessage("Oops! I ran into a problem while analyzing your blueprints. Let's try again, or maybe upload clearer images of the critical sections.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Create a specialized prompt for Claude based on HVAC system types
  const createHVACAnalysisPrompt = (
    sections: HVACBlueprintSection[], 
    systemTypes: HVACSystemType[]
  ): string => {
    const systemTypeDescriptions = {
      [HVACSystemType.KITCHEN_EXHAUST]: 'commercial kitchen exhaust systems, including hoods, ductwork, and fans',
      [HVACSystemType.MAKEUP_AIR]: 'makeup air units and associated ductwork and controls',
      [HVACSystemType.ROOFTOP_EQUIPMENT]: 'rooftop HVAC equipment, including curbs and structural supports',
      [HVACSystemType.DUCTWORK]: 'ductwork systems, including insulation, dampers, and diffusers',
      [HVACSystemType.CONTROLS]: 'HVAC control systems, including thermostats, sensors, and automation',
      [HVACSystemType.REFRIGERATION]: 'refrigeration systems, including condensing units and evaporators'
    };
    
    const systemDescriptions = systemTypes
      .map(type => systemTypeDescriptions[type])
      .join(', ');
    
    return `
      Analyze these HVAC/mechanical blueprint sections for a commercial building project.
      Focus specifically on ${systemDescriptions}.
      
      For each system identified, provide:
      1. A detailed list of required materials with quantities and standard unit costs
      2. Labor estimates for installation broken down by task
      3. Additional costs like permits, equipment rental, and testing
      4. Total project cost including a 10% contingency
      5. Estimated timeline for completion
      
      Present the results in a structured format that can be parsed programmatically.
      Include manufacturer recommendations where applicable based on what's shown in the blueprints.
      
      Identify any code requirements or special considerations visible in these plans.
    `;
  };

  // Process raw analysis results into structured data
  const processHVACAnalysisResult = (rawResult: any): HVACAnalysisResult => {
    // This would integrate with the Claude API response parser
    // For now, we'll create a mock structure based on your example
    
    // In a real implementation, this would parse Claude's response
    // and convert it to a structured format
    
    // Mock data structure for demonstration
    return {
      id: `analysis-${Date.now()}`,
      projectId: projectId || '',
      createdAt: new Date().toISOString(),
      tradeType: 'hvac',
      systemTypes: selectedSystemTypes,
      materials: [
        {
          id: 'm1',
          name: 'Kitchen Hood',
          description: 'Captiveaire 6024 ND-2-PSP-F, 11\'-7" length',
          category: 'Kitchen Exhaust',
          quantity: 1,
          unit: 'ea',
          unitCost: 8750,
          totalCost: 8750,
          manufacturer: 'Captiveaire',
          model: '6024 ND-2-PSP-F'
        },
        {
          id: 'm2',
          name: 'Exhaust Fan',
          description: 'Captiveaire utility set, 2037 CFM',
          category: 'Kitchen Exhaust',
          quantity: 1,
          unit: 'ea',
          unitCost: 3200,
          totalCost: 3200,
          manufacturer: 'Captiveaire'
        },
        // Additional materials would be here
      ],
      labor: [
        {
          id: 'l1',
          description: 'Kitchen Hood Installation',
          hours: 24,
          rate: 85,
          totalCost: 2040,
          category: 'Kitchen Exhaust'
        },
        {
          id: 'l2',
          description: 'Exhaust Ductwork Installation',
          hours: 48,
          rate: 85,
          totalCost: 4080,
          category: 'Ductwork'
        },
        // Additional labor items would be here
      ],
      additionalCosts: [
        { name: 'Permits and Inspections', cost: 2500 },
        { name: 'Crane/Lift Equipment', cost: 1800 },
        { name: 'System Design Verification', cost: 1250 },
        { name: 'Freight/Delivery', cost: 2750 }
      ],
      totalMaterialCost: 49160,
      totalLaborCost: 21130,
      totalAdditionalCost: 8300,
      subtotal: 78590,
      contingency: 7859,
      contingencyRate: 0.1,
      grandTotal: 86449,
      estimatedTimelineWeeks: {
        min: 11,
        max: 15
      },
      notes: [
        'All work must comply with local mechanical codes, Florida Building Code, and applicable local codes',
        'Kitchen hood installation must meet UL-1978 standards',
        'Grease duct system must maintain minimum 10\'-0" clearance from fresh air intakes',
        'All roof penetrations must be coordinated with roofing contractor'
      ]
    };
  };

  // Save the analysis result
  const saveAnalysisResult = async () => {
    if (!analysisResult) return;
    
    try {
      await saveTakeoff(analysisResult, projectId);
      setUncleJerryState('talking');
      setUncleJerryMessage("Great! I've saved this HVAC estimate to your project. You can access it anytime from your project dashboard.");
      
      // Navigate to the saved result
      setTimeout(() => {
        navigate(`/projects/${projectId}/takeoffs/${analysisResult.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error saving analysis:', error);
      setAnalysisError('Error saving analysis result. Please try again.');
    }
  };

  // Component JSX
  return (
    <Container fluid className="hvac-analyzer p-4">
      <Row className="mb-4">
        <Col md={3}>
          <UncleJerryCharacter 
            state={uncleJerryState} 
            message={uncleJerryMessage} 
          />
        </Col>
        <Col md={9}>
          <Card>
            <Card.Header as="h5">HVAC Blueprint Analysis</Card.Header>
            <Card.Body>
              <h6>Upload Blueprint Sections</h6>
              <p className="text-muted">
                Upload specific sections of your HVAC blueprints for analysis. 
                For best results, include clear images of equipment schedules, 
                duct layouts, and mechanical details.
              </p>
              <Form.Group className="mb-3">
                <Form.Label>Upload HVAC Blueprint Sections</Form.Label>
                <Form.Control 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {blueprintSections.length > 0 && (
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <Card.Header as="h5">Blueprint Sections</Card.Header>
              <Card.Body>
                <Row>
                  {blueprintSections.map(section => (
                    <Col md={4} key={section.id} className="mb-3">
                      <Card>
                        <Card.Img 
                          variant="top" 
                          src={section.imageUrl || URL.createObjectURL(section.imageFile as File)} 
                          alt={section.name} 
                          style={{ height: '200px', objectFit: 'cover' }} 
                        />
                        <Card.Body>
                          <Form.Group className="mb-2">
                            <Form.Label>Section Name</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={section.name} 
                              onChange={(e) => updateSection(section.id, { name: e.target.value })} 
                            />
                          </Form.Group>
                          <Form.Group className="mb-2">
                            <Form.Label>System Type</Form.Label>
                            <Form.Select 
                              value={section.systemType}
                              onChange={(e) => updateSection(section.id, { 
                                systemType: e.target.value as HVACSystemType 
                              })}
                            >
                              {Object.values(HVACSystemType).map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="mt-2" 
                            onClick={() => removeSection(section.id)}
                          >
                            Remove
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {blueprintSections.length > 0 && (
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <Card.Header as="h5">Analysis Options</Card.Header>
              <Card.Body>
                <h6>Select Systems to Analyze</h6>
                <Row>
                  {Object.values(HVACSystemType).map(type => (
                    <Col md={4} key={type}>
                      <Form.Check 
                        type="checkbox"
                        id={`system-${type}`}
                        label={type}
                        checked={selectedSystemTypes.includes(type)}
                        onChange={() => toggleSystemType(type)}
                        className="mb-2"
                      />
                    </Col>
                  ))}
                </Row>
                
                <div className="d-grid gap-2 mt-4">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={startAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Analyzing...
                      </>
                    ) : 'Start HVAC Analysis'}
                  </Button>
                </div>
                
                {analysisError && (
                  <Alert variant="danger" className="mt-3">
                    {analysisError}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {analysisResult && (
        <>
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header as="h5">HVAC Material Takeoff Results</Card.Header>
                <Card.Body>
                  <h4 className="mb-3">Project Summary</h4>
                  <Row>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Body>
                          <h5>Cost Summary</h5>
                          <p><strong>Materials:</strong> {formatCurrency(analysisResult.totalMaterialCost)}</p>
                          <p><strong>Labor:</strong> {formatCurrency(analysisResult.totalLaborCost)}</p>
                          <p><strong>Additional Costs:</strong> {formatCurrency(analysisResult.totalAdditionalCost)}</p>
                          <p><strong>Subtotal:</strong> {formatCurrency(analysisResult.subtotal)}</p>
                          <p><strong>Contingency ({analysisResult.contingencyRate * 100}%):</strong> {formatCurrency(analysisResult.contingency)}</p>
                          <h5 className="text-primary mt-3">Total Project Estimate: {formatCurrency(analysisResult.grandTotal)}</h5>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Body>
                          <h5>Project Timeline</h5>
                          <p>Estimated Duration: {analysisResult.estimatedTimelineWeeks.min}-{analysisResult.estimatedTimelineWeeks.max} weeks</p>
                          <h5 className="mt-3">Systems Included</h5>
                          <ul>
                            {analysisResult.systemTypes.map(type => (
                              <li key={type}>{type}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <h4 className="mb-3 mt-4">Materials List</h4>
                  <MaterialsList
                    materials={analysisResult.materials}
                    groupByCategory={true}
                  />
                  
                  <h4 className="mb-3 mt-4">Labor Estimate</h4>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Hours</th>
                        <th>Rate</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.labor.map(item => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td>{item.hours}</td>
                          <td>{formatCurrency(item.rate)}/hr</td>
                          <td>{formatCurrency(item.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={3}>Total Labor</th>
                        <th>{formatCurrency(analysisResult.totalLaborCost)}</th>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <h4 className="mb-3 mt-4">Additional Costs</h4>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.additionalCosts.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{formatCurrency(item.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>Total Additional Costs</th>
                        <th>{formatCurrency(analysisResult.totalAdditionalCost)}</th>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <h4 className="mb-3 mt-4">Project Notes</h4>
                  <ul className="list-group">
                    {analysisResult.notes.map((note, index) => (
                      <li key={index} className="list-group-item">{note}</li>
                    ))}
                  </ul>
                  
                  <div className="d-grid gap-2 mt-4">
                    <Button 
                      variant="success" 
                      size="lg" 
                      onClick={saveAnalysisResult}
                    >
                      Save HVAC Estimate
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default HVACBlueprintAnalyzer;

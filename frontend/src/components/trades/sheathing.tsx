import React, { useState, useEffect, useContext } from 'react';
import { Button, Card, Table, Tabs, Select, Spin, Alert, Form, Input, Space, Typography, Tooltip } from 'antd';
import { FileImageOutlined, CalculatorOutlined, SaveOutlined, InfoCircleOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { BlueprintContext } from '../../context/BlueprintContext';
import { CharacterContext } from '../../context/CharacterContext';
import { useAuth } from '../../hooks/useAuth';
// Use standard import without .ts extension
import { calculateWallSheathing } from '../../utils/sheathingCalculator';
import { SheatheSection, SheatheType, SheatheResult } from '../../types/sheathing';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Wall sheathing types with descriptions from standard construction practices
const SHEATHING_TYPES: SheatheType[] = [
  { 
    code: 'P', 
    name: 'FRT Plywood with Cement Board Base', 
    description: '1/2" FRT plywood or OSB sheathing with 8" strip of cement board at base',
    unitCost: 1.85, // Cost per sq ft
    standardSize: { width: 4, height: 8 }, // Standard 4x8 sheet
  },
  { 
    code: 'PG', 
    name: 'FRT Plywood with Cement Board Base + Gypsum', 
    description: '1/2" FRT plywood or OSB sheathing with 8" strip of cement board at base + 1/2" gypsum wallboard',
    unitCost: 2.25,
    standardSize: { width: 4, height: 8 },
  },
  { 
    code: 'PT', 
    name: 'FRT Plywood with Cement Board Base + Tile Backer', 
    description: '1/2" FRT plywood or OSB sheathing with 8" strip of cement board at base + 7/8" tile backer board',
    unitCost: 2.75,
    standardSize: { width: 4, height: 8 },
  },
  { 
    code: 'CB', 
    name: 'Fiber Cement Board', 
    description: '1/2" fiber cement board',
    unitCost: 2.35,
    standardSize: { width: 4, height: 8 },
  },
  { 
    code: 'UL', 
    name: 'Fire-Rated Cement Board', 
    description: '5/8" cement board sheathing on both sides (UL263)',
    unitCost: 3.50,
    standardSize: { width: 4, height: 8 },
  },
  { 
    code: 'L2', 
    name: 'Double Layer Gypsum Board', 
    description: '(2) layers of 5/8" gyp. board sheathing on both sides, mineral wood batts between studs (UL U419)',
    unitCost: 3.25,
    standardSize: { width: 4, height: 8 },
  },
  { 
    code: 'E', 
    name: 'Exterior Grade Plywood', 
    description: '1/2" exterior grade plywood sheathing',
    unitCost: 1.65,
    standardSize: { width: 4, height: 8 },
  },
];

// Default wall height for commercial projects
const DEFAULT_WALL_HEIGHT = 10; // feet
// Default waste factor percentage
const DEFAULT_WASTE_FACTOR = 10; // 10%

interface SheathingAnalyzerProps {
  onSave?: (result: SheatheResult) => void;
}

const WallSheathingAnalyzer: React.FC<SheathingAnalyzerProps> = ({ onSave }) => {
  // Mocked context values for compilation with proper typing
  const blueprints: File[] = [];
  const blueprintLoading = false;
  const blueprintError = null;
  const character = { state: 'idle', message: '' };
  const setCharacterState = (state: string) => {};
  const { user } = useAuth();

  // Local state
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [wallSections, setWallSections] = useState<SheatheSection[]>([]);
  const [currentWallHeight, setCurrentWallHeight] = useState<number>(DEFAULT_WALL_HEIGHT);
  const [wasteFactor, setWasteFactor] = useState<number>(DEFAULT_WASTE_FACTOR);
  const [aiSuggestions, setAiSuggestions] = useState<SheatheSection[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<SheatheResult | null>(null);
  const [form] = Form.useForm();

  // Initialize AI suggestions when blueprints are loaded
  useEffect(() => {
    if (blueprints && blueprints.length > 0 && activeTab === 'ai') {
      generateAiSuggestions();
    }
  }, [blueprints, activeTab]);

  // Set character to 'thinking' state during processing
  useEffect(() => {
    if (processing) {
      setCharacterState('thinking');
    } else {
      setCharacterState('idle');
    }
  }, [processing, setCharacterState]);

  // Generate AI suggestions for wall sections based on blueprint analysis
  const generateAiSuggestions = async () => {
    setProcessing(true);
    try {
      // This would call your Claude API integration
      // For now, we'll simulate with sample data
      setTimeout(() => {
        const sampleSuggestions: SheatheSection[] = [
          { id: 'ai-1', name: 'Exterior front (south)', type: 'E', length: 62, height: 10 },
          { id: 'ai-2', name: 'Exterior side (east)', type: 'E', length: 45, height: 10 },
          { id: 'ai-3', name: 'Exterior side (west)', type: 'E', length: 39, height: 10 },
          { id: 'ai-4', name: 'Exterior rear (north)', type: 'E', length: 52, height: 10 },
          { id: 'ai-5', name: 'Freezer enclosure', type: 'P', length: 74, height: 10 },
          { id: 'ai-6', name: 'Cooler enclosure', type: 'P', length: 62, height: 10 },
          { id: 'ai-7', name: 'Restroom area walls', type: 'PG', length: 42, height: 10 },
          { id: 'ai-8', name: 'Wash area walls', type: 'UL', length: 66, height: 10 },
          { id: 'ai-9', name: 'Office walls', type: 'PG', length: 25, height: 10 },
          { id: 'ai-10', name: 'Serving counter', type: 'PT', length: 14, height: 10 },
          { id: 'ai-11', name: 'Dining area walls', type: 'CB', length: 36, height: 10 },
        ];
        
        setAiSuggestions(sampleSuggestions);
        setProcessing(false);
        
        // Trigger Uncle Jerry to talk about the findings
        setCharacterState('talking');
        setTimeout(() => setCharacterState('idle'), 5000);
      }, 2000);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setProcessing(false);
    }
  };

  // Add a new empty wall section to the manual input
  const addWallSection = () => {
    const newSection: SheatheSection = {
      id: `manual-${Date.now()}`,
      name: '',
      type: 'E', // Default to exterior grade plywood
      length: 0,
      height: currentWallHeight,
    };
    setWallSections([...wallSections, newSection]);
  };

  // Remove a wall section from the manual input
  const removeWallSection = (id: string) => {
    setWallSections(wallSections.filter(section => section.id !== id));
  };

  // Update a wall section in the manual input
  const updateWallSection = (id: string, field: keyof SheatheSection, value: any) => {
    setWallSections(
      wallSections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  // Accept all AI suggestions into the wall sections
  const acceptAiSuggestions = () => {
    setWallSections(aiSuggestions.map(suggestion => ({
      ...suggestion,
      id: `manual-${suggestion.id}` // Ensure IDs don't conflict
    })));
    setActiveTab('manual');
  };

  // Accept a single AI suggestion into the wall sections
  const acceptSingleSuggestion = (suggestion: SheatheSection) => {
    const existingIds = new Set(wallSections.map(s => s.id));
    if (!existingIds.has(`manual-${suggestion.id}`)) {
      setWallSections([
        ...wallSections, 
        { ...suggestion, id: `manual-${suggestion.id}` }
      ]);
    }
  };

  // Calculate takeoff based on current wall sections
  const calculateTakeoff = () => {
    if (wallSections.length === 0) {
      return;
    }

    setProcessing(true);
    
    // This would call your calculation function
    // Get the active sheathing type from the first wall section as a default
    const firstSectionType = wallSections[0]?.type || 'E';
    const sheathingType = SHEATHING_TYPES.find(t => t.code === firstSectionType) || SHEATHING_TYPES[0];
    const calculationResults = calculateWallSheathing(wallSections, sheathingType, wasteFactor);
    
    setResults(calculationResults);
    setProcessing(false);
    
    // Trigger Uncle Jerry to talk about the results
    setCharacterState('talking');
    setTimeout(() => setCharacterState('idle'), 3000);
  };

  // Save the current results
  const saveResults = () => {
    if (results && onSave) {
      onSave(results);
      // Show success message via character
      setCharacterState('talking');
      setTimeout(() => setCharacterState('idle'), 2000);
    }
  };

  // Calculate the total for all materials
  const calculateTotal = () => {
    if (!results) return 0;
    
    return results.totalsByType.reduce(
      (total, typeResult) => total + typeResult.materialCost, 
      0
    );
  };

  return (
    <div className="wall-sheathing-analyzer">
      <Card 
        title={<Title level={4}>Wall Sheathing Analyzer</Title>}
        extra={
          <Space>
            {results && (
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={saveResults}
                disabled={!user}
              >
                Save Results
              </Button>
            )}
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<span><FileImageOutlined /> Blueprint Analysis</span>} 
            key="ai"
          >
            <div className="ai-analysis-container">
              {blueprintLoading ? (
                <div className="loading-container">
                  <Spin size="large" />
                  <Paragraph>Analyzing blueprints...</Paragraph>
                </div>
              ) : blueprintError ? (
                <Alert 
                  type="error" 
                  message="Error Loading Blueprints" 
                  description="There was an error loading the blueprint files. Please try again."
                  showIcon
                />
              ) : blueprints.length === 0 ? (
                <Alert
                  type="info"
                  message="No Blueprints Uploaded"
                  description="Please upload blueprint files to enable AI analysis."
                  showIcon
                />
              ) : (
                <>
                  <div className="control-panel">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Paragraph>
                        <InfoCircleOutlined /> AI will analyze your blueprints to suggest wall sections and recommend appropriate sheathing types.
                      </Paragraph>
                      
                      <Space>
                        <Button 
                          type="primary" 
                          onClick={generateAiSuggestions} 
                          loading={processing}
                          disabled={!blueprints || blueprints.length === 0}
                        >
                          Generate AI Suggestions
                        </Button>
                        
                        {aiSuggestions.length > 0 && (
                          <Button 
                            type="default" 
                            onClick={acceptAiSuggestions}
                          >
                            Accept All Suggestions
                          </Button>
                        )}
                      </Space>
                    </Space>
                  </div>
                  
                  {aiSuggestions.length > 0 && (
                    <Table
                      dataSource={aiSuggestions}
                      rowKey="id"
                      pagination={false}
                      style={{ marginTop: 20 }}
                      columns={[
                        {
                          title: 'Wall Section',
                          dataIndex: 'name',
                          key: 'name',
                        },
                        {
                          title: 'Type',
                          dataIndex: 'type',
                          key: 'type',
                          render: (type) => {
                            const sheathingType = SHEATHING_TYPES.find(t => t.code === type);
                            return (
                              <Tooltip title={sheathingType?.description}>
                                {type} - {sheathingType?.name}
                              </Tooltip>
                            );
                          }
                        },
                        {
                          title: 'Length (ft)',
                          dataIndex: 'length',
                          key: 'length',
                        },
                        {
                          title: 'Height (ft)',
                          dataIndex: 'height',
                          key: 'height',
                        },
                        {
                          title: 'Area (sq ft)',
                          key: 'area',
                          render: (_, record) => (record.length * record.height).toFixed(1),
                        },
                        {
                          title: 'Action',
                          key: 'action',
                          render: (_, record) => (
                            <Button 
                              type="link" 
                              onClick={() => acceptSingleSuggestion(record)}
                            >
                              Add to Manual
                            </Button>
                          ),
                        },
                      ]}
                      summary={(data) => {
                        const totalArea = data.reduce((sum, section) => 
                          sum + (section.length * section.height), 0
                        );
                        
                        return (
                          <>
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0} colSpan={4}>
                                <Text strong>Total Area</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1}>
                                <Text strong>{totalArea.toFixed(1)} sq ft</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={2} />
                            </Table.Summary.Row>
                          </>
                        );
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </TabPane>
          
          <TabPane 
            tab={<span><CalculatorOutlined /> Manual Input</span>} 
            key="manual"
          >
            <div className="manual-input-container">
              <Form
                form={form}
                layout="vertical"
              >
                <div className="control-panel">
                  <Space>
                    <Form.Item label="Default Wall Height (ft)">
                      <Input
                        type="number"
                        min={1}
                        value={currentWallHeight}
                        onChange={(e) => setCurrentWallHeight(parseFloat(e.target.value) || DEFAULT_WALL_HEIGHT)}
                        style={{ width: 100 }}
                      />
                    </Form.Item>
                    
                    <Form.Item label="Waste Factor (%)">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={wasteFactor}
                        onChange={(e) => setWasteFactor(parseFloat(e.target.value) || DEFAULT_WASTE_FACTOR)}
                        style={{ width: 100 }}
                      />
                    </Form.Item>
                    
                    <Form.Item>
                      <Button 
                        type="primary" 
                        onClick={addWallSection}
                        icon={<PlusOutlined />}
                      >
                        Add Wall Section
                      </Button>
                    </Form.Item>
                  </Space>
                </div>
                
                {wallSections.length > 0 ? (
                  <>
                    <Table
                      dataSource={wallSections}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: 'Wall Section Name',
                          dataIndex: 'name',
                          key: 'name',
                          render: (text, record) => (
                            <Input
                              value={text}
                              onChange={(e) => updateWallSection(record.id, 'name', e.target.value)}
                              placeholder="Enter section name"
                            />
                          ),
                        },
                        {
                          title: 'Sheathing Type',
                          dataIndex: 'type',
                          key: 'type',
                          render: (text, record) => (
                            <Select
                              value={text}
                              onChange={(value) => updateWallSection(record.id, 'type', value)}
                              style={{ width: 120 }}
                            >
                              {SHEATHING_TYPES.map(type => (
                                <Option 
                                  key={type.code} 
                                  value={type.code}
                                  title={type.description}
                                >
                                  {type.code} - {type.name.substring(0, 12)}...
                                </Option>
                              ))}
                            </Select>
                          ),
                        },
                        {
                          title: 'Length (ft)',
                          dataIndex: 'length',
                          key: 'length',
                          render: (text, record) => (
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={text}
                              onChange={(e) => updateWallSection(record.id, 'length', parseFloat(e.target.value) || 0)}
                              style={{ width: 80 }}
                            />
                          ),
                        },
                        {
                          title: 'Height (ft)',
                          dataIndex: 'height',
                          key: 'height',
                          render: (text, record) => (
                            <Input
                              type="number"
                              min={0}
                              step={0.1}
                              value={text}
                              onChange={(e) => updateWallSection(record.id, 'height', parseFloat(e.target.value) || 0)}
                              style={{ width: 80 }}
                            />
                          ),
                        },
                        {
                          title: 'Area (sq ft)',
                          key: 'area',
                          render: (_, record) => (record.length * record.height).toFixed(1),
                        },
                        {
                          title: 'Action',
                          key: 'action',
                          render: (_, record) => (
                            <Button
                              type="text"
                              danger
                              icon={<MinusOutlined />}
                              onClick={() => removeWallSection(record.id)}
                            />
                          ),
                        },
                      ]}
                      summary={(data) => {
                        const totalArea = data.reduce((sum, section) => 
                          sum + (section.length * section.height), 0
                        );
                        
                        return (
                          <>
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0} colSpan={4}>
                                <Text strong>Total Area</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1}>
                                <Text strong>{totalArea.toFixed(1)} sq ft</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={2} />
                            </Table.Summary.Row>
                          </>
                        );
                      }}
                    />
                    
                    <div style={{ marginTop: 20, textAlign: 'right' }}>
                      <Button
                        type="primary"
                        onClick={calculateTakeoff}
                        loading={processing}
                        disabled={wallSections.length === 0}
                      >
                        Calculate Takeoff
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert
                    type="info"
                    message="No Wall Sections Added"
                    description="Add wall sections to begin your takeoff calculation or use the AI Analysis tab to generate suggestions."
                    showIcon
                  />
                )}
              </Form>
            </div>
          </TabPane>
        </Tabs>
        
        {results && (
          <div className="results-container" style={{ marginTop: 20 }}>
            <Title level={4}>Wall Sheathing Takeoff Results</Title>
            
            <Tabs defaultActiveKey="summary">
              <TabPane tab="Summary" key="summary">
                <Table
                  dataSource={results.totalsByType}
                  rowKey="type"
                  pagination={false}
                  columns={[
                    {
                      title: 'Type',
                      dataIndex: 'type',
                      key: 'type',
                    },
                    {
                      title: 'Description',
                      dataIndex: 'description',
                      key: 'description',
                      ellipsis: true,
                    },
                    {
                      title: 'Total Area (sq ft)',
                      dataIndex: 'totalArea',
                      key: 'totalArea',
                      render: (value) => value.toFixed(1),
                    },
                    {
                      title: 'Sheets Required',
                      dataIndex: 'sheetsRequired',
                      key: 'sheetsRequired',
                    },
                    {
                      title: 'Material Cost',
                      dataIndex: 'materialCost',
                      key: 'materialCost',
                      render: (value) => `$${value.toFixed(2)}`,
                    },
                  ]}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>{results.totalSheets}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong>${calculateTotal().toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
                
                <div style={{ marginTop: 20 }}>
                  <Alert
                    type="info"
                    message="Additional Requirements"
                    description={
                      <>
                        <Paragraph>
                          For wall types P, PG, and PT, an 8" strip of cement board is required at the base.
                        </Paragraph>
                        <ul>
                          <li>Total linear feet requiring base cement board: {results.cementBoardBaseRequirements.linearFeet.toFixed(1)} ft</li>
                          <li>Required 8" wide cement board: {results.cementBoardBaseRequirements.areaNeeded.toFixed(1)} sq ft</li>
                          <li>Cement board sheets required (4'×8'): {results.cementBoardBaseRequirements.sheetsRequired}</li>
                        </ul>
                      </>
                    }
                    showIcon
                  />
                </div>
              </TabPane>
              
              <TabPane tab="Detail" key="detail">
                <Table
                  dataSource={results.sections}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'Wall Section',
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: 'Sheathing Type',
                      dataIndex: 'type',
                      key: 'type',
                      render: (type) => {
                        const sheathingType = SHEATHING_TYPES.find(t => t.code === type);
                        return (
                          <Tooltip title={sheathingType?.description}>
                            {type} - {sheathingType?.name}
                          </Tooltip>
                        );
                      }
                    },
                    {
                      title: 'Length (ft)',
                      dataIndex: 'length',
                      key: 'length',
                      render: (value) => value.toFixed(1),
                    },
                    {
                      title: 'Height (ft)',
                      dataIndex: 'height',
                      key: 'height',
                      render: (value) => value.toFixed(1),
                    },
                    {
                      title: 'Area (sq ft)',
                      dataIndex: 'area',
                      key: 'area',
                      render: (value) => value.toFixed(1),
                    },
                    {
                      title: 'Material Cost',
                      dataIndex: 'materialCost',
                      key: 'materialCost',
                      render: (value) => `$${value.toFixed(2)}`,
                    },
                  ]}
                />
              </TabPane>
              
              <TabPane tab="Notes" key="notes">
                <div className="notes-container">
                  <Paragraph>
                    <ul>
                      <li>Sheet quantities include a {wasteFactor}% waste factor</li>
                      <li>Standard sheet size assumed to be 4'×8' (32 sq ft per sheet)</li>
                      <li>Wall heights as specified in input</li>
                      <li>Material costs are estimates based on current market rates</li>
                      <li>Local building codes may require specific sheathing types or fire ratings</li>
                      <li>Consult with project architect or engineer for specific requirements</li>
                    </ul>
                  </Paragraph>
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WallSheathingAnalyzer;
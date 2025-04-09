import React, { useState, useEffect, useContext } from 'react';
import { Button, Card, Table, Tabs, Select, Spin, Alert, Form, Input, Space, Typography, Tooltip, InputNumber, Divider, Checkbox } from 'antd';
import { FileImageOutlined, CalculatorOutlined, SaveOutlined, InfoCircleOutlined, PlusOutlined, MinusOutlined, EditOutlined, CopyOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { BlueprintContext } from '../../context/BlueprintContext';
import { CharacterContext } from '../../context/CharacterContext';
import { useAuth } from '../../hooks/useAuth';
import { calculateAcousticalCeiling } from '../../utils/acousticalcalculator';
import { AcousticalSection, AcousticalType, AcousticalResult } from '../../types/acoustical';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Acoustical ceiling types with descriptions from standard construction practices
const ACOUSTICAL_TYPES: AcousticalType[] = [
  { 
    code: 'ACP', 
    name: '2x4 Acoustical Ceiling Panel', 
    description: '2x4 Acoustical Ceiling Panel, Paint P-2',
    unitCost: 3.25, // Cost per sq ft
    standardSize: { width: 2, height: 4 }, // Standard 2x4 tile
  },
  { 
    code: 'ACT', 
    name: '2x2 Acoustical Ceiling Tile', 
    description: '2x2 Acoustical Ceiling Tile (Washable)',
    unitCost: 3.75,
    standardSize: { width: 2, height: 2 },
  },
  { 
    code: 'GYP', 
    name: 'Gypsum Board Ceiling', 
    description: 'Gypsum Board Ceiling - See plan for paint color',
    unitCost: 2.95,
    standardSize: { width: 4, height: 8 },
  },
  { 
    code: 'W-2', 
    name: 'Cypress Wood Ceiling Planks', 
    description: 'Cypress Wood Ceiling Planks',
    unitCost: 11.50,
    standardSize: { width: 0.5, height: 8 },
  },
  { 
    code: 'OPEN', 
    name: 'Open Ceiling (No Material)', 
    description: 'Open Ceiling Areas with Exposed Structure',
    unitCost: 0,
    standardSize: { width: 0, height: 0 },
  },
];

// Default ceiling height for commercial projects
const DEFAULT_CEILING_HEIGHT = 10; // feet
// Default waste factor percentage
const DEFAULT_WASTE_FACTOR = 10; // 10%

interface AcousticalAnalyzerProps {
  onSave?: (result: AcousticalResult) => void;
}

const AcousticalCeilingAnalyzer: React.FC<AcousticalAnalyzerProps> = ({ onSave }) => {
  // Access blueprint context with adjusted destructuring to match actual properties
  const { blueprints, selectedBlueprints } = useContext(BlueprintContext);
  // Access character context with adjusted properties
  const { characterState, setCharacterState } = useContext(CharacterContext);
  const { user } = useAuth();
  
  // Define local loading and error states that were previously expected from context
  const [blueprintLoading, setBlueprintLoading] = useState<boolean>(false);
  const [blueprintError, setBlueprintError] = useState<string | null>(null);

  // Local state
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [ceilingSections, setCeilingSections] = useState<AcousticalSection[]>([]);
  const [wasteFactor, setWasteFactor] = useState<number>(DEFAULT_WASTE_FACTOR);
  const [includeGridSystem, setIncludeGridSystem] = useState<boolean>(true);
  const [aiSuggestions, setAiSuggestions] = useState<AcousticalSection[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<AcousticalResult | null>(null);
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

  // Generate AI suggestions for ceiling sections based on blueprint analysis
  const generateAiSuggestions = async () => {
    setProcessing(true);
    try {
      // This would call your Claude API integration
      // For now, we'll simulate with sample data based on our previous analysis
      setTimeout(() => {
        const sampleSuggestions: AcousticalSection[] = [
          { id: 'ai-1', name: 'Kitchen/BOH Areas', type: 'ACP', area: 1075 },
          { id: 'ai-2', name: 'Office Area', type: 'ACP', area: 65 },
          { id: 'ai-3', name: 'Restroom Areas', type: 'ACT', area: 115 },
          { id: 'ai-4', name: 'Vestibule', type: 'ACT', area: 35 },
          { id: 'ai-5', name: 'Dining Area Perimeter Soffits', type: 'GYP', area: 160 },
          { id: 'ai-6', name: 'Dining Area Ceiling Clouds (3)', type: 'GYP', area: 380 },
          { id: 'ai-7', name: 'Front Counter Ceiling Cloud', type: 'GYP', area: 120 },
          { id: 'ai-8', name: 'Bulkheads/Soffits Throughout', type: 'GYP', area: 240 },
          { id: 'ai-9', name: 'Freezer/Cooler Soffit Framing', type: 'GYP', area: 110 },
          { id: 'ai-10', name: 'Dining Area Main Ceiling', type: 'W-2', area: 825 },
          { id: 'ai-11', name: 'Exposed Structure Areas', type: 'OPEN', area: 75 },
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

  // Add a new empty ceiling section to the manual input
  const addCeilingSection = () => {
    const newSection: AcousticalSection = {
      id: `manual-${Date.now()}`,
      name: '',
      type: 'ACP', // Default to 2x4 acoustical ceiling panel
      area: 0,
    };
    setCeilingSections([...ceilingSections, newSection]);
  };

  // Remove a ceiling section from the manual input
  const removeCeilingSection = (id: string) => {
    setCeilingSections(ceilingSections.filter(section => section.id !== id));
  };

  // Update a ceiling section in the manual input
  const updateCeilingSection = (id: string, field: keyof AcousticalSection, value: any) => {
    setCeilingSections(
      ceilingSections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  // Accept all AI suggestions into the ceiling sections
  const acceptAiSuggestions = () => {
    setCeilingSections(aiSuggestions.map(suggestion => ({
      ...suggestion,
      id: `manual-${suggestion.id}` // Ensure IDs don't conflict
    })));
    setActiveTab('manual');
  };

  // Accept a single AI suggestion into the ceiling sections
  const acceptSingleSuggestion = (suggestion: AcousticalSection) => {
    const existingIds = new Set(ceilingSections.map(s => s.id));
    if (!existingIds.has(`manual-${suggestion.id}`)) {
      setCeilingSections([
        ...ceilingSections, 
        { ...suggestion, id: `manual-${suggestion.id}` }
      ]);
    }
  };

  // Calculate takeoff based on current ceiling sections
  const calculateTakeoff = () => {
    if (ceilingSections.length === 0) {
      return;
    }

    setProcessing(true);
    
    // This would call your calculation function
    const calculationResults = calculateAcousticalCeiling(
      ceilingSections, 
      ACOUSTICAL_TYPES, 
      wasteFactor,
      includeGridSystem
    );
    
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

  // Create dimensions input helper for rectangular rooms
  const showDimensionHelper = () => {
    const values = form.getFieldsValue();
    const length = parseFloat(values.roomLength || 0);
    const width = parseFloat(values.roomWidth || 0);
    
    if (length > 0 && width > 0) {
      const newSection: AcousticalSection = {
        id: `manual-${Date.now()}`,
        name: `Area ${ceilingSections.length + 1} (${length}' x ${width}')`,
        type: values.ceilingType || 'ACP',
        area: length * width,
      };
      
      setCeilingSections([...ceilingSections, newSection]);
      form.resetFields(['roomLength', 'roomWidth', 'ceilingType']);
    }
  };

  // Export results to CSV
  const exportToCSV = () => {
    if (!results) return;
    
    let csv = 'Ceiling Section,Material Type,Area (sq ft),Material Cost\n';
    
    // Add ceiling sections
    results.sections.forEach(section => {
      csv += `"${section.name}","${section.type}",${section.area.toFixed(1)},$${section.materialCost!.toFixed(2)}\n`;
    });
    
    // Add blank line and summary
    csv += '\n"Total By Type","Description","Total Area (sq ft)","Units Required","Material Cost"\n';
    
    // Add type totals
    results.totalsByType.forEach(typeResult => {
      csv += `"${typeResult.type}","${typeResult.description}",${typeResult.totalArea.toFixed(1)},${typeResult.unitsRequired},$${typeResult.materialCost.toFixed(2)}\n`;
    });
    
    // Add grand total
    csv += `\n"GRAND TOTAL","All Types",${results.totalArea.toFixed(1)},,$${results.totalsByType.reduce((sum, type) => sum + type.materialCost, 0).toFixed(2)}\n`;
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'acoustical_ceiling_takeoff.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="acoustical-ceiling-analyzer">
      <Card 
        title={<Title level={4}>Acoustical Ceiling Analyzer</Title>}
        extra={
          <Space>
            {results && (
              <>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveResults}
                  disabled={!user}
                >
                  Save Results
                </Button>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={exportToCSV}
                >
                  Export CSV
                </Button>
              </>
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
                        <InfoCircleOutlined /> AI will analyze your blueprints to suggest ceiling areas and recommend appropriate materials.
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
                          title: 'Ceiling Area',
                          dataIndex: 'name',
                          key: 'name',
                        },
                        {
                          title: 'Type',
                          dataIndex: 'type',
                          key: 'type',
                          render: (type) => {
                            const acousticalType = ACOUSTICAL_TYPES.find(t => t.code === type);
                            return (
                              <Tooltip title={acousticalType?.description}>
                                {type} - {acousticalType?.name}
                              </Tooltip>
                            );
                          }
                        },
                        {
                          title: 'Area (sq ft)',
                          dataIndex: 'area',
                          key: 'area',
                          render: (area) => area.toFixed(1),
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
                          sum + section.area, 0
                        );
                        
                        return (
                          <>
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0} colSpan={2}>
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
                  <Space align="start" style={{ marginBottom: 20 }}>
                    <Form.Item label="Waste Factor (%)">
                      <InputNumber
                        min={0}
                        max={100}
                        value={wasteFactor}
                        onChange={(value) => setWasteFactor(value || DEFAULT_WASTE_FACTOR)}
                        style={{ width: 100 }}
                      />
                    </Form.Item>
                    
                    <Form.Item label="Grid System">
                      <Checkbox 
                        checked={includeGridSystem}
                        onChange={(e) => setIncludeGridSystem(e.target.checked)}
                      >
                        Include ceiling grid system
                      </Checkbox>
                    </Form.Item>
                    
                    <Form.Item>
                      <Button 
                        type="primary" 
                        onClick={addCeilingSection}
                        icon={<PlusOutlined />}
                      >
                        Add Ceiling Section
                      </Button>
                    </Form.Item>
                  </Space>
                  
                  {/* Dimension helper */}
                  <Card size="small" title="Room Dimension Helper" style={{ marginBottom: 20 }}>
                    <Space align="end">
                      <Form.Item label="Length (ft)" name="roomLength">
                        <InputNumber min={0} step={0.5} style={{ width: 100 }} />
                      </Form.Item>
                      
                      <Form.Item label="Width (ft)" name="roomWidth">
                        <InputNumber min={0} step={0.5} style={{ width: 100 }} />
                      </Form.Item>
                      
                      <Form.Item label="Ceiling Type" name="ceilingType">
                        <Select style={{ width: 150 }} defaultValue="ACP">
                          {ACOUSTICAL_TYPES.map(type => (
                            <Option key={type.code} value={type.code}>
                              {type.code} - {type.name.substring(0, 15)}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item>
                        <Button onClick={showDimensionHelper}>
                          Calculate Area
                        </Button>
                      </Form.Item>
                    </Space>
                  </Card>
                </div>
                
                {ceilingSections.length > 0 ? (
                  <>
                    <Table
                      dataSource={ceilingSections}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: 'Ceiling Section Name',
                          dataIndex: 'name',
                          key: 'name',
                          render: (text, record) => (
                            <Input
                              value={text}
                              onChange={(e) => updateCeilingSection(record.id, 'name', e.target.value)}
                              placeholder="Enter section name"
                            />
                          ),
                        },
                        {
                          title: 'Material Type',
                          dataIndex: 'type',
                          key: 'type',
                          render: (text, record) => (
                            <Select
                              value={text}
                              onChange={(value) => updateCeilingSection(record.id, 'type', value)}
                              style={{ width: 200 }}
                            >
                              {ACOUSTICAL_TYPES.map(type => (
                                <Option 
                                  key={type.code} 
                                  value={type.code}
                                  title={type.description}
                                >
                                  {type.code} - {type.name}
                                </Option>
                              ))}
                            </Select>
                          ),
                        },
                        {
                          title: 'Area (sq ft)',
                          dataIndex: 'area',
                          key: 'area',
                          render: (text, record) => (
                            <InputNumber
                              min={0}
                              step={0.5}
                              value={text}
                              onChange={(value) => updateCeilingSection(record.id, 'area', value || 0)}
                              style={{ width: 120 }}
                            />
                          ),
                        },
                        {
                          title: 'Action',
                          key: 'action',
                          render: (_, record) => (
                            <Button
                              type="text"
                              danger
                              icon={<MinusOutlined />}
                              onClick={() => removeCeilingSection(record.id)}
                            />
                          ),
                        },
                      ]}
                      summary={(data) => {
                        const totalArea = data.reduce((sum, section) => 
                          sum + section.area, 0
                        );
                        
                        return (
                          <>
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0} colSpan={2}>
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
                        disabled={ceilingSections.length === 0}
                      >
                        Calculate Takeoff
                      </Button>
                    </div>
                  </>
                ) : (
                  <Alert
                    type="info"
                    message="No Ceiling Sections Added"
                    description="Add ceiling sections to begin your takeoff calculation or use the AI Analysis tab to generate suggestions."
                    showIcon
                  />
                )}
              </Form>
            </div>
          </TabPane>
        </Tabs>
        
        {results && (
          <div className="results-container" style={{ marginTop: 20 }}>
            <Title level={4}>Acoustical Ceiling Takeoff Results</Title>
            
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
                      title: 'Units Required',
                      dataIndex: 'unitsRequired',
                      key: 'unitsRequired',
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
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>{results.totalArea.toFixed(1)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong></Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>${calculateTotal().toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
                
                {results.gridRequirements && includeGridSystem && (
                  <div style={{ marginTop: 20 }}>
                    <Title level={5}>Grid System Requirements</Title>
                    <Table
                      dataSource={results.gridRequirements}
                      rowKey="itemName"
                      pagination={false}
                      columns={[
                        {
                          title: 'Item',
                          dataIndex: 'itemName',
                          key: 'itemName',
                        },
                        {
                          title: 'Description',
                          dataIndex: 'description',
                          key: 'description',
                        },
                        {
                          title: 'Quantity',
                          dataIndex: 'quantity',
                          key: 'quantity',
                        },
                        {
                          title: 'Unit',
                          dataIndex: 'unit',
                          key: 'unit',
                        },
                      ]}
                    />
                  </div>
                )}
              </TabPane>
              
              <TabPane tab="Detail" key="detail">
                <Table
                  dataSource={results.sections}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'Ceiling Section',
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: 'Material Type',
                      dataIndex: 'type',
                      key: 'type',
                      render: (type) => {
                        const acousticalType = ACOUSTICAL_TYPES.find(t => t.code === type);
                        return (
                          <Tooltip title={acousticalType?.description}>
                            {type} - {acousticalType?.name}
                          </Tooltip>
                        );
                      }
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
                      <li>Material quantities include a {wasteFactor}% waste factor</li>
                      <li>Standard sizes assumed:
                        <ul>
                          <li>2x4 Acoustical Ceiling Panels: 8 sq ft per panel</li>
                          <li>2x2 Acoustical Ceiling Tiles: 4 sq ft per tile</li>
                          <li>Gypsum Board: 4'×8' (32 sq ft per sheet)</li>
                          <li>Cypress Wood Planks: 6" width × 8' length (varies)</li>
                        </ul>
                      </li>
                      <li>Grid system requirements are calculated based on standard industry spacing</li>
                      <li>Material costs are estimates based on current market rates</li>
                      <li>Local building codes may require specific ceiling types or fire ratings</li>
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

export default AcousticalCeilingAnalyzer;
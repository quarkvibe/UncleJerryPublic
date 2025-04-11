import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Table, Tabs, Select, Spin, Alert, Form, Input, Space, Typography, Tooltip, Divider, InputNumber, Checkbox } from 'antd';
import { FileImageOutlined, CalculatorOutlined, SaveOutlined, InfoCircleOutlined, PlusOutlined, MinusOutlined, EditOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { BlueprintContext } from '../../context/BlueprintContext';
import { CharacterContext } from '../../context/CharacterContext';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/PlumbingAnalyzer.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Define a custom column type that supports render
type CustomColumn = {
  title: string;
  key: string;
  dataIndex?: string;
  render?: (text: any, record: any) => React.ReactNode;
};

// Create a helper type for the parser function
type ParserType = (value: string | undefined) => number;

// Create a typed version of columns setup for tables
interface TypedColumnProps {
  title: string;
  dataIndex: string;
  key: string;
  render?: (text: any, record: any) => React.ReactNode;
}

// Define interfaces for our component
interface PlumbingComponent {
  category: string;
  name: string;
  size: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface PipeSection {
  id: string;
  type: string;
  size: string;
  length: number;
  material: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface Fixture {
  id: string;
  type: string;
  description: string;
  quantity: number;
  connections: {
    waste?: string;
    vent?: string;
    coldWater?: string;
    hotWater?: string;
  };
  unitPrice?: number;
  totalPrice?: number;
}

interface ValveAndSpecialty {
  id: string;
  type: string;
  size: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

interface InstallationNote {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface PlumbingAnalysisResult {
  pipeSections: PipeSection[];
  fixtures: Fixture[];
  valvesAndSpecialties: ValveAndSpecialty[];
  notes: InstallationNote[];
  pipeByType: Record<string, number>;
  pipeBySize: Record<string, number>;
  laborHours?: number;
}

interface PlumbingAnalyzerProps {
  blueprintData: {
    imageUrls: string[];
    projectScale?: string;
    analysisType: 'materials' | 'costs' | 'full';
  };
  onAnalysisComplete: (result: PlumbingAnalysisResult) => void;
  onAnalysisProgress?: (progress: number) => void;
  analysisResult?: PlumbingAnalysisResult;
  isEditable?: boolean;
}

const PlumbingAnalyzer: React.FC<PlumbingAnalyzerProps> = ({
  blueprintData,
  onAnalysisComplete,
  onAnalysisProgress,
  analysisResult,
  isEditable = true
}) => {
  // State for the component
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPipeType, setSelectedPipeType] = useState<string>('all');
  const [editingPipeSection, setEditingPipeSection] = useState<PipeSection | null>(null);
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
  const [editingValve, setEditingValve] = useState<ValveAndSpecialty | null>(null);
  const [editingNote, setEditingNote] = useState<InstallationNote | null>(null);
  const [showPipeCalculator, setShowPipeCalculator] = useState<boolean>(false);
  const [showBlueprintPreview, setShowBlueprintPreview] = useState<string | null>(null);
  const [pipeCalculation, setPipeCalculation] = useState({
    pipeType: 'CW',
    pipeSize: '3/4"',
    length: 0,
    fittings: 5,
    extraPercentage: 15
  });
  const [plumbingData, setPlumbingData] = useState<PlumbingAnalysisResult | null>(analysisResult || null);
  const [isModified, setIsModified] = useState<boolean>(false);
  
  const pipeCalculatorRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  
  // Set initial data if provided
  useEffect(() => {
    if (analysisResult) {
      setPlumbingData(analysisResult);
      setAnalysisState('complete');
    }
  }, [analysisResult]);
  
  // Handle changes to the blueprintData
  useEffect(() => {
    if (!plumbingData && blueprintData.imageUrls.length > 0) {
      // Start analysis when images are available
      analyzeBlueprints();
    }
  }, [blueprintData]);
  
  // Mocked context values for compilation
  const blueprints = [];
  const blueprintLoading = false;
  const blueprintError = null;
  const character = { state: 'idle', message: '' };
  const setCharacterState = (state: string) => {};
  const { user } = useAuth();
  const [form] = Form.useForm();
  
  // Categories for plumbing components
  const pipeCategories = [
    'Sanitary/Waste',
    'Vent',
    'Domestic Water',
    'Hot Water',
    'Gas',
    'Storm',
    'Fire Protection',
    'Specialty'
  ];
  
  // Pipe types
  const pipeTypes = [
    { code: 'SP', name: 'Soil/Waste Pipe' },
    { code: 'WP', name: 'Waste Pipe' },
    { code: 'GW', name: 'Grease Waste Pipe' },
    { code: 'ST', name: 'Storm Pipe' },
    { code: 'VP', name: 'Vent Pipe' },
    { code: 'CW', name: 'Cold Water Pipe' },
    { code: 'HW', name: 'Hot Water Pipe' },
    { code: 'HWC', name: 'Hot Water Circulating Pipe' },
    { code: 'G', name: 'Gas Pipe' },
    { code: 'FP', name: 'Fire Protection Pipe' }
  ];
  
  // Pipe sizes
  const pipeSizes = [
    '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"', '6"'
  ];
  
  // Pipe materials
  const pipeMaterials = [
    'PVC', 'CPVC', 'Copper', 'Cast Iron', 'Galvanized Steel', 'Carbon Steel', 'Stainless Steel', 'PEX'
  ];
  
  // Fixture types
  const fixtureTypes = [
    'Water Closet (WC)', 'Lavatory (LAV)', 'Sink', 'Floor Drain (FLD)', 'Floor Sink (FLS)', 
    'Urinal (UR)', 'Drinking Fountain', 'Hose Bibb', 'Roof Drain (RD)', 'Grease Interceptor'
  ];
  
  // Valve types
  const valveTypes = [
    'Gate Valve', 'Ball Valve', 'Check Valve', 'Gas Cock', 'Balancing Valve', 
    'OS&Y Valve', 'Pressure Reducing Valve', 'Backflow Preventer', 'Cleanout'
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
        const result: PlumbingAnalysisResult = {
          pipeSections: [
            { id: '1', type: 'SP', size: '4"', length: 95, material: 'PVC', unitPrice: 8.25, totalPrice: 783.75 },
            { id: '2', type: 'SP', size: '3"', length: 84, material: 'PVC', unitPrice: 6.50, totalPrice: 546.00 },
            { id: '3', type: 'SP', size: '1-1/2"', length: 56, material: 'PVC', unitPrice: 3.75, totalPrice: 210.00 },
            { id: '4', type: 'GW', size: '3"', length: 92, material: 'PVC', unitPrice: 6.50, totalPrice: 598.00 },
            { id: '5', type: 'VP', size: '2"', length: 86, material: 'PVC', unitPrice: 4.25, totalPrice: 365.50 },
            { id: '6', type: 'VP', size: '1-1/2"', length: 90, material: 'PVC', unitPrice: 3.75, totalPrice: 337.50 },
            { id: '7', type: 'CW', size: '1"', length: 160, material: 'Copper', unitPrice: 12.35, totalPrice: 1976.00 },
            { id: '8', type: 'CW', size: '3/4"', length: 120, material: 'Copper', unitPrice: 9.85, totalPrice: 1182.00 },
            { id: '9', type: 'CW', size: '1/2"', length: 30, material: 'Copper', unitPrice: 7.65, totalPrice: 229.50 },
            { id: '10', type: 'HW', size: '3/4"', length: 175, material: 'Copper', unitPrice: 9.85, totalPrice: 1723.75 },
            { id: '11', type: 'HW', size: '1/2"', length: 70, material: 'Copper', unitPrice: 7.65, totalPrice: 535.50 },
            { id: '12', type: 'HWC', size: '1/2"', length: 130, material: 'Copper', unitPrice: 7.65, totalPrice: 994.50 },
            { id: '13', type: 'G', size: '1-1/4"', length: 45, material: 'Carbon Steel', unitPrice: 14.75, totalPrice: 663.75 },
            { id: '14', type: 'G', size: '1"', length: 60, material: 'Carbon Steel', unitPrice: 12.50, totalPrice: 750.00 },
            { id: '15', type: 'G', size: '3/4"', length: 40, material: 'Carbon Steel', unitPrice: 10.25, totalPrice: 410.00 },
            { id: '16', type: 'ST', size: '4"', length: 65, material: 'PVC', unitPrice: 8.25, totalPrice: 536.25 },
          ],
          fixtures: [
            { id: '1', type: 'Water Closet (WC)', description: 'Floor Mounted, Barrier Free', quantity: 4, connections: { waste: '4"', vent: '2"', coldWater: '1"' }, unitPrice: 525, totalPrice: 2100 },
            { id: '2', type: 'Lavatory (LAV)', description: 'Wall Mounted, Barrier Free', quantity: 4, connections: { waste: '1-1/2"', vent: '1-1/2"', coldWater: '1/2"', hotWater: '1/2"' }, unitPrice: 375, totalPrice: 1500 },
            { id: '3', type: 'Floor Drain (FLD)', description: 'Zurn #2415', quantity: 8, connections: { waste: '3"', vent: '2"' }, unitPrice: 185, totalPrice: 1480 },
            { id: '4', type: 'Floor Sink (FLS)', description: 'Zurn #Z1900-KC', quantity: 6, connections: { waste: '3"', vent: '2"' }, unitPrice: 245, totalPrice: 1470 },
            { id: '5', type: 'Urinal (UR)', description: 'Wall Hung, Barrier Free', quantity: 1, connections: { waste: '2"', vent: '1-1/2"', coldWater: '3/4"' }, unitPrice: 450, totalPrice: 450 },
            { id: '6', type: 'Roof Drain (RD)', description: 'Standard Type', quantity: 2, connections: { waste: '4"' }, unitPrice: 420, totalPrice: 840 },
            { id: '7', type: 'Grease Interceptor', description: 'Custom Fabricated', quantity: 1, connections: { waste: '3"' }, unitPrice: 1850, totalPrice: 1850 },
          ],
          valvesAndSpecialties: [
            { id: '1', type: 'Gate/Ball Valve', size: 'Various', quantity: 22, unitPrice: 65, totalPrice: 1430 },
            { id: '2', type: 'Check Valve', size: 'Various', quantity: 6, unitPrice: 85, totalPrice: 510 },
            { id: '3', type: 'Gas Cock', size: 'Various', quantity: 4, unitPrice: 95, totalPrice: 380 },
            { id: '4', type: 'Balancing Valve', size: '3/4"', quantity: 2, unitPrice: 110, totalPrice: 220 },
            { id: '5', type: 'OS&Y Valve', size: 'Various', quantity: 4, unitPrice: 175, totalPrice: 700 },
            { id: '6', type: 'Backflow Preventer', size: '1"', quantity: 2, unitPrice: 325, totalPrice: 650 },
            { id: '7', type: 'Pressure Reducing Valve', size: '1"', quantity: 1, unitPrice: 215, totalPrice: 215 },
            { id: '8', type: 'Cleanout', size: 'Various', quantity: 12, unitPrice: 45, totalPrice: 540 },
            { id: '9', type: 'Tempering Valve', size: '3/4"', quantity: 2, unitPrice: 265, totalPrice: 530 },
            { id: '10', type: 'P-Trap with Insulation', size: 'Various', quantity: 15, unitPrice: 35, totalPrice: 525 },
            { id: '11', type: 'Roof Flashing', size: 'Various', quantity: 5, unitPrice: 45, totalPrice: 225 },
          ],
          notes: [
            { text: 'All plumbing work to comply with local plumbing code requirements.', priority: 'high' },
            { text: 'Coordinate with HVAC contractor for water and waste connections to RTUs and make-up air unit.', priority: 'high' },
            { text: 'Verify all pipe routing with structural elements before installation.', priority: 'medium' },
            { text: 'All hot water piping to be insulated per code requirements.', priority: 'medium' },
            { text: 'Gas piping system to be pressure tested and inspected before being put into service.', priority: 'high' },
            { text: 'Verify proper slope for all sanitary and grease waste piping (min 1/4" per foot).', priority: 'high' },
            { text: 'Coordinate floor drain locations with architect before rough-in.', priority: 'medium' },
            { text: 'Provide adequate support for all suspended piping per code.', priority: 'medium' },
          ],
          pipeByType: {
            'SP/WP': 235,
            'GW': 92,
            'VP': 176,
            'CW': 310,
            'HW': 245,
            'HWC': 130,
            'G': 145,
            'ST': 65,
            'FP': 0,
          },
          pipeBySize: {
            '4"': 160,
            '3"': 176,
            '2"': 86,
            '1-1/2"': 146,
            '1-1/4"': 45,
            '1"': 220,
            '3/4"': 335,
            '1/2"': 230,
          },
          laborHours: 320
        };
        
        setPlumbingData(result);
        setAnalysisState('complete');
        onAnalysisComplete(result);
      }
    }, 200);
  };
  
  // Filter components by category
  const getFilteredPipeSections = () => {
    if (!plumbingData) return [];
    
    if (selectedPipeType === 'all') {
      return plumbingData.pipeSections;
    } else {
      return plumbingData.pipeSections.filter(p => p.type === selectedPipeType);
    }
  };
  
  // Get filtered fixtures
  const getFilteredFixtures = () => {
    if (!plumbingData) return [];
    
    if (selectedCategory === 'all') {
      return plumbingData.fixtures;
    } else {
      // Map category to fixture types
      const categoryMap: Record<string, string[]> = {
        'Sanitary/Waste': ['Water Closet (WC)', 'Lavatory (LAV)', 'Floor Drain (FLD)', 'Floor Sink (FLS)', 'Grease Interceptor'],
        'Domestic Water': ['Water Closet (WC)', 'Lavatory (LAV)', 'Sink', 'Drinking Fountain', 'Hose Bibb'],
        'Storm': ['Roof Drain (RD)'],
      };
      
      const relevantTypes = categoryMap[selectedCategory] || [];
      return plumbingData.fixtures.filter(f => relevantTypes.includes(f.type));
    }
  };
  
  // Get filtered valves and specialties
  const getFilteredValvesAndSpecialties = () => {
    if (!plumbingData) return [];
    
    if (selectedCategory === 'all') {
      return plumbingData.valvesAndSpecialties;
    } else {
      // Map category to valve types
      const categoryMap: Record<string, string[]> = {
        'Domestic Water': ['Gate/Ball Valve', 'Check Valve', 'Balancing Valve', 'Pressure Reducing Valve', 'Backflow Preventer'],
        'Hot Water': ['Gate/Ball Valve', 'Check Valve', 'Balancing Valve', 'Tempering Valve'],
        'Gas': ['Gas Cock', 'OS&Y Valve'],
        'Sanitary/Waste': ['Cleanout', 'P-Trap with Insulation'],
        'Fire Protection': ['OS&Y Valve'],
      };
      
      const relevantTypes = categoryMap[selectedCategory] || [];
      return plumbingData.valvesAndSpecialties.filter(v => relevantTypes.includes(v.type));
    }
  };
  
  // Calculate totals
  const calculateTotals = () => {
    if (!plumbingData) return { 
      totalPipeLength: 0, 
      totalFixtures: 0, 
      totalValves: 0,
      totalCost: 0 
    };
    
    const totalPipeLength = plumbingData.pipeSections.reduce((acc, curr) => acc + curr.length, 0);
    const totalFixtures = plumbingData.fixtures.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalValves = plumbingData.valvesAndSpecialties.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalCost = (
      plumbingData.pipeSections.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0) +
      plumbingData.fixtures.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0) +
      plumbingData.valvesAndSpecialties.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0)
    );
    
    return { totalPipeLength, totalFixtures, totalValves, totalCost };
  };
  
  // Add new valve
  const addNewValve = () => {
    if (!plumbingData) return;
    
    const newValve: ValveAndSpecialty = {
      id: `valve-${Date.now()}`,
      type: valveTypes[0],
      size: pipeSizes[0],
      quantity: 1,
      unitPrice: blueprintData.analysisType !== 'materials' ? 0 : undefined
    };
    
    setEditingValve(newValve);
  };
  
  // Save new valve
  const saveNewValve = () => {
    if (!editingValve || !plumbingData) return;
    
    // Check if values are valid
    if (editingValve.quantity <= 0) {
      alert('Valve quantity must be greater than 0');
      return;
    }
    
    const updatedValve = {
      ...editingValve,
      totalPrice: editingValve.unitPrice 
        ? editingValve.quantity * editingValve.unitPrice 
        : undefined
    };
    
    setPlumbingData({
      ...plumbingData,
      valvesAndSpecialties: [...plumbingData.valvesAndSpecialties, updatedValve]
    });
    
    setEditingValve(null);
    setIsModified(true);
  };
  
  // Remove valve
  const removeValve = (valve: ValveAndSpecialty) => {
    if (!plumbingData) return;
    
    if (window.confirm(`Are you sure you want to remove ${valve.type}?`)) {
      const updatedValves = plumbingData.valvesAndSpecialties.filter(v => v.id !== valve.id);
      
      setPlumbingData({
        ...plumbingData,
        valvesAndSpecialties: updatedValves
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
    if (!editingNote || !plumbingData) return;
    
    // Find the index of the note we're editing
    const noteIndex = plumbingData.notes.findIndex(n => n.text === editingNote.text);
    
    if (noteIndex >= 0) {
      const updatedNotes = [...plumbingData.notes];
      updatedNotes[noteIndex] = editingNote;
      
      setPlumbingData({
        ...plumbingData,
        notes: updatedNotes
      });
    } else {
      // It's a new note
      setPlumbingData({
        ...plumbingData,
        notes: [...plumbingData.notes, editingNote]
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
    if (!plumbingData) return;
    
    if (window.confirm('Are you sure you want to remove this note?')) {
      const updatedNotes = plumbingData.notes.filter(n => n.text !== note.text);
      
      setPlumbingData({
        ...plumbingData,
        notes: updatedNotes
      });
      
      setIsModified(true);
    }
  };
  
  // Calculate pipe length
  const calculatePipeLength = () => {
    const baseFittingsLength = {
      '1/2"': 0.5,
      '3/4"': 0.75,
      '1"': 1.0,
      '1-1/4"': 1.25,
      '1-1/2"': 1.5,
      '2"': 2.0,
      '2-1/2"': 2.5,
      '3"': 3.0,
      '4"': 4.0,
      '6"': 6.0,
    };
    
    const fittingEquivalentLength = baseFittingsLength[pipeCalculation.pipeSize as keyof typeof baseFittingsLength] || 1.0;
    const fittingsLength = pipeCalculation.fittings * fittingEquivalentLength;
    const totalLength = pipeCalculation.length + fittingsLength;
    const extraLength = totalLength * (pipeCalculation.extraPercentage / 100);
    const finalLength = totalLength + extraLength;
    
    if (plumbingData) {
      // Find the pipe type and size in the existing data or add a new one
      const existingPipeIndex = plumbingData.pipeSections.findIndex(
        p => p.type === pipeCalculation.pipeType && p.size === pipeCalculation.pipeSize
      );
      
      let updatedSections = [...plumbingData.pipeSections];
      const newPipeByType = { ...plumbingData.pipeByType };
      const newPipeBySize = { ...plumbingData.pipeBySize };
      
      if (existingPipeIndex >= 0) {
        // Update existing pipe section
        const existingPipe = updatedSections[existingPipeIndex];
        const newLength = existingPipe.length + finalLength;
        
        // Update type and size totals
        newPipeByType[existingPipe.type] = (newPipeByType[existingPipe.type] || 0) - existingPipe.length + newLength;
        newPipeBySize[existingPipe.size] = (newPipeBySize[existingPipe.size] || 0) - existingPipe.length + newLength;
        
        updatedSections[existingPipeIndex] = {
          ...existingPipe,
          length: newLength,
          totalPrice: existingPipe.unitPrice ? newLength * existingPipe.unitPrice : undefined
        };
      } else {
        // Add new pipe section
        const material = pipeCalculation.pipeType === 'CW' || pipeCalculation.pipeType === 'HW' || pipeCalculation.pipeType === 'HWC'
          ? 'Copper'
          : pipeCalculation.pipeType === 'G'
            ? 'Carbon Steel'
            : 'PVC';
        
        const unitPrice = getPipeUnitPrice(pipeCalculation.pipeType, pipeCalculation.pipeSize, material);
        
        const newPipe: PipeSection = {
          id: `pipe-calc-${Date.now()}`,
          type: pipeCalculation.pipeType,
          size: pipeCalculation.pipeSize,
          length: finalLength,
          material,
          unitPrice: blueprintData.analysisType !== 'materials' ? unitPrice : undefined,
          totalPrice: blueprintData.analysisType !== 'materials' ? finalLength * unitPrice : undefined
        };
        
        // Update type and size totals
        newPipeByType[newPipe.type] = (newPipeByType[newPipe.type] || 0) + newPipe.length;
        newPipeBySize[newPipe.size] = (newPipeBySize[newPipe.size] || 0) + newPipe.length;
        
        updatedSections.push(newPipe);
      }
      
      setPlumbingData({
        ...plumbingData,
        pipeSections: updatedSections,
        pipeByType: newPipeByType,
        pipeBySize: newPipeBySize
      });
      
      setIsModified(true);
    }
    
    setShowPipeCalculator(false);
  };
  
  // Get pipe unit price based on type, size and material
  const getPipeUnitPrice = (type: string, size: string, material: string): number => {
    const basePrices = {
      'PVC': {
        '1/2"': 2.95,
        '3/4"': 3.25,
        '1"': 3.75,
        '1-1/4"': 4.25,
        '1-1/2"': 4.75,
        '2"': 5.25,
        '3"': 6.50,
        '4"': 8.25,
        '6"': 15.50
      },
      'Copper': {
        '1/2"': 7.65,
        '3/4"': 9.85,
        '1"': 12.35,
        '1-1/4"': 14.85,
        '1-1/2"': 17.35,
        '2"': 23.50,
        '3"': 42.75,
        '4"': 68.50
      },
      'Carbon Steel': {
        '1/2"': 8.75,
        '3/4"': 10.25,
        '1"': 12.50,
        '1-1/4"': 14.75,
        '1-1/2"': 16.95,
        '2"': 21.75,
        '3"': 36.25,
        '4"': 54.50
      }
    };
    
    // Type safe access to nested properties
    const materialPrices = basePrices[material as keyof typeof basePrices] || {};
    // Use a type assertion to avoid the indexing issue
    return (materialPrices as Record<string, number>)[size] || 5.00;
  };
  
  // Save changes to the analysis
  const saveChanges = () => {
    if (plumbingData && isModified) {
      onAnalysisComplete(plumbingData);
      setIsModified(false);
    }
  };
  
  // Export data to CSV
  const exportToCSV = () => {
    if (!plumbingData) return;
    
    let csv = 'Plumbing Material Takeoff\n\n';
    
    // Pipe sections
    csv += 'PIPE SECTIONS\n';
    csv += 'Type,Size,Length (ft),Material,Unit Price,Total Price\n';
    
    plumbingData.pipeSections.forEach(pipe => {
      csv += `${pipe.type},${pipe.size},${pipe.length},${pipe.material},${pipe.unitPrice || ''},${pipe.totalPrice || ''}\n`;
    });
    
    // Fixtures
    csv += '\nFIXTURES\n';
    csv += 'Type,Description,Quantity,Waste,Vent,Cold Water,Hot Water,Unit Price,Total Price\n';
    
    plumbingData.fixtures.forEach(fixture => {
      csv += `${fixture.type},${fixture.description},${fixture.quantity},${fixture.connections.waste || ''},${fixture.connections.vent || ''},${fixture.connections.coldWater || ''},${fixture.connections.hotWater || ''},${fixture.unitPrice || ''},${fixture.totalPrice || ''}\n`;
    });
    
    // Valves and Specialties
    csv += '\nVALVES AND SPECIALTIES\n';
    csv += 'Type,Size,Quantity,Unit Price,Total Price\n';
    
    plumbingData.valvesAndSpecialties.forEach(valve => {
      csv += `${valve.type},${valve.size},${valve.quantity},${valve.unitPrice || ''},${valve.totalPrice || ''}\n`;
    });
    
    // Notes
    csv += '\nINSTALLATION NOTES\n';
    csv += 'Note,Priority\n';
    
    plumbingData.notes.forEach(note => {
      csv += `"${note.text}",${note.priority}\n`;
    });
    
    // Summary data
    csv += '\nSUMMARY\n';
    csv += 'Pipe Type,Length (ft)\n';
    
    Object.entries(plumbingData.pipeByType).forEach(([type, length]) => {
      csv += `${type},${length}\n`;
    });
    
    csv += '\nPipe Size,Length (ft)\n';
    
    Object.entries(plumbingData.pipeBySize).forEach(([size, length]) => {
      csv += `${size},${length}\n`;
    });
    
    // Calculate totals
    const totals = calculateTotals();
    csv += `\nTotal Pipe Length,${totals.totalPipeLength} ft\n`;
    csv += `Total Fixtures,${totals.totalFixtures}\n`;
    csv += `Total Valves and Specialties,${totals.totalValves}\n`;
    
    if (blueprintData.analysisType !== 'materials') {
      csv += `Total Cost,${totals.totalCost.toFixed(2)}\n`;
    }
    
    if (plumbingData.laborHours) {
      csv += `Estimated Labor Hours,${plumbingData.laborHours}\n`;
    }
    
    // Generate file and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plumbing_takeoff.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Export data to Excel-compatible format
  const exportToExcel = () => {
    if (!plumbingData) return;
    
    // In a production app, we would use a library like xlsx.js
    // For this demo, we'll just call the CSV export
    exportToCSV();
  };
  
  // Export data to PDF format
  const exportToPDF = () => {
    if (!plumbingData) return;
    
    // In a production app, we would use a library like jsPDF
    // For this demo, we'll show an alert
    alert('PDF export would be available in the production version');
  };
  
  // Add a new pipe section
  const addNewPipeSection = () => {
    if (!plumbingData) return;
    
    const newPipe: PipeSection = {
      id: `pipe-${Date.now()}`,
      type: pipeTypes[0].code,
      size: pipeSizes[0],
      length: 0,
      material: pipeMaterials[0],
      unitPrice: blueprintData.analysisType !== 'materials' ? 0 : undefined
    };
    
    setEditingPipeSection(newPipe);
  };
  
  // Save new or edited pipe section
  const savePipeSection = () => {
    if (!editingPipeSection || !plumbingData) return;
    
    // Check if values are valid
    if (editingPipeSection.length <= 0) {
      alert('Pipe length must be greater than 0');
      return;
    }
    
    const updatedPipe = {
      ...editingPipeSection,
      totalPrice: editingPipeSection.unitPrice 
        ? editingPipeSection.length * editingPipeSection.unitPrice 
        : undefined
    };
    
    // Check if we're editing existing pipe or adding new
    const pipeIndex = plumbingData.pipeSections.findIndex(p => p.id === updatedPipe.id);
    
    let updatedSections = [...plumbingData.pipeSections];
    const newPipeByType = { ...plumbingData.pipeByType };
    const newPipeBySize = { ...plumbingData.pipeBySize };
    
    if (pipeIndex >= 0) {
      // We're updating an existing pipe
      const oldPipe = updatedSections[pipeIndex];
      
      // Update type totals
      if (oldPipe.type !== updatedPipe.type) {
        newPipeByType[oldPipe.type] = (newPipeByType[oldPipe.type] || 0) - oldPipe.length;
        newPipeByType[updatedPipe.type] = (newPipeByType[updatedPipe.type] || 0) + updatedPipe.length;
      } else if (oldPipe.length !== updatedPipe.length) {
        newPipeByType[oldPipe.type] = (newPipeByType[oldPipe.type] || 0) - oldPipe.length + updatedPipe.length;
      }
      
      // Update size totals
      if (oldPipe.size !== updatedPipe.size) {
        newPipeBySize[oldPipe.size] = (newPipeBySize[oldPipe.size] || 0) - oldPipe.length;
        newPipeBySize[updatedPipe.size] = (newPipeBySize[updatedPipe.size] || 0) + updatedPipe.length;
      } else if (oldPipe.length !== updatedPipe.length) {
        newPipeBySize[oldPipe.size] = (newPipeBySize[oldPipe.size] || 0) - oldPipe.length + updatedPipe.length;
      }
      
      // Update the pipe
      updatedSections[pipeIndex] = updatedPipe;
    } else {
      // We're adding a new pipe
      updatedSections.push(updatedPipe);
      
      // Update type and size totals
      newPipeByType[updatedPipe.type] = (newPipeByType[updatedPipe.type] || 0) + updatedPipe.length;
      newPipeBySize[updatedPipe.size] = (newPipeBySize[updatedPipe.size] || 0) + updatedPipe.length;
    }
    
    setPlumbingData({
      ...plumbingData,
      pipeSections: updatedSections,
      pipeByType: newPipeByType,
      pipeBySize: newPipeBySize
    });
    
    setEditingPipeSection(null);
    setIsModified(true);
  };
  
  // Remove pipe section
  const removePipeSection = (pipe: PipeSection) => {
    if (!plumbingData) return;
    
    if (window.confirm(`Are you sure you want to remove ${pipe.type} ${pipe.size} pipe?`)) {
      const updatedSections = plumbingData.pipeSections.filter(p => p.id !== pipe.id);
      
      // Update pipe totals
      const newPipeByType = { ...plumbingData.pipeByType };
      const newPipeBySize = { ...plumbingData.pipeBySize };
      
      newPipeByType[pipe.type] = (newPipeByType[pipe.type] || 0) - pipe.length;
      newPipeBySize[pipe.size] = (newPipeBySize[pipe.size] || 0) - pipe.length;
      
      setPlumbingData({
        ...plumbingData,
        pipeSections: updatedSections,
        pipeByType: newPipeByType,
        pipeBySize: newPipeBySize
      });
      
      setIsModified(true);
    }
  };
  
  // Add new fixture
  const addNewFixture = () => {
    if (!plumbingData) return;
    
    const newFixture: Fixture = {
      id: `fixture-${Date.now()}`,
      type: fixtureTypes[0],
      description: '',
      quantity: 1,
      connections: {},
      unitPrice: blueprintData.analysisType !== 'materials' ? 0 : undefined
    };
    
    setEditingFixture(newFixture);
  };
  
  // Save new or edited fixture
  const saveFixture = () => {
    if (!editingFixture || !plumbingData) return;
    
    // Check if values are valid
    if (editingFixture.quantity <= 0) {
      alert('Fixture quantity must be greater than 0');
      return;
    }
    
    const updatedFixture = {
      ...editingFixture,
      totalPrice: editingFixture.unitPrice 
        ? editingFixture.quantity * editingFixture.unitPrice 
        : undefined
    };
    
    // Check if we're editing existing fixture or adding new
    const fixtureIndex = plumbingData.fixtures.findIndex(f => f.id === updatedFixture.id);
    
    if (fixtureIndex >= 0) {
      // We're updating an existing fixture
      const updatedFixtures = [...plumbingData.fixtures];
      updatedFixtures[fixtureIndex] = updatedFixture;
      
      setPlumbingData({
        ...plumbingData,
        fixtures: updatedFixtures
      });
    } else {
      // We're adding a new fixture
      setPlumbingData({
        ...plumbingData,
        fixtures: [...plumbingData.fixtures, updatedFixture]
      });
    }
    
    setEditingFixture(null);
    setIsModified(true);
  };
  
  // Remove fixture
  const removeFixture = (fixture: Fixture) => {
    if (!plumbingData) return;
    
    if (window.confirm(`Are you sure you want to remove ${fixture.type}?`)) {
      const updatedFixtures = plumbingData.fixtures.filter(f => f.id !== fixture.id);
      
      setPlumbingData({
        ...plumbingData,
        fixtures: updatedFixtures
      });
      
      setIsModified(true);
    }
  };
  
  // Handle pipe section edit
  const handlePipeSectionEdit = (pipe: PipeSection) => {
    setEditingPipeSection({ ...pipe });
  };
  
  // Handle fixture edit
  const handleFixtureEdit = (fixture: Fixture) => {
    setEditingFixture({ ...fixture });
  };
  
  // Handle valve edit
  const handleValveEdit = (valve: ValveAndSpecialty) => {
    setEditingValve({ ...valve });
  };
  
  // Get pipe type name from code
  const getPipeTypeName = (code: string): string => {
    const pipeType = pipeTypes.find(p => p.code === code);
    return pipeType ? pipeType.name : code;
  };
  
  // Show blueprint preview
  const showPreview = (imageUrl: string) => {
    setShowBlueprintPreview(imageUrl);
  };
  
  // Render pipe sections table
  const renderPipeSectionsTable = () => {
    const columns = [
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (text: string) => getPipeTypeName(text)
      },
      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size'
      },
      {
        title: 'Length (ft)',
        dataIndex: 'length',
        key: 'length',
        render: (text: number) => text.toFixed(1)
      },
      {
        title: 'Material',
        dataIndex: 'material',
        key: 'material'
      }
    ];
    
    // Add price columns if applicable
    if (blueprintData.analysisType !== 'materials') {
      columns.push(
        {
          title: 'Unit Price',
          dataIndex: 'unitPrice',
          key: 'unitPrice',
          render: (text: number) => text ? `${text.toFixed(2)}` : '-'
        },
        {
          title: 'Total Price',
          dataIndex: 'totalPrice',
          key: 'totalPrice',
          render: (text: number) => text ? `${text.toFixed(2)}` : '-'
        }
      );
    }
    
    // Add actions column if editable
    if (isEditable) {
      // Use a custom column definition that includes render property
      type CustomColumn = {
        title: string;
        key: string;
        dataIndex?: string;
        render?: (text: any, record: any) => React.ReactNode;
      };
      
      (columns as CustomColumn[]).push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: PipeSection) => (
          <Space>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handlePipeSectionEdit(record)}
            />
            <Button 
              type="text" 
              danger 
              icon={<MinusOutlined />} 
              onClick={() => removePipeSection(record)}
            />
          </Space>
        )
      });
    }
    
    return (
      <div className="table-container">
        <div className="table-header">
          <Space>
            <Select 
              value={selectedPipeType} 
              onChange={setSelectedPipeType}
              style={{ width: 200 }}
            >
              <Option value="all">All Pipe Types</Option>
              {pipeTypes.map(type => (
                <Option key={type.code} value={type.code}>{type.name}</Option>
              ))}
            </Select>
            
            {isEditable && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={addNewPipeSection}
              >
                Add Pipe Section
              </Button>
            )}
            
            {isEditable && (
              <Button 
                icon={<CalculatorOutlined />} 
                onClick={() => setShowPipeCalculator(true)}
              >
                Pipe Calculator
              </Button>
            )}
          </Space>
        </div>
        
        <Table 
          dataSource={getFilteredPipeSections()} 
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    );
  };
  
  // Render fixtures table
  const renderFixturesTable = () => {
    const columns = [
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type'
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description'
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity'
      },
      {
        title: 'Connections',
        key: 'connections',
        render: (_: any, record: Fixture) => (
          <div>
            {record.connections.waste && <div>Waste: {record.connections.waste}</div>}
            {record.connections.vent && <div>Vent: {record.connections.vent}</div>}
            {record.connections.coldWater && <div>CW: {record.connections.coldWater}</div>}
            {record.connections.hotWater && <div>HW: {record.connections.hotWater}</div>}
          </div>
        )
      }
    ];
    
    // Add price columns if applicable
    if (blueprintData.analysisType !== 'materials') {
      columns.push(
        {
          title: 'Unit Price',
          dataIndex: 'unitPrice',
          key: 'unitPrice',
          render: (text: number) => text ? `${text.toFixed(2)}` : '-'
        },
        {
          title: 'Total Price',
          dataIndex: 'totalPrice',
          key: 'totalPrice',
          render: (text: number) => text ? `${text.toFixed(2)}` : '-'
        }
      );
    }
    
    // Add actions column if editable
    if (isEditable) {
      columns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: Fixture) => (
          <Space>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleFixtureEdit(record)}
            />
            <Button 
              type="text" 
              danger 
              icon={<MinusOutlined />} 
              onClick={() => removeFixture(record)}
            />
          </Space>
        )
      });
    }
    
    return (
      <div className="table-container">
        <div className="table-header">
          <Space>
            {isEditable && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={addNewFixture}
              >
                Add Fixture
              </Button>
            )}
          </Space>
        </div>
        
        <Table 
          dataSource={getFilteredFixtures()} 
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    );
  };
  
  // Render valves and specialties table
  const renderValvesTable = () => {
    const columns = [
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type'
      },
      {
        title: 'Size',
        dataIndex: 'size',
        key: 'size'
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity'
      }
    ];
    
    // Add price columns if applicable
    if (blueprintData.analysisType !== 'materials') {
      columns.push(
        {
          title: 'Unit Price',
          dataIndex: 'unitPrice',
          key: 'unitPrice',
          render: (text: number) => text ? `${text.toFixed(2)}` : '-'
        },
        {
          title: 'Total Price',
          dataIndex: 'totalPrice',
          key: 'totalPrice',
          render: (text: number) => text ? `${text.toFixed(2)}` : '-'
        }
      );
    }
    
    // Add actions column if editable
    if (isEditable) {
      columns.push({
        title: 'Actions',
        key: 'actions',
        render: (_: any, record: ValveAndSpecialty) => (
          <Space>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleValveEdit(record)}
            />
            <Button 
              type="text" 
              danger 
              icon={<MinusOutlined />} 
              onClick={() => removeValve(record)}
            />
          </Space>
        )
      });
    }
    
    return (
      <div className="table-container">
        <div className="table-header">
          <Space>
            {isEditable && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={addNewValve}
              >
                Add Valve/Specialty
              </Button>
            )}
          </Space>
        </div>
        
        <Table 
          dataSource={getFilteredValvesAndSpecialties()} 
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    );
  };
  
  // Render installation notes
  const renderNotes = () => {
    return (
      <div className="notes-container">
        <div className="table-header">
          <Space>
            {isEditable && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={addNewNote}
              >
                Add Note
              </Button>
            )}
          </Space>
        </div>
        
        {plumbingData?.notes.map((note, index) => (
          <div 
            key={index} 
            className={`note-item priority-${note.priority}`}
          >
            <div className="note-content">
              <div className="note-priority">{note.priority.toUpperCase()}</div>
              <div className="note-text">{note.text}</div>
            </div>
            
            {isEditable && (
              <div className="note-actions">
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={() => handleNoteEdit(note)}
                />
                <Button 
                  type="text" 
                  danger 
                  icon={<MinusOutlined />} 
                  onClick={() => removeNote(note)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render summary and charts
  const renderSummary = () => {
    const totals = calculateTotals();
    
    return (
      <div className="summary-container">
        <div className="summary-totals">
          <Card title="Project Totals">
            <div className="totals-grid">
              <div className="total-item">
                <div className="total-label">Total Pipe Length:</div>
                <div className="total-value">{totals.totalPipeLength.toFixed(1)} ft</div>
              </div>
              
              <div className="total-item">
                <div className="total-label">Total Fixtures:</div>
                <div className="total-value">{totals.totalFixtures}</div>
              </div>
              
              <div className="total-item">
                <div className="total-label">Total Valves & Specialties:</div>
                <div className="total-value">{totals.totalValves}</div>
              </div>
              
              {blueprintData.analysisType !== 'materials' && (
                <div className="total-item">
                  <div className="total-label">Total Cost:</div>
                  <div className="total-value">${totals.totalCost.toFixed(2)}</div>
                </div>
              )}
              
              {plumbingData?.laborHours && (
                <div className="total-item">
                  <div className="total-label">Estimated Labor Hours:</div>
                  <div className="total-value">{plumbingData.laborHours}</div>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        <div className="summary-breakdown">
          <Card title="Pipe by Type (ft)">
            <div className="breakdown-table">
              {plumbingData && Object.entries(plumbingData.pipeByType).map(([type, length]) => (
                <div key={type} className="breakdown-row">
                  <div className="breakdown-label">{type}:</div>
                  <div className="breakdown-value">{length.toFixed(1)} ft</div>
                </div>
              ))}
            </div>
          </Card>
          
          <Card title="Pipe by Size (ft)">
            <div className="breakdown-table">
              {plumbingData && Object.entries(plumbingData.pipeBySize).map(([size, length]) => (
                <div key={size} className="breakdown-row">
                  <div className="breakdown-label">{size}:</div>
                  <div className="breakdown-value">{length.toFixed(1)} ft</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        <div className="export-buttons">
          <Space>
            <Button icon={<FilePdfOutlined />} onClick={exportToPDF}>Export to PDF</Button>
            <Button icon={<FileExcelOutlined />} onClick={exportToExcel}>Export to Excel</Button>
          </Space>
        </div>
      </div>
    );
  };
  
  // Render pipe calculator modal
  const renderPipeCalculator = () => {
    if (!showPipeCalculator) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content" ref={pipeCalculatorRef}>
          <Card title="Pipe Length Calculator">
            <Form
              layout="vertical"
              initialValues={pipeCalculation}
              onValuesChange={(_, values) => setPipeCalculation(values)}
            >
              <Form.Item label="Pipe Type" name="pipeType">
                <Select style={{ width: '100%' }}>
                  {pipeTypes.map(type => (
                    <Option key={type.code} value={type.code}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Pipe Size" name="pipeSize">
                <Select style={{ width: '100%' }}>
                  {pipeSizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Straight Pipe Length (ft)" name="length">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item label="Number of Fittings" name="fittings">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item label="Extra Percentage for Waste" name="extraPercentage">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              
              <Divider />
              
              <div className="calculated-length">
                <Text>Equivalent Fittings Length:</Text>
                <Text strong>
                  {(pipeCalculation.fittings * (baseFittingsLength[pipeCalculation.pipeSize as keyof typeof baseFittingsLength] || 1.0)).toFixed(1)} ft
                </Text>
              </div>
              
              <div className="calculated-length">
                <Text>Base Length (Pipe + Fittings):</Text>
                <Text strong>
                  {(pipeCalculation.length + pipeCalculation.fittings * (baseFittingsLength[pipeCalculation.pipeSize as keyof typeof baseFittingsLength] || 1.0)).toFixed(1)} ft
                </Text>
              </div>
              
              <div className="calculated-length">
                <Text>Extra Length for Waste ({pipeCalculation.extraPercentage}%):</Text>
                <Text strong>
                  {((pipeCalculation.length + pipeCalculation.fittings * (baseFittingsLength[pipeCalculation.pipeSize as keyof typeof baseFittingsLength] || 1.0)) * (pipeCalculation.extraPercentage / 100)).toFixed(1)} ft
                </Text>
              </div>
              
              <Divider />
              
              <div className="calculated-length">
                <Text>Total Calculated Length:</Text>
                <Text strong>
                  {((pipeCalculation.length + pipeCalculation.fittings * (baseFittingsLength[pipeCalculation.pipeSize as keyof typeof baseFittingsLength] || 1.0)) * (1 + pipeCalculation.extraPercentage / 100)).toFixed(1)} ft
                </Text>
              </div>
              
              <div className="modal-actions">
                <Space>
                  <Button onClick={() => setShowPipeCalculator(false)}>Cancel</Button>
                  <Button type="primary" onClick={calculatePipeLength}>
                    Add to Takeoff
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    );
  };
  
  // Base fittings length equivalent for calculations
  const baseFittingsLength: Record<string, number> = {
    '1/2"': 0.5,
    '3/4"': 0.75,
    '1"': 1.0,
    '1-1/4"': 1.25,
    '1-1/2"': 1.5,
    '2"': 2.0,
    '2-1/2"': 2.5,
    '3"': 3.0,
    '4"': 4.0,
    '6"': 6.0,
  };
  
  // Render pipe section edit form
  const renderPipeSectionForm = () => {
    if (!editingPipeSection) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content" ref={editModalRef}>
          <Card title={editingPipeSection.id.includes('pipe-') ? "Add Pipe Section" : "Edit Pipe Section"}>
            <Form
              layout="vertical"
              initialValues={editingPipeSection}
              onValuesChange={(_, allValues) => setEditingPipeSection({ ...editingPipeSection, ...allValues })}
            >
              <Form.Item label="Pipe Type" name="type">
                <Select style={{ width: '100%' }}>
                  {pipeTypes.map(type => (
                    <Option key={type.code} value={type.code}>{type.name}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Pipe Size" name="size">
                <Select style={{ width: '100%' }}>
                  {pipeSizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Length (ft)" name="length">
                <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item label="Material" name="material">
                <Select style={{ width: '100%' }}>
                  {pipeMaterials.map(material => (
                    <Option key={material} value={material}>{material}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              {blueprintData.analysisType !== 'materials' && (
                <Form.Item label="Unit Price" name="unitPrice">
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`}
                    parser={(value: string | undefined): number => (value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0)}
                  />
                </Form.Item>
              )}
              
              <div className="modal-actions">
                <Space>
                  <Button onClick={() => setEditingPipeSection(null)}>Cancel</Button>
                  <Button type="primary" onClick={savePipeSection}>Save</Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render fixture edit form
  const renderFixtureForm = () => {
    if (!editingFixture) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content" ref={editModalRef}>
          <Card title={editingFixture.id.includes('fixture-') ? "Add Fixture" : "Edit Fixture"}>
            <Form
              layout="vertical"
              initialValues={editingFixture}
              onValuesChange={(changedValues, allValues) => {
                // Special handling for connections which is a nested object
                if (changedValues.connections) {
                  setEditingFixture({
                    ...editingFixture,
                    ...allValues,
                    connections: { ...editingFixture.connections, ...changedValues.connections }
                  });
                } else {
                  setEditingFixture({ ...editingFixture, ...allValues });
                }
              }}
            >
              <Form.Item label="Fixture Type" name="type">
                <Select style={{ width: '100%' }}>
                  {fixtureTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Description" name="description">
                <Input />
              </Form.Item>
              
              <Form.Item label="Quantity" name="quantity">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Divider>Connections</Divider>
              
              <Form.Item label="Waste Connection" name={['connections', 'waste']}>
                <Select style={{ width: '100%' }} allowClear>
                  <Option value="">None</Option>
                  {pipeSizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Vent Connection" name={['connections', 'vent']}>
                <Select style={{ width: '100%' }} allowClear>
                  <Option value="">None</Option>
                  {pipeSizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Cold Water Connection" name={['connections', 'coldWater']}>
                <Select style={{ width: '100%' }} allowClear>
                  <Option value="">None</Option>
                  {pipeSizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Hot Water Connection" name={['connections', 'hotWater']}>
                <Select style={{ width: '100%' }} allowClear>
                  <Option value="">None</Option>
                  {pipeSizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              {blueprintData.analysisType !== 'materials' && (
                <Form.Item label="Unit Price" name="unitPrice">
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`}
                    parser={(value: string | undefined): number => (value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0)}
                  />
                </Form.Item>
              )}
              
              <div className="modal-actions">
                <Space>
                  <Button onClick={() => setEditingFixture(null)}>Cancel</Button>
                  <Button type="primary" onClick={saveFixture}>Save</Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render valve edit form
  const renderValveForm = () => {
    if (!editingValve) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content" ref={editModalRef}>
          <Card title={editingValve.id.includes('valve-') ? "Add Valve/Specialty" : "Edit Valve/Specialty"}>
            <Form
              layout="vertical"
              initialValues={editingValve}
              onValuesChange={(_, allValues) => setEditingValve({ ...editingValve, ...allValues })}
            >
              <Form.Item label="Type" name="type">
                <Select style={{ width: '100%' }}>
                  {valveTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Size" name="size">
                <Select style={{ width: '100%' }}>
                  <Option value="Various">Various</Option>
                  {pipeSizes.map(size => (
                    <Option key={size} value={size}>{size}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="Quantity" name="quantity">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              
              {blueprintData.analysisType !== 'materials' && (
                <Form.Item label="Unit Price" name="unitPrice">
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`}
                    parser={(value: string | undefined): number => (value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0)}
                  />
                </Form.Item>
              )}
              
              <div className="modal-actions">
                <Space>
                  <Button onClick={() => setEditingValve(null)}>Cancel</Button>
                  <Button type="primary" onClick={saveNewValve}>Save</Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render note edit form
  const renderNoteForm = () => {
    if (!editingNote) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content" ref={editModalRef}>
          <Card title={editingNote.text ? "Edit Note" : "Add Note"}>
            <Form
              layout="vertical"
              initialValues={editingNote}
              onValuesChange={(_, allValues) => setEditingNote({ ...editingNote, ...allValues })}
            >
              <Form.Item label="Note Text" name="text">
                <Input.TextArea rows={4} />
              </Form.Item>
              
              <Form.Item label="Priority" name="priority">
                <Select style={{ width: '100%' }}>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
              
              <div className="modal-actions">
                <Space>
                  <Button onClick={() => setEditingNote(null)}>Cancel</Button>
                  <Button type="primary" onClick={saveEditedNote}>Save</Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render blueprint preview modal
  const renderBlueprintPreview = () => {
    if (!showBlueprintPreview) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content blueprint-preview">
          <Card 
            title="Blueprint Preview" 
            extra={<Button type="text" onClick={() => setShowBlueprintPreview(null)}>Close</Button>}
          >
            <div className="blueprint-image-container">
              <img 
                src={showBlueprintPreview} 
                alt="Blueprint" 
                className="blueprint-image" 
              />
            </div>
          </Card>
        </div>
      </div>
    );
  };
  
  // Main render function
  return (
    <div className="plumbing-analyzer">
      {analysisState === 'analyzing' ? (
        <div className="analysis-loading">
          <Spin size="large" />
          <div className="progress-text">Analyzing plumbing elements in blueprint...</div>
        </div>
      ) : (
        <>
          {plumbingData ? (
            <div className="analysis-content">
              <div className="header-actions">
                <Space>
                  <Button 
                    onClick={() => setShowBlueprintPreview(blueprintData.imageUrls[0])}
                    icon={<FileImageOutlined />}
                  >
                    View Blueprint
                  </Button>
                  
                  {isEditable && isModified && (
                    <Button 
                      type="primary"
                      onClick={saveChanges}
                      icon={<SaveOutlined />}
                    >
                      Save Changes
                    </Button>
                  )}
                </Space>
              </div>
              
              <Tabs defaultActiveKey="pipes" className="analysis-tabs">
                <TabPane tab="Pipe Sections" key="pipes">
                  {renderPipeSectionsTable()}
                </TabPane>
                
                <TabPane tab="Fixtures" key="fixtures">
                  {renderFixturesTable()}
                </TabPane>
                
                <TabPane tab="Valves & Specialties" key="valves">
                  {renderValvesTable()}
                </TabPane>
                
                <TabPane tab="Notes" key="notes">
                  {renderNotes()}
                </TabPane>
                
                <TabPane tab="Summary" key="summary">
                  {renderSummary()}
                </TabPane>
              </Tabs>
              
              {/* Form modals */}
              {renderPipeCalculator()}
              {renderPipeSectionForm()}
              {renderFixtureForm()}
              {renderValveForm()}
              {renderNoteForm()}
              {renderBlueprintPreview()}
            </div>
          ) : (
            <div className="no-data">
              <Alert
                message="No plumbing analysis data"
                description="Upload a blueprint to analyze the plumbing components."
                type="info"
                showIcon
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlumbingAnalyzer;
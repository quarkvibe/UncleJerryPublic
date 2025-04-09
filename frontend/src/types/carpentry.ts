/**
 * Core types for Uncle Jerry Blueprint Analyzer
 */

// Blueprint data types
export interface BlueprintData {
    projectId: string;
    projectName: string;
    blueprintImages: string[]; // URLs to blueprint images
    scale?: number;
    metadata?: {
      author?: string;
      date?: string;
      revision?: string;
      [key: string]: any;
    }
  }
  
  // Geometric types
  export interface Point {
    x: number;
    y: number;
  }
  
  export interface LineSegment {
    id: string;
    start: Point;
    end: Point;
  }
  
  export interface AreaCalculation {
    area: number; // square feet
    perimeter: number; // linear feet
    points: Point[]; // vertices of the area
  }
  
  // Wall-related types
  export interface WallSegment extends LineSegment {
    wallTypeCode?: string;
    thickness?: number; // inches
    height?: number; // feet
    length: number; // feet
  }
  
  export interface LegendItem {
    id?: string;
    code: string;
    description: string;
    graphicalRepresentation?: string;
  }
  
  export interface DetectedElement {
    id: string;
    type: 'wall' | 'door' | 'window' | 'fixture' | 'other';
    position: Point;
    dimensions?: {
      width: number;
      height: number;
    };
    properties?: {
      [key: string]: any;
    };
  }
  
  // Material and cost types
  export interface MaterialItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    linearFeet?: number;
    squareFeet?: number;
  }
  
  export interface EquipmentItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    rentalRate: number;
    rentalPeriod: 'Hour' | 'Day' | 'Week' | 'Month';
  }
  
  export interface LaborRole {
    role: string;
    hours: number;
    rate: number;
    cost: number;
  }
  
  export interface LaborEstimation {
    total: {
      hours: number;
      cost: number;
    };
    breakdown: LaborRole[];
  }
  
  export interface CostCategory {
    category: string;
    items: MaterialItem[];
    total: number;
  }
  
  export interface CostAdjustment {
    name: string;
    description: string;
    amount: number;
  }
  
  export interface CostEstimate {
    materialCost: {
      subtotal: number;
      categories: CostCategory[];
    };
    laborCost: {
      subtotal: number;
      breakdown: LaborRole[];
    };
    equipmentCost: {
      subtotal: number;
      items: EquipmentItem[];
    };
    subtotal: number;
    adjustments: CostAdjustment[];
    total: number;
  }
  
  // Component props types
  export interface TradeAnalyzerProps {
    blueprintData: BlueprintData | null;
    isAnalyzing: boolean;
    onAnalysisComplete?: (result: AnalysisResult) => void;
    onExport?: (data: ExportData) => void;
  }
  
  export interface AnalysisResult {
    trade: string;
    success: boolean;
    results: any;
    error?: string;
  }
  
  export interface ExportData {
    trade: string;
    data: any;
  }
  
  // Shared UI component props
  export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }
  
  export interface MaterialCardProps {
    material: MaterialItem;
    showDetails?: boolean;
    onClick?: () => void;
  }
  
  export interface LegendDetectorProps {
    imageUrl: string;
    onLegendDetected: (legend: LegendItem[]) => void;
  }
  
  export interface BlueprintViewerProps {
    imageUrl: string;
    scale?: number;
    highlightedElements?: DetectedElement[];
    onElementSelect?: (element: DetectedElement) => void;
  }
  
  export interface ZoomableImageProps {
    imageUrl: string;
    overlays?: {
      id: string;
      type: 'line' | 'rect' | 'circle' | 'polygon';
      [key: string]: any;
    }[];
    onElementClick?: (element: any) => void;
  }
  
  export interface ScopeSectionProps {
    title: string;
    items: {
      title: string;
      description: string;
      quantity: string | number;
      unit: string;
    }[];
  }
  
  export interface CostBreakdownProps {
    costEstimate: CostEstimate;
    detailed?: boolean;
  }
  
  export interface LaborEstimateProps {
    labor: LaborEstimation;
    showDetails?: boolean;
  }
  
  export interface CharacterAvatarProps {
    character: 'uncleJerry' | 'plumberPete' | 'electricianEmma' | 'architectAl';
    size?: number;
    withBadge?: boolean;
  }
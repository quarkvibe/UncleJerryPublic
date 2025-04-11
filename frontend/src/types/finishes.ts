/**
 * Type definitions for the Finishes component
 */

// Base material interface
export interface FinishMaterial {
  id: string;
  category: string;
  material: string;
  manufacturer: string;
  product: string;
  location: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  calculationBasis?: string;
  finishCode?: string;
}

// Category interface
export interface FinishCategory {
  id?: string;
  name: string;
  description?: string;
  materials: FinishMaterial[];
  totalQuantity?: number;
  totalCost?: number;
}

// Analysis interface
export interface FinishAnalysis {
  id: string;
  projectName: string;
  dateAnalyzed: string;
  categories: {
    floors: FinishCategory[];
    walls: FinishCategory[];
    ceilings: FinishCategory[];
    millwork: FinishCategory[];
    transitions: FinishCategory[];
    specialItems: FinishCategory[];
  };
  totalCost: number;
  totalArea: number;
  laborCost?: number;
  scaleReference?: {
    referenceLength: number;
    pixelLength: number;
    unit: string;
  };
  imageUrls: string[];
}

// Component props
export interface FinishScheduleAnalyzerProps {
  projectId: string;
  onAnalysisComplete?: (analysis: FinishAnalysis) => void;
  initialData?: FinishAnalysis;
  isStandalone?: boolean;
}

// Analysis settings
export interface FinishAnalysisSettings {
  includeWasteFactor: boolean;
  wasteFactorPercentage: number;
  defaultCeilingHeight: number;
  includeLabor: boolean;
  laborRate: number;
  calculatePricing: boolean;
  roundUpQuantities: boolean;
}

// Blueprint images
export interface BlueprintImages {
  floorPlan?: File;
  finishSchedule?: File;
  finishPlan?: File;
  details?: File[];
}

// Blueprint image URLs
export interface BlueprintImageUrls {
  floorPlan?: string;
  finishSchedule?: string;
  finishPlan?: string;
  details: string[];
}

// Scale reference
export interface ScaleReference {
  referenceLength: number;
  pixelLength: number;
  unit: string;
}

// State for the finishes component
export interface FinishesState {
  currentAnalysis: FinishAnalysis;
  isAnalyzing: boolean;
  error: null | string;
  materials: FinishMaterial[];
  takeoff: {
    materials: FinishMaterial[];
    totalCost: number;
  };
}

// Mock app state for testing purposes
export interface MockAppState {
  materials: any[];
  isLoading: boolean;
  error: null | string;
  currentAnalysis: any;
  isAnalyzing: boolean;
  takeoff: { materials: any[], totalCost: number };
  activeStep: number;
  finish: FinishesState;
}
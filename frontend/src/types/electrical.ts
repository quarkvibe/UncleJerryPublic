// src/types/electrical.ts

/**
 * Interface for electrical component objects
 */
export interface ElectricalComponent {
    category: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice?: number;
    totalPrice?: number;
  }
  
  /**
   * Interface for installation notes
   */
  export interface InstallationNote {
    text: string;
    priority: 'high' | 'medium' | 'low';
  }
  
  /**
   * Interface for electrical analysis results
   */
  export interface ElectricalAnalysisResult {
    components: ElectricalComponent[];
    notes: InstallationNote[];
    totalMCCable: number;
    totalConduit: number;
    totalBoxes: number;
    laborHours?: number;
  }
  
  /**
   * Interface for blueprint data
   */
  export interface BlueprintData {
    imageUrls: string[];
    projectScale?: string;
    analysisType: 'materials' | 'costs' | 'full';
  }
  
  /**
   * Interface for electrical analyzer component props
   */
  export interface ElectricalAnalyzerProps {
    blueprintData: BlueprintData;
    onAnalysisComplete: (result: ElectricalAnalysisResult) => void;
    onAnalysisProgress?: (progress: number) => void;
    analysisResult?: ElectricalAnalysisResult;
    isEditable?: boolean;
  }
  
  /**
   * Interface for MC cable calculation
   */
  export interface MCCalculation {
    length: number;
    runs: number;
    extraPercentage: number;
  }
  
  /**
   * Interface for blueprint file objects
   */
  export interface BlueprintFile {
    id: string;
    name: string;
    type: string;
    file: File;
    url: string;
    dateUploaded: number;
  }
  
  /**
   * Interface for electrical project
   */
  export interface ElectricalProject {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    blueprintIds: string[];
    results: ElectricalAnalysisResult;
    notes?: string;
  }
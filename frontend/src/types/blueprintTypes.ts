// Blueprint Analyzer Type Definitions

// Base interface for blueprint sections
export interface BlueprintSection {
  id: string;
  name: string;
  imageFile?: File;
  imageUrl?: string;
  imageId?: string;
}

// Base interface for analysis results
export interface AnalysisResult {
  id: string;
  projectId: string;
  createdAt: string;
  tradeType: string;
}

// HVAC component type enumeration
export enum HVACComponentType {
  DUCT = 'Ductwork',
  DIFFUSER = 'Diffuser',
  GRILLE = 'Grille',
  REGISTER = 'Register',
  EQUIPMENT = 'Equipment',
  CONTROL = 'Control',
  ACCESSORY = 'Accessory',
  INSULATION = 'Insulation',
  DAMPER = 'Damper'
}
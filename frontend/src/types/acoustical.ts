// src/types/acoustical.ts

// Interface for acoustical ceiling type definitions
export interface AcousticalType {
    code: string;           // Short code used in blueprints (e.g., 'ACP', 'ACT')
    name: string;           // Human-readable name
    description: string;    // Full description of the ceiling type
    unitCost: number;       // Cost per square foot
    standardSize: {         // Standard unit dimensions
      width: number;        // Width in feet
      height: number;       // Height in feet
    };
  }
  
  // Interface for a ceiling section that needs acoustical materials
  export interface AcousticalSection {
    id: string;             // Unique identifier
    name: string;           // Section name (e.g., "Dining Area")
    type: string;           // Acoustical type code
    area: number;           // Area in square feet
    materialCost?: number;  // Calculated material cost (optional, derived)
  }
  
  // Interface for grid system or suspension system requirements
  export interface GridRequirement {
    itemName: string;       // Name of the grid item (e.g., "Main Runners")
    description: string;    // Description of the grid item
    quantity: number;       // Quantity needed
    unit: string;           // Unit of measurement (e.g., "pieces", "linear feet")
    cost?: number;          // Optional cost information
  }
  
  // Interface for acoustical calculation results by type
  export interface AcousticalTypeResult {
    type: string;           // Acoustical type code
    description: string;    // Description of the acoustical type
    totalArea: number;      // Total area in square feet
    unitsRequired: number;  // Number of units required (panels, tiles, sheets, etc.)
    materialCost: number;   // Total material cost
  }
  
  // Interface for acoustical ceiling calculation results
  export interface AcousticalResult {
    sections: AcousticalSection[];              // All ceiling sections with calculated costs
    totalsByType: AcousticalTypeResult[];       // Results grouped by acoustical type
    totalArea: number;                          // Total area of all sections
    gridRequirements?: GridRequirement[];       // Grid system requirements (if applicable)
    wasteFactor: number;                        // Applied waste factor percentage
    timestamp: number;                          // When the calculation was performed
  }
  
  // Interface for user-saved analysis projects
  export interface AcousticalProject {
    id: string;             // Unique project identifier
    name: string;           // Project name
    createdAt: number;      // Creation timestamp
    updatedAt: number;      // Last update timestamp
    blueprintIds: string[]; // References to associated blueprints
    results: AcousticalResult; // Calculation results
    notes?: string;         // Optional user notes
  }
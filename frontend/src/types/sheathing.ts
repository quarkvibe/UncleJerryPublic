// src/types/sheathing.ts

// Interface for sheathing type definitions
export interface SheatheType {
    code: string;           // Short code used in blueprints (e.g., 'P', 'E')
    name: string;           // Human-readable name
    description: string;    // Full description of the sheathing type
    unitCost: number;       // Cost per square foot
    standardSize: {         // Standard sheet dimensions
      width: number;        // Width in feet
      height: number;       // Height in feet
    };
  }
  
  // Interface for a wall section that needs sheathing
  export interface SheatheSection {
    id: string;             // Unique identifier
    name: string;           // Section name (e.g., "Exterior front wall")
    type: string;           // Sheathing type code
    length: number;         // Length in feet
    height: number;         // Height in feet
    area?: number;          // Calculated area in square feet (optional, can be derived)
    materialCost?: number;  // Calculated material cost (optional, derived)
  }
  
  // Interface for cement board base requirements
  export interface CementBoardRequirements {
    linearFeet: number;     // Total linear feet requiring cement board base
    areaNeeded: number;     // Total area of cement board needed in square feet
    sheetsRequired: number; // Number of standard sheets required
  }
  
  // Interface for sheathing calculation results by type
  export interface SheatheTypeResult {
    type: string;           // Sheathing type code
    description: string;    // Description of the sheathing type
    totalArea: number;      // Total area in square feet
    sheetsRequired: number; // Number of sheets required
    materialCost: number;   // Total material cost
  }
  
  // Interface for wall sheathing calculation results
  export interface SheatheResult {
    sections: SheatheSection[];              // All wall sections with calculated areas and costs
    totalsByType: SheatheTypeResult[];       // Results grouped by sheathing type
    totalArea: number;                       // Total area of all sections
    totalSheets: number;                     // Total sheets required
    cementBoardBaseRequirements: CementBoardRequirements; // Additional cement board requirements
    wasteFactor: number;                     // Applied waste factor percentage
    timestamp: number;                       // When the calculation was performed
  }
  
  // Interface for user-saved analysis projects
  export interface SheathingProject {
    id: string;             // Unique project identifier
    name: string;           // Project name
    createdAt: number;      // Creation timestamp
    updatedAt: number;      // Last update timestamp
    blueprintIds: string[]; // References to associated blueprints
    results: SheatheResult; // Calculation results
    notes?: string;         // Optional user notes
  }
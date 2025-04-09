import { v4 as uuidv4 } from 'uuid';
import { 
  FinishMaterial, 
  FinishCategory,
  FinishAnalysis
} from '../components/FinishScheduleAnalyzer';

// Types for the AI analysis response
interface AIAnalysisResponse {
  floors: AIFinishCategory[];
  walls: AIFinishCategory[];
  ceilings: AIFinishCategory[];
  millwork: AIFinishCategory[];
  transitions: AIFinishCategory[];
  specialItems: AIFinishCategory[];
  scale: {
    pixelsPerUnit: number;
    unit: string;
  };
  rooms: Room[];
}

interface AIFinishCategory {
  name: string;
  materials: AIFinishMaterial[];
}

interface AIFinishMaterial {
  material: string;
  manufacturer: string;
  product: string;
  location: string;
  finishCode?: string;
  quantity: number;
  unit: string;
  notes?: string;
  calculationBasis?: string;
}

interface Room {
  name: string;
  area: number;
  perimeter: number;
  height?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Line {
  start: Point;
  end: Point;
}

interface Polygon {
  points: Point[];
}

interface ScaleReference {
  referenceLength: number;
  pixelLength: number;
  unit: string;
}

interface AnalysisSettings {
  includeWasteFactor: boolean;
  wasteFactorPercentage: number;
  defaultCeilingHeight: number;
  includeLabor: boolean;
  laborRate: number;
  calculatePricing: boolean;
  roundUpQuantities: boolean;
}

// Material pricing database (this would typically come from an API or database)
const materialPricing: Record<string, number> = {
  // Flooring (per square foot)
  "concrete_topping": 3.50,
  "brick_veneer": 12.75,
  "concrete_slurry": 5.25,
  "epoxy_floor": 7.50,
  "vinyl_tile": 4.25,
  "ceramic_tile": 6.50,
  "porcelain_tile": 8.75,
  "carpet": 4.00,
  
  // Wall finishes (per square foot)
  "stainless_steel_panel": 18.50,
  "stainless_steel_corner_guard": 9.75, // per linear foot
  "stainless_steel_wall_cap": 7.25, // per linear foot
  "stainless_steel_cooler_trim": 10.50, // per linear foot
  "fiber_reinforced_plastic": 4.25,
  "limestone_finish": 12.75,
  "brick": 9.50,
  "wall_tile": 7.25,
  "vinyl_wall_base": 3.50, // per linear foot
  
  // Paints (per square foot coverage)
  "sherwin_williams_paint": 0.85,
  
  // Ceilings (per square foot)
  "acoustic_ceiling_tile": 3.75,
  
  // Transitions (per linear foot)
  "schluter_jolly": 4.25,
  "schluter_dilex": 5.50,
  
  // Specialty items
  "stainless_steel_sheet": 22.50, // per square foot
  "river_rocks": 6.75, // per cubic foot
  
  // Default for unknown materials
  "default": 5.00
};

// Labor rates by material type (hours per unit)
const laborRates: Record<string, number> = {
  // Flooring (hours per square foot)
  "concrete_topping": 0.05,
  "brick_veneer": 0.15,
  "concrete_slurry": 0.08,
  "epoxy_floor": 0.07,
  "vinyl_tile": 0.05,
  "ceramic_tile": 0.12,
  "porcelain_tile": 0.12,
  
  // Wall finishes (hours per square foot)
  "stainless_steel_panel": 0.12,
  "stainless_steel_corner_guard": 0.1, // per linear foot
  "stainless_steel_wall_cap": 0.08, // per linear foot
  "stainless_steel_cooler_trim": 0.15, // per linear foot
  "fiber_reinforced_plastic": 0.07,
  "limestone_finish": 0.15,
  "brick": 0.18,
  "wall_tile": 0.14,
  "vinyl_wall_base": 0.05, // per linear foot
  
  // Paints (hours per square foot)
  "sherwin_williams_paint": 0.015,
  
  // Ceilings (hours per square foot)
  "acoustic_ceiling_tile": 0.08,
  
  // Transitions (hours per linear foot)
  "schluter_jolly": 0.1,
  "schluter_dilex": 0.12,
  
  // Default for unknown materials
  "default": 0.1
};

/**
 * Processes the AI analysis response into a structured format
 */
export const processAIAnalysis = (
  aiResponse: AIAnalysisResponse, 
  scaleReference: ScaleReference,
  settings: AnalysisSettings
): FinishAnalysis => {
  const convertedCategories = {
    floors: convertAICategoryToFinishCategory(aiResponse.floors, settings),
    walls: convertAICategoryToFinishCategory(aiResponse.walls, settings),
    ceilings: convertAICategoryToFinishCategory(aiResponse.ceilings, settings),
    millwork: convertAICategoryToFinishCategory(aiResponse.millwork, settings),
    transitions: convertAICategoryToFinishCategory(aiResponse.transitions, settings),
    specialItems: convertAICategoryToFinishCategory(aiResponse.specialItems, settings)
  };
  
  // Calculate total cost across all categories
  const totalCost = Object.values(convertedCategories)
    .flat()
    .reduce((acc, category) => acc + category.totalCost, 0);
  
  // Calculate total floor area from room data
  const totalArea = aiResponse.rooms.reduce((acc, room) => acc + room.area, 0);
  
  // Calculate labor cost if needed
  let laborCost = 0;
  if (settings.includeLabor) {
    laborCost = calculateLaborCost(convertedCategories, settings.laborRate);
  }
  
  return {
    id: uuidv4(),
    projectName: "Finish Schedule Analysis", // This would be passed in from the project
    dateAnalyzed: new Date().toISOString(),
    categories: convertedCategories,
    totalCost: totalCost + laborCost,
    totalArea,
    scaleReference: {
      referenceLength: scaleReference.referenceLength,
      pixelLength: scaleReference.pixelLength,
      unit: scaleReference.unit
    },
    imageUrls: [], // These would be the URLs of the uploaded blueprints
  };
};

/**
 * Converts AI category format to internal FinishCategory format
 */
const convertAICategoryToFinishCategory = (
  aiCategories: AIFinishCategory[],
  settings: AnalysisSettings
): FinishCategory[] => {
  return aiCategories.map(aiCategory => {
    const materials = aiCategory.materials.map(aiMaterial => {
      // Determine material type for pricing lookup
      const materialType = getMaterialType(aiMaterial.material, aiMaterial.manufacturer);
      
      // Get unit price from pricing database
      const unitPrice = materialPricing[materialType] || materialPricing.default;
      
      // Calculate quantity with waste factor if enabled
      let quantity = aiMaterial.quantity;
      if (settings.includeWasteFactor) {
        quantity = quantity * (1 + (settings.wasteFactorPercentage / 100));
      }
      
      // Round up quantities if enabled
      if (settings.roundUpQuantities) {
        quantity = Math.ceil(quantity);
      }
      
      // Calculate total price
      const totalPrice = settings.calculatePricing ? quantity * unitPrice : 0;
      
      return {
        id: uuidv4(),
        category: aiCategory.name,
        material: aiMaterial.material,
        manufacturer: aiMaterial.manufacturer,
        product: aiMaterial.product,
        location: aiMaterial.location,
        quantity,
        unit: aiMaterial.unit,
        unitPrice,
        totalPrice,
        notes: aiMaterial.notes,
        calculationBasis: aiMaterial.calculationBasis,
        finishCode: aiMaterial.finishCode
      } as FinishMaterial;
    });
    
    // Calculate total quantity and cost for the category
    const totalQuantity = materials.reduce((acc, material) => 
      material.unit === aiCategory.materials[0]?.unit ? acc + material.quantity : acc, 
      0
    );
    
    const totalCost = materials.reduce((acc, material) => 
      acc + (material.totalPrice || 0), 
      0
    );
    
    return {
      name: aiCategory.name,
      materials,
      totalQuantity,
      totalCost
    } as FinishCategory;
  });
};

/**
 * Maps material description to a standardized material type for pricing lookup
 */
const getMaterialType = (material: string, manufacturer: string): string => {
  // This is a simplified mapping function
  // In a real application, this would be more sophisticated and use a database
  const materialLower = material.toLowerCase();
  const manufacturerLower = manufacturer.toLowerCase();
  
  if (materialLower.includes('concrete') && materialLower.includes('topping')) {
    return 'concrete_topping';
  } else if (materialLower.includes('brick') && materialLower.includes('veneer')) {
    return 'brick_veneer';
  } else if (materialLower.includes('concrete') && materialLower.includes('slurry')) {
    return 'concrete_slurry';
  } else if (materialLower.includes('epoxy') && materialLower.includes('floor')) {
    return 'epoxy_floor';
  } else if (materialLower

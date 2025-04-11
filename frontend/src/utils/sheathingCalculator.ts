// Sheathing calculator utility

// Define types for sheathing calculations
import { SheatheSection, SheatheType, SheatheResult, SheatheTypeResult } from '../types/sheathing';

/**
 * Calculate wall sheathing material requirements based on blueprint sections
 * @param sections Array of wall sections from the blueprint
 * @param sheathingType Type of sheathing material to use
 * @returns Calculation result with materials and labor
 */
export function calculateWallSheathing(
  sections: SheatheSection[], 
  sheathingType: SheatheType,
  wasteFactor: number = 15
): SheatheResult {
  // Default result structure
  const result: SheatheResult = {
    sections: [...sections],
    totalsByType: [],
    totalArea: 0,
    totalSheets: 0,
    cementBoardBaseRequirements: {
      linearFeet: 0,
      areaNeeded: 0,
      sheetsRequired: 0
    },
    wasteFactor: wasteFactor,
    timestamp: Date.now()
  };
  
  // Calculate total wall area
  let totalArea = 0;
  for (const section of sections) {
    const area = section.length * section.height;
    totalArea += area;
  }
  
  result.totalArea = totalArea;
  
  // Calculate sheets needed based on standard 4'x8' sheet (32 sq ft)
  const standardSheetArea = 32; // 4' x 8'
  let sheetsNeeded = Math.ceil(totalArea / standardSheetArea);
  
  // Add wastage factor
  const sheetsWithWastage = Math.ceil(sheetsNeeded * (1 + wasteFactor/100));
  result.totalSheets = sheetsWithWastage;
  
  // Determine unit cost based on sheathing type
  let unitCost = 0;
  let sheathingName = '';
  
  // Check if sheathingType is an object or string
  const typeCode = typeof sheathingType === 'object' ? sheathingType.code : String(sheathingType);
  
  // Use if/else instead of switch to avoid type comparison issues
  if (typeCode === 'osb_7_16' || typeCode === 'P') {
    unitCost = 25;
    sheathingName = '7/16" OSB Sheathing';
  } else if (typeCode === 'osb_1_2' || typeCode === 'E') {
    unitCost = 32;
    sheathingName = '1/2" OSB Sheathing';
  } else if (typeCode === 'plywood_1_2' || typeCode === 'PG') {
    unitCost = 45;
    sheathingName = '1/2" Plywood Sheathing';
  } else if (typeCode === 'plywood_5_8' || typeCode === 'PT') {
    unitCost = 55;
    sheathingName = '5/8" Plywood Sheathing';
  } else if (typeCode === 'zip_system_1_2' || typeCode === 'CB') {
    unitCost = 75;
    sheathingName = '1/2" Zip System Sheathing';
  } else {
    unitCost = 32;
    sheathingName = '1/2" OSB Sheathing';
  }
  
  // Calculate material cost
  const sheathingCost = sheetsWithWastage * unitCost;
  
  // Add fasteners
  const fastenerBoxes = Math.ceil(sheetsWithWastage / 10); // One box per 10 sheets
  const fastenerCost = fastenerBoxes * 15;
  
  // Add house wrap if using non-zip system
  let houseWrapRolls = 0;
  let houseWrapCost = 0;
  
  if (typeof sheathingType === 'object' && sheathingType.code !== 'zip_system_1_2') {
    houseWrapRolls = Math.ceil(totalArea / 1000); // Each roll covers ~1000 sq ft
    houseWrapCost = houseWrapRolls * 150;
  }
  
  // Calculate labor hours and cost
  const laborRate = 55; // Per hour
  
  // Average installation rate: 4 sheets per hour
  const sheathingLaborHours = sheetsWithWastage / 4;
  
  // House wrap installation: 500 sq ft per hour
  const houseWrapLaborHours = (typeof sheathingType === 'object' && sheathingType.code !== 'zip_system_1_2') ? totalArea / 500 : 0;
  
  // Total labor hours
  const totalLaborHours = sheathingLaborHours + houseWrapLaborHours;
  
  // Create totalsByType
  const typeResult: SheatheTypeResult = {
    type: typeof sheathingType === 'object' ? sheathingType.code : 'default',
    description: sheathingName,
    totalArea: totalArea,
    sheetsRequired: sheetsWithWastage,
    materialCost: sheathingCost + fastenerCost + houseWrapCost
  };
  
  result.totalsByType.push(typeResult);
  
  // Update sections with calculated area and cost
  for (let i = 0; i < result.sections.length; i++) {
    const section = result.sections[i];
    const area = section.length * section.height;
    section.area = area;
    section.materialCost = (area / totalArea) * (sheathingCost + fastenerCost + houseWrapCost);
  }
  
  // Update cement board requirements if needed
  const needsCementBoard = typeof sheathingType === 'object' && 
    (sheathingType.code === 'cement_board' || sheathingType.code === 'hardie_board');
  
  if (needsCementBoard) {
    const totalLinearFeet = sections.reduce((sum, section) => sum + section.length, 0);
    result.cementBoardBaseRequirements = {
      linearFeet: totalLinearFeet,
      areaNeeded: totalLinearFeet * 0.5, // Assuming 6" height for base
      sheetsRequired: Math.ceil((totalLinearFeet * 0.5) / 32) // Standard 4'x8' sheet
    };
  }
  
  return result;
}
// Sheathing calculator utility

// Define types for sheathing calculations
import { SheatheSection, SheatheType, SheatheResult } from '../types/sheathing';

/**
 * Calculate wall sheathing material requirements based on blueprint sections
 * @param sections Array of wall sections from the blueprint
 * @param sheathingType Type of sheathing material to use
 * @returns Calculation result with materials and labor
 */
export function calculateWallSheathing(
  sections: SheatheSection[], 
  sheathingType: SheatheType
): SheatheResult {
  // Default result structure
  const result: SheatheResult = {
    materials: [],
    totalArea: 0,
    sheetsNeeded: 0,
    laborHours: 0,
    totalMaterialCost: 0,
    totalLaborCost: 0,
    totalCost: 0,
    notes: []
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
  
  // Add wastage factor of 15%
  const sheetsWithWastage = Math.ceil(sheetsNeeded * 1.15);
  result.sheetsNeeded = sheetsWithWastage;
  
  // Determine unit cost based on sheathing type
  let unitCost = 0;
  let sheathingName = '';
  
  switch (sheathingType) {
    case 'osb_7_16':
      unitCost = 25;
      sheathingName = '7/16" OSB Sheathing';
      break;
    case 'osb_1_2':
      unitCost = 32;
      sheathingName = '1/2" OSB Sheathing';
      break;
    case 'plywood_1_2':
      unitCost = 45;
      sheathingName = '1/2" Plywood Sheathing';
      break;
    case 'plywood_5_8':
      unitCost = 55;
      sheathingName = '5/8" Plywood Sheathing';
      break;
    case 'zip_system_1_2':
      unitCost = 75;
      sheathingName = '1/2" Zip System Sheathing';
      break;
    default:
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
  
  if (sheathingType !== 'zip_system_1_2') {
    houseWrapRolls = Math.ceil(totalArea / 1000); // Each roll covers ~1000 sq ft
    houseWrapCost = houseWrapRolls * 150;
  }
  
  // Calculate labor hours and cost
  const laborRate = 55; // Per hour
  
  // Average installation rate: 4 sheets per hour
  const sheathingLaborHours = sheetsWithWastage / 4;
  
  // House wrap installation: 500 sq ft per hour
  const houseWrapLaborHours = sheathingType !== 'zip_system_1_2' ? totalArea / 500 : 0;
  
  // Total labor hours
  const totalLaborHours = sheathingLaborHours + houseWrapLaborHours;
  result.laborHours = totalLaborHours;
  
  // Labor cost
  result.totalLaborCost = totalLaborHours * laborRate;
  
  // Add materials to result
  result.materials = [
    {
      name: sheathingName,
      quantity: sheetsWithWastage,
      unit: 'sheets',
      unitCost: unitCost,
      totalCost: sheathingCost
    },
    {
      name: 'Fasteners',
      quantity: fastenerBoxes,
      unit: 'boxes',
      unitCost: 15,
      totalCost: fastenerCost
    }
  ];
  
  // Add house wrap if not using zip system
  if (sheathingType !== 'zip_system_1_2') {
    result.materials.push({
      name: 'House Wrap',
      quantity: houseWrapRolls,
      unit: 'rolls',
      unitCost: 150,
      totalCost: houseWrapCost
    });
  }
  
  // Calculate total material cost
  result.totalMaterialCost = result.materials.reduce((sum, item) => sum + item.totalCost, 0);
  
  // Calculate total cost
  result.totalCost = result.totalMaterialCost + result.totalLaborCost;
  
  // Add notes
  result.notes = [
    'Calculation includes 15% wastage factor for sheathing',
    'Labor estimate based on industry standard installation rates',
    'Fastener quantity based on standard spacing requirements',
  ];
  
  if (sheathingType === 'zip_system_1_2') {
    result.notes.push('Zip System includes integrated water-resistive barrier; no separate house wrap needed');
  }
  
  return result;
}
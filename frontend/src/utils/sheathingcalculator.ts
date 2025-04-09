// src/utils/sheathingCalculator.ts

import { SheatheSection, SheatheType, SheatheResult, SheatheTypeResult, CementBoardRequirements } from '../types/sheathing';

/**
 * Calculate the wall sheathing material requirements based on wall sections
 * @param sections Array of wall sections
 * @param sheathingTypes Array of available sheathing types
 * @param wasteFactor Percentage to add for waste (e.g., 10 for 10%)
 * @returns Complete sheathing calculation results
 */
export const calculateWallSheathing = (
  sections: SheatheSection[],
  sheathingTypes: SheatheType[],
  wasteFactor: number = 10
): SheatheResult => {
  // Calculate area and material cost for each section
  const sectionsWithCalculations = sections.map(section => {
    const area = section.length * section.height;
    const sheathingType = sheathingTypes.find(type => type.code === section.type);
    const materialCost = sheathingType ? area * sheathingType.unitCost : 0;
    
    return {
      ...section,
      area,
      materialCost
    };
  });
  
  // Group sections by sheathing type
  const sectionsByType: Record<string, SheatheSection[]> = {};
  sectionsWithCalculations.forEach(section => {
    if (!sectionsByType[section.type]) {
      sectionsByType[section.type] = [];
    }
    sectionsByType[section.type].push(section);
  });
  
  // Calculate totals by type
  const totalsByType: SheatheTypeResult[] = Object.keys(sectionsByType).map(typeCode => {
    const typeSections = sectionsByType[typeCode];
    const sheathingType = sheathingTypes.find(type => type.code === typeCode);
    const totalArea = typeSections.reduce((sum, section) => sum + section.area!, 0);
    
    // Calculate sheets required with waste factor
    const areaWithWaste = totalArea * (1 + wasteFactor / 100);
    const sheetSize = sheathingType 
      ? sheathingType.standardSize.width * sheathingType.standardSize.height 
      : 32; // Default 4'x8' sheet
    const sheetsRequired = Math.ceil(areaWithWaste / sheetSize);
    
    // Calculate material cost
    const materialCost = typeSections.reduce((sum, section) => sum + section.materialCost!, 0);
    
    return {
      type: typeCode,
      description: sheathingType?.description || 'Unknown',
      totalArea,
      sheetsRequired,
      materialCost
    };
  });
  
  // Calculate total area and sheets
  const totalArea = totalsByType.reduce((sum, typeResult) => sum + typeResult.totalArea, 0);
  const totalSheets = totalsByType.reduce((sum, typeResult) => sum + typeResult.sheetsRequired, 0);
  
  // Calculate cement board base requirements
  // (for wall types P, PG, and PT that need 8" cement board at base)
  const cementBoardBaseRequirements = calculateCementBoardBaseRequirements(
    sectionsWithCalculations,
    sheathingTypes
  );
  
  return {
    sections: sectionsWithCalculations,
    totalsByType,
    totalArea,
    totalSheets,
    cementBoardBaseRequirements,
    wasteFactor,
    timestamp: Date.now()
  };
};

/**
 * Calculate the cement board base requirements for special wall types
 * @param sections Wall sections with calculations
 * @param sheathingTypes Available sheathing types
 * @returns Cement board requirements
 */
const calculateCementBoardBaseRequirements = (
  sections: SheatheSection[],
  sheathingTypes: SheatheType[]
): CementBoardRequirements => {
  // Codes for wall types that require cement board base (8" strip)
  const typesRequiringCementBoard = ['P', 'PG', 'PT'];
  
  // Filter sections that need cement board base
  const relevantSections = sections.filter(section => 
    typesRequiringCementBoard.includes(section.type)
  );
  
  // Calculate total linear feet
  const linearFeet = relevantSections.reduce((sum, section) => sum + section.length, 0);
  
  // Calculate area needed (8" = 0.67 feet)
  const areaNeeded = linearFeet * 0.67; // 8 inches = 0.67 feet
  
  // Calculate sheets required (standard 4'x8' cement board sheets)
  const sheetsRequired = Math.ceil(areaNeeded / 32); // 4'x8' = 32 sq ft
  
  return {
    linearFeet,
    areaNeeded,
    sheetsRequired
  };
};

/**
 * Format the sheathing results into a printable report
 * @param results Calculation results
 * @returns Formatted report text
 */
export const formatSheathingReport = (results: SheatheResult): string => {
  let report = '# Wall Sheathing Material Takeoff\n\n';
  
  // Add summary section
  report += '## Summary\n\n';
  report += `Total Wall Area: ${results.totalArea.toFixed(1)} sq ft\n`;
  report += `Total Sheets Required: ${results.totalSheets} sheets\n`;
  report += `Waste Factor Applied: ${results.wasteFactor}%\n\n`;
  
  // Add breakdown by type
  report += '## Breakdown by Sheathing Type\n\n';
  report += '| Type | Description | Total Area (sq ft) | Sheets Required |\n';
  report += '|------|-------------|-------------------|----------------|\n';
  
  results.totalsByType.forEach(typeResult => {
    report += `| ${typeResult.type} | ${typeResult.description} | ${typeResult.totalArea.toFixed(1)} | ${typeResult.sheetsRequired} |\n`;
  });
  
  // Add cement board requirements
  report += '\n## Additional Requirements\n\n';
  report += 'For wall types P, PG, and PT, an 8" strip of cement board is required at the base:\n\n';
  report += `- Total linear feet requiring base cement board: ${results.cementBoardBaseRequirements.linearFeet.toFixed(1)} ft\n`;
  report += `- Required 8" wide cement board: ${results.cementBoardBaseRequirements.areaNeeded.toFixed(1)} sq ft\n`;
  report += `- Cement board sheets required (4'×8'): ${results.cementBoardBaseRequirements.sheetsRequired}\n\n`;
  
  // Add notes
  report += '## Notes\n\n';
  report += `- Sheet quantities include a ${results.wasteFactor}% waste factor\n`;
  report += '- Standard sheet size assumed to be 4\'×8\' (32 sq ft per sheet)\n';
  report += '- Material costs are estimates based on current market rates\n';
  report += '- Local building codes may require specific sheathing types or fire ratings\n';
  
  return report;
};

/**
 * Export the sheathing results to CSV format
 * @param results Calculation results
 * @returns CSV formatted string
 */
export const exportToCsv = (results: SheatheResult): string => {
  let csv = 'Wall Section,Sheathing Type,Length (ft),Height (ft),Area (sq ft),Material Cost\n';
  
  // Add wall sections
  results.sections.forEach(section => {
    csv += `"${section.name}","${section.type}",${section.length.toFixed(1)},${section.height.toFixed(1)},${section.area!.toFixed(1)},$${section.materialCost!.toFixed(2)}\n`;
  });
  
  // Add blank line and summary
  csv += '\n"Total By Type","Description","Total Area (sq ft)","Sheets Required","Material Cost"\n';
  
  // Add type totals
  results.totalsByType.forEach(typeResult => {
    csv += `"${typeResult.type}","${typeResult.description}",${typeResult.totalArea.toFixed(1)},${typeResult.sheetsRequired},$${typeResult.materialCost.toFixed(2)}\n`;
  });
  
  // Add grand total
  csv += `\n"GRAND TOTAL","All Types",${results.totalArea.toFixed(1)},${results.totalSheets},$${results.totalsByType.reduce((sum, type) => sum + type.materialCost, 0).toFixed(2)}\n`;
  
  return csv;
};
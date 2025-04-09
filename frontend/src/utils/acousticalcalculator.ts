// src/utils/acousticalCalculator.ts

import { AcousticalSection, AcousticalType, AcousticalResult, AcousticalTypeResult, GridRequirement } from '../types/acoustical';

/**
 * Calculate the acoustical ceiling material requirements based on ceiling sections
 * @param sections Array of ceiling sections
 * @param acousticalTypes Array of available acoustical types
 * @param wasteFactor Percentage to add for waste (e.g., 10 for 10%)
 * @param includeGridSystem Whether to include grid system calculations
 * @returns Complete acoustical calculation results
 */
export const calculateAcousticalCeiling = (
  sections: AcousticalSection[],
  acousticalTypes: AcousticalType[],
  wasteFactor: number = 10,
  includeGridSystem: boolean = true
): AcousticalResult => {
  // Calculate material cost for each section
  const sectionsWithCalculations = sections.map(section => {
    const acousticalType = acousticalTypes.find(type => type.code === section.type);
    const materialCost = acousticalType ? section.area * acousticalType.unitCost : 0;
    
    return {
      ...section,
      materialCost
    };
  });
  
  // Group sections by acoustical type
  const sectionsByType: Record<string, AcousticalSection[]> = {};
  sectionsWithCalculations.forEach(section => {
    if (!sectionsByType[section.type]) {
      sectionsByType[section.type] = [];
    }
    sectionsByType[section.type].push(section);
  });
  
  // Calculate totals by type
  const totalsByType: AcousticalTypeResult[] = Object.keys(sectionsByType).map(typeCode => {
    const typeSections = sectionsByType[typeCode];
    const acousticalType = acousticalTypes.find(type => type.code === typeCode);
    const totalArea = typeSections.reduce((sum, section) => sum + section.area, 0);
    
    // Calculate units required with waste factor
    const areaWithWaste = totalArea * (1 + wasteFactor / 100);
    
    let unitsRequired = 0;
    
    if (acousticalType) {
      // Calculate based on material type
      switch (typeCode) {
        case 'ACP': // 2x4 Acoustical Ceiling Panel
          unitsRequired = Math.ceil(areaWithWaste / 8); // 2'x4' = 8 sq ft per panel
          break;
        case 'ACT': // 2x2 Acoustical Ceiling Tile
          unitsRequired = Math.ceil(areaWithWaste / 4); // 2'x2' = 4 sq ft per tile
          break;
        case 'GYP': // Gypsum Board
          unitsRequired = Math.ceil(areaWithWaste / 32); // 4'x8' = 32 sq ft per sheet
          break;
        case 'W-2': // Wood Planks
          // Assuming 6" wide x 8' long planks (0.5' x 8' = 4 sq ft)
          unitsRequired = Math.ceil(areaWithWaste / 4);
          break;
        case 'OPEN': // Open ceiling (no material)
          unitsRequired = 0;
          break;
        default:
          // Default calculation based on standard size if available
          const unitSize = acousticalType.standardSize.width * acousticalType.standardSize.height;
          unitsRequired = unitSize > 0 ? Math.ceil(areaWithWaste / unitSize) : 0;
      }
    }
    
    // Calculate material cost
    const materialCost = typeSections.reduce((sum, section) => sum + (section.materialCost || 0), 0);
    
    return {
      type: typeCode,
      description: acousticalType?.description || 'Unknown',
      totalArea,
      unitsRequired,
      materialCost
    };
  });
  
  // Calculate total area
  const totalArea = totalsByType.reduce((sum, typeResult) => sum + typeResult.totalArea, 0);
  
  // Calculate grid system requirements if needed
  const gridRequirements = includeGridSystem ? calculateGridRequirements(sectionsWithCalculations, acousticalTypes) : undefined;
  
  return {
    sections: sectionsWithCalculations,
    totalsByType,
    totalArea,
    gridRequirements,
    wasteFactor,
    timestamp: Date.now()
  };
};

/**
 * Calculate grid system requirements for the ceiling
 * @param sections Ceiling sections with calculations
 * @param acousticalTypes Available acoustical types
 * @returns Grid requirements
 */
const calculateGridRequirements = (
  sections: AcousticalSection[],
  acousticalTypes: AcousticalType[]
): GridRequirement[] => {
  // Calculate areas by grid system type
  let acpActArea = 0;     // Area needing T-bar suspension system
  let gypArea = 0;        // Area needing gypsum suspension system
  let woodArea = 0;       // Area needing wood furring

  // Group by ceiling type
  sections.forEach(section => {
    const typeCode = section.type;
    const area = section.area;
    
    switch(typeCode) {
      case 'ACP':
      case 'ACT':
        acpActArea += area;
        break;
      case 'GYP':
        gypArea += area;
        break;
      case 'W-2':
        woodArea += area;
        break;
      // OPEN doesn't need grid
    }
  });
  
  const requirements: GridRequirement[] = [];
  
  // Calculate T-bar suspension system for ACP/ACT
  if (acpActArea > 0) {
    // Estimate main runners (typically 4' on center)
    const mainRunnerLength = Math.ceil((acpActArea / 4) * 1.1); // 10% extra for overlaps
    const mainRunners = Math.ceil(mainRunnerLength / 12); // 12' standard length
    
    requirements.push({
      itemName: "Main Runners",
      description: "12' Main Runners for T-bar grid",
      quantity: mainRunners,
      unit: "pieces"
    });
    
    // Estimate 4' cross tees
    const crossTees4ft = Math.ceil((acpActArea / 8) * 1.1); // Based on 2x4 grid
    
    requirements.push({
      itemName: "4' Cross Tees",
      description: "4' Cross Tees for T-bar grid",
      quantity: crossTees4ft,
      unit: "pieces"
    });
    
    // Estimate 2' cross tees (for 2x2 grid areas)
    const act2x2Area = sections
      .filter(section => section.type === 'ACT')
      .reduce((sum, section) => sum + section.area, 0);
      
    const crossTees2ft = Math.ceil((act2x2Area / 4) * 1.1);
    
    requirements.push({
      itemName: "2' Cross Tees",
      description: "2' Cross Tees for T-bar grid",
      quantity: crossTees2ft,
      unit: "pieces"
    });
    
    // Estimate wall molding
    const wallPerimeter = Math.ceil(Math.sqrt(acpActArea) * 4 * 1.1); // Approximation
    const wallMolding = Math.ceil(wallPerimeter / 10); // 10' standard length
    
    requirements.push({
      itemName: "Wall Angle Molding",
      description: "10' Wall Angle Molding",
      quantity: wallMolding,
      unit: "pieces"
    });
    
    // Estimate hanger wire
    const hangerWires = Math.ceil(acpActArea / 16); // One wire every 16 sq ft (4'x4' grid)
    
    requirements.push({
      itemName: "Hanger Wire",
      description: "#12 Gauge Hanger Wire",
      quantity: hangerWires,
      unit: "pieces"
    });
  }
  
  // Calculate gypsum suspension system
  if (gypArea > 0) {
    // Estimate carrying channels
    const carryingChannels = Math.ceil((gypArea / 4) * 1.1); // 4' on center spacing
    
    requirements.push({
      itemName: "Carrying Channels",
      description: "1-5/8\" Metal Furring Channels",
      quantity: carryingChannels,
      unit: "linear feet"
    });
    
    // Estimate furring channels
    const furringChannels = Math.ceil(gypArea * 1.1); // 16\" on center spacing (1.5 linear ft per sq ft)
    
    requirements.push({
      itemName: "Furring Channels",
      description: "7/8\" Hat Channels",
      quantity: furringChannels,
      unit: "linear feet"
    });
    
    // Estimate hanger wire
    const gypHangerWires = Math.ceil(gypArea / 16); // One wire every 16 sq ft
    
    requirements.push({
      itemName: "Drywall Hanger Wire",
      description: "#12 Gauge Hanger Wire for Drywall Suspension",
      quantity: gypHangerWires,
      unit: "pieces"
    });
  }
  
  // Calculate wood ceiling support system
  if (woodArea > 0) {
    // Estimate furring strips (16" on center)
    const furringStrips = Math.ceil((woodArea * 0.75) * 1.15); // 0.75 linear ft per sq ft with 15% waste
    
    requirements.push({
      itemName: "Wood Furring Strips",
      description: "1x3 Furring Strips (16\" O.C.)",
      quantity: furringStrips,
      unit: "linear feet"
    });
    
    // Estimate ceiling clips
    const ceilingClips = Math.ceil(woodArea / 2); // One clip every 2 sq ft (approximate)
    
    requirements.push({
      itemName: "Wood Ceiling Clips",
      description: "Ceiling clips for wood plank attachment",
      quantity: ceilingClips,
      unit: "pieces"
    });
  }
  
  return requirements;
};

/**
 * Format the acoustical results into a printable report
 * @param results Calculation results
 * @returns Formatted report text
 */
export const formatAcousticalReport = (results: AcousticalResult): string => {
  let report = '# Acoustical Ceiling Material Takeoff\n\n';
  
  // Add summary section
  report += '## Summary\n\n';
  report += `Total Ceiling Area: ${results.totalArea.toFixed(1)} sq ft\n`;
  report += `Waste Factor Applied: ${results.wasteFactor}%\n\n`;
  
  // Add breakdown by type
  report += '## Breakdown by Material Type\n\n';
  report += '| Type | Description | Total Area (sq ft) | Units Required |\n';
  report += '|------|-------------|-------------------|----------------|\n';
  
  results.totalsByType.forEach(typeResult => {
    report += `| ${typeResult.type} | ${typeResult.description} | ${typeResult.totalArea.toFixed(1)} | ${typeResult.unitsRequired} |\n`;
  });
  
  // Add grid system requirements if available
  if (results.gridRequirements && results.gridRequirements.length > 0) {
    report += '\n## Grid System Requirements\n\n';
    report += '| Item | Description | Quantity | Unit |\n';
    report += '|------|-------------|----------|------|\n';
    
    results.gridRequirements.forEach(req => {
      report += `| ${req.itemName} | ${req.description} | ${req.quantity} | ${req.unit} |\n`;
    });
  }
  
  // Add notes
  report += '\n## Notes\n\n';
  report += `- Material quantities include a ${results.wasteFactor}% waste factor\n`;
  report += '- Standard sizes assumed for each material type\n';
  report += '- Grid system calculations based on industry standard spacing\n';
  report += '- Local building codes may require specific ceiling types or ratings\n';
  
  return report;
};

/**
 * Export the acoustical results to CSV format
 * @param results Calculation results
 * @returns CSV formatted string
 */
export const exportToCsv = (results: AcousticalResult): string => {
  let csv = 'Ceiling Section,Material Type,Area (sq ft),Material Cost\n';
  
  // Add ceiling sections
  results.sections.forEach(section => {
    csv += `"${section.name}","${section.type}",${section.area.toFixed(1)},$${section.materialCost!.toFixed(2)}\n`;
  });
  
  // Add blank line and summary
  csv += '\n"Total By Type","Description","Total Area (sq ft)","Units Required","Material Cost"\n';
  
  // Add type totals
  results.totalsByType.forEach(typeResult => {
    csv += `"${typeResult.type}","${typeResult.description}",${typeResult.totalArea.toFixed(1)},${typeResult.unitsRequired},$${typeResult.materialCost.toFixed(2)}\n`;
  });
  
  // Add grid requirements if available
  if (results.gridRequirements && results.gridRequirements.length > 0) {
    csv += '\n"Grid Item","Description","Quantity","Unit"\n';
    
    results.gridRequirements.forEach(req => {
      csv += `"${req.itemName}","${req.description}",${req.quantity},"${req.unit}"\n`;
    });
  }
  
  // Add grand total
  csv += `\n"GRAND TOTAL","All Types",${results.totalArea.toFixed(1)},,$${results.totalsByType.reduce((sum, type) => sum + type.materialCost, 0).toFixed(2)}\n`;
  
  return csv;
};
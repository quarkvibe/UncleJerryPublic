/**
 * Analyzes wall measurements from blueprints to calculate framing materials
 * @param {Object} blueprintData - Data extracted from the blueprint
 * @param {Array} wallSections - Array of wall sections with measurements and type codes
 * @param {Object} options - Additional calculation options
 * @returns {Object} Calculated framing materials
 */
function calculateFramingMaterials(blueprintData, options = {}) {
  const { 
    wallSections = [], 
    ceilingArea = 0,
    useMetalFraming = true,
    defaultWallHeight = 9,
    studSpacing = 16, // inches
    addWasteFactor = true
  } = blueprintData;
  
  // Initialize material counts
  const materials = {
    studs: {
      metal_3_5_8: 0,
      metal_6: 0,
      metal_2_1_2: 0,
      wood_2x4: 0,
      wood_2x6: 0
    },
    track: {
      metal_3_5_8: 0,
      metal_6: 0,
      metal_2_1_2: 0,
      wood_2x4: 0,
      wood_2x6: 0
    },
    headers: 0,
    kingStuds: 0,
    crippleStuds: 0,
    cornerBacking: 0,
    blocking: 0,
    screws: 0,
    nails: 0
  };
  
  // Calculate totals
  let totalLinearFeet = 0;
  let totalWallArea = 0;
  let totalOpenings = 0;
  let wallCorners = Math.ceil(wallSections.length / 2);
  
  // Process each wall section
  wallSections.forEach(section => {
    const length = section.length;
    const height = section.height || defaultWallHeight;
    const wallArea = length * height;
    const openingCount = section.openingCount || Math.ceil(length / 12);
    
    // Add to totals
    totalLinearFeet += length;
    totalWallArea += wallArea;
    totalOpenings += openingCount;
    
    // Determine stud type from wall code
    let studType = 'metal_3_5_8'; // Default
    if (section.typeCode) {
      const typeCode = section.typeCode.replace('[', '').replace(']', '').split('|');
      const firstCode = parseInt(typeCode[0], 10);
      
      if (!isNaN(firstCode)) {
        if (firstCode === 2) studType = 'metal_2_1_2';
        else if (firstCode === 6 || firstCode === 8) studType = 'metal_6';
        else if (firstCode === 12) studType = 'wood_2x4';
        else if (firstCode === 14) studType = 'wood_2x6';
      }
    }
    
    // Calculate studs
    const studSpacingFeet = studSpacing / 12;
    const studCount = Math.ceil(length / studSpacingFeet) + 1;
    const openingStuds = openingCount * 4;
    const totalSectionStuds = studCount + openingStuds;
    
    // Add to appropriate stud type
    materials.studs[studType] += totalSectionStuds;
    
    // Add track
    materials.track[studType] += length * 2; // Top and bottom
    
    // Add opening framing
    materials.headers += openingCount;
    materials.kingStuds += openingCount * 2;
    materials.crippleStuds += openingCount * 2;
  });
  
  // Calculate corner backing
  materials.cornerBacking = wallCorners * 2;
  
  // Calculate blocking (typically 20% of wall length)
  materials.blocking = Math.ceil(totalLinearFeet * 0.2);
  
  // Calculate fasteners
  if (useMetalFraming) {
    materials.screws = Math.ceil((Object.values(materials.studs).reduce((sum, count) => sum + count, 0) * 4) / 100);
  } else {
    materials.nails = Math.ceil((Object.values(materials.studs).reduce((sum, count) => sum + count, 0) * 4) / 50);
  }
  
  // Add waste factor if requested (typically 10%)
  if (addWasteFactor) {
    const wasteFactor = 1.1;
    
    Object.keys(materials.studs).forEach(type => {
      materials.studs[type] = Math.ceil(materials.studs[type] * wasteFactor);
    });
    
    Object.keys(materials.track).forEach(type => {
      materials.track[type] = Math.ceil(materials.track[type] * wasteFactor);
    });
    
    materials.headers = Math.ceil(materials.headers * wasteFactor);
    materials.kingStuds = Math.ceil(materials.kingStuds * wasteFactor);
    materials.crippleStuds = Math.ceil(materials.crippleStuds * wasteFactor);
    materials.cornerBacking = Math.ceil(materials.cornerBacking * wasteFactor);
    materials.blocking = Math.ceil(materials.blocking * wasteFactor);
    materials.screws = Math.ceil(materials.screws * wasteFactor);
    materials.nails = Math.ceil(materials.nails * wasteFactor);
  }
  
  return {
    materials,
    totals: {
      linearFeet: totalLinearFeet,
      wallArea: totalWallArea,
      openings: totalOpenings,
      wallCorners
    }
  };
}

module.exports = { calculateFramingMaterials };

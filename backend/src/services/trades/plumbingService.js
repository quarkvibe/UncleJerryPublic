// src/services/plumbing.js

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-opus-20240229';

/**
 * Analyze plumbing blueprints using Claude and return structured results
 * @param {Array} blueprintFiles - Array of blueprint file objects
 * @param {String} analysisType - Type of analysis ('materials', 'costs', 'full')
 * @param {String} projectScale - Scale of the blueprints (optional)
 * @returns {Object} - Structured plumbing analysis results
 */
async function analyzePlumbingBlueprints(blueprintFiles, analysisType = 'full', projectScale = null) {
  try {
    logger.info('Starting plumbing blueprint analysis');
    
    // Prepare images for Claude API
    const imageContents = await Promise.all(
      blueprintFiles.map(async (file) => {
        const base64Content = await convertFileToBase64(file.path);
        return {
          type: file.type,
          source: file.originalname,
          content: base64Content
        };
      })
    );
    
    // Generate prompt for Claude based on blueprint types
    const prompt = generatePlumbingPrompt(blueprintFiles, analysisType, projectScale);
    
    // Call Claude API
    const claudeResponse = await callClaudeAPI(prompt, imageContents);
    
    // Parse response into structured data
    const parsedResults = parseClaudeResponse(claudeResponse, analysisType);
    
    // Add metadata to results
    const results = {
      ...parsedResults,
      metadata: {
        analysisType,
        projectScale,
        timestamp: new Date().toISOString(),
        blueprintCount: blueprintFiles.length
      }
    };
    
    logger.info('Plumbing blueprint analysis completed successfully');
    return results;
  } catch (error) {
    logger.error('Error analyzing plumbing blueprints:', error);
    throw new Error(`Failed to analyze plumbing blueprints: ${error.message}`);
  }
}

/**
 * Convert file to base64 string
 * @param {String} filePath - Path to the file
 * @returns {String} - Base64 encoded string
 */
async function convertFileToBase64(filePath) {
  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    logger.error(`Error converting file to base64: ${filePath}`, error);
    throw error;
  }
}

/**
 * Generate prompt for Claude based on blueprint types
 * @param {Array} blueprintFiles - Blueprint file objects
 * @param {String} analysisType - Type of analysis
 * @param {String} projectScale - Scale of the blueprints (optional)
 * @returns {String} - Formatted Claude prompt
 */
function generatePlumbingPrompt(blueprintFiles, analysisType, projectScale) {
  // Identify blueprint types
  const floorPlan = blueprintFiles.find(bp => 
    bp.type === 'floor_plan' || bp.originalname.toLowerCase().includes('floor')
  );
  
  const plumbingPlan = blueprintFiles.find(bp => 
    bp.type === 'plumbing_plan' || bp.originalname.toLowerCase().includes('plumb')
  );
  
  const legend = blueprintFiles.find(bp => 
    bp.type === 'legend' || bp.originalname.toLowerCase().includes('legend')
  );
  
  const riserDiagram = blueprintFiles.find(bp => 
    bp.type === 'riser' || bp.originalname.toLowerCase().includes('riser')
  );

  const detailsSheet = blueprintFiles.find(bp => 
    bp.type === 'details' || bp.originalname.toLowerCase().includes('detail')
  );
  
  const scheduleSheet = blueprintFiles.find(bp => 
    bp.type === 'schedule' || bp.originalname.toLowerCase().includes('schedule')
  );
  
  // Base prompt structure
  let prompt = `I need you to analyze these plumbing blueprint images. Please perform a detailed plumbing material takeoff and provide me with a comprehensive list of all plumbing components and pipe lengths.\n\n`;
  
  // Add specific instructions
  prompt += `First, carefully examine all images to identify the plumbing legend, symbols, pipe types, and scale information.\n`;
  prompt += `Then, determine the linear footage of each type and size of pipe shown in the plans (e.g., waste, vent, cold water, hot water, gas, etc.).\n`;
  prompt += `Also identify and count all plumbing fixtures, valves, and specialty items.\n`;
  
  // Project scale instruction
  if (projectScale) {
    prompt += `The provided project scale is ${projectScale}. Use this to calculate accurate pipe lengths.\n`;
  } else {
    prompt += `Please identify the project scale from any of the drawings and use it for your calculations. If not visible, use standard assumptions.\n`;
  }
  
  // Analysis type specific instructions
  if (analysisType === 'materials') {
    prompt += `Focus only on providing accurate pipe lengths, fixture counts, and material quantities without cost information.\n`;
  } else if (analysisType === 'costs') {
    prompt += `Include both material quantities and cost estimates based on current industry standard pricing.\n`;
  } else if (analysisType === 'full') {
    prompt += `Provide a comprehensive analysis including material quantities, cost estimates, and installation notes.\n`;
    prompt += `Include special considerations for pipe routing, installation requirements, and code compliance.\n`;
  }
  
  // Output format instructions
  prompt += `\nFormat your response as follows:\n`;
  prompt += `1. A table listing each pipe type and size with its total linear feet\n`;
  prompt += `2. A breakdown of pipe by size (regardless of type)\n`;
  prompt += `3. A list of all plumbing fixtures with quantities\n`;
  prompt += `4. A list of valves and specialty items with quantities\n`;
  
  if (analysisType !== 'materials') {
    prompt += `5. Include material cost estimates\n`;
  }
  
  if (analysisType === 'full') {
    prompt += `6. Important installation notes and considerations\n`;
  }
  
  // List the uploads we're providing
  prompt += `\nI've provided the following blueprint images for your analysis:\n`;
  
  if (floorPlan) {
    prompt += `- Floor plan showing overall building layout\n`;
  }
  
  if (plumbingPlan) {
    prompt += `- Plumbing plan showing pipe layout and fixture locations\n`;
  }
  
  if (legend) {
    prompt += `- Plumbing legend with symbols and descriptions\n`;
  }
  
  if (riserDiagram) {
    prompt += `- Riser diagram showing vertical plumbing connections\n`;
  }
  
  if (detailsSheet) {
    prompt += `- Details sheet with plumbing installation specifics\n`;
  }
  
  if (scheduleSheet) {
    prompt += `- Fixture and equipment schedule\n`;
  }
  
  // Add reference to any other blueprints
  const otherBlueprints = blueprintFiles.filter(bp => 
    bp !== floorPlan && 
    bp !== plumbingPlan && 
    bp !== legend && 
    bp !== riserDiagram && 
    bp !== detailsSheet && 
    bp !== scheduleSheet
  );
  
  otherBlueprints.forEach(bp => {
    prompt += `- ${bp.originalname}\n`;
  });
  
  return prompt;
}

/**
 * Call Claude API with prompt and images
 * @param {String} prompt - Text prompt for Claude
 * @param {Array} images - Array of image objects with base64 content
 * @returns {String} - Claude's response text
 */
async function callClaudeAPI(prompt, images) {
  try {
    // Map images to Claude's expected format
    const formattedImages = images.map((image, index) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: getMediaType(image.source),
        data: image.content
      }
    }));
    
    // Prepare request payload
    const payload = {
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...formattedImages
          ]
        }
      ]
    };
    
    // Make API request
    const response = await axios.post(CLAUDE_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });
    
    // Extract and return the response text
    if (response.data && response.data.content && response.data.content.length > 0) {
      return response.data.content[0].text;
    } else {
      throw new Error('No response text returned from Claude API');
    }
  } catch (error) {
    logger.error('Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Get media type based on file extension
 * @param {String} filename - Name of the file
 * @returns {String} - MIME type
 */
function getMediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

/**
 * Parse Claude's response into structured data
 * @param {String} claudeResponse - Raw text response from Claude
 * @param {String} analysisType - Type of analysis
 * @returns {Object} - Structured plumbing analysis results
 */
function parseClaudeResponse(claudeResponse, analysisType) {
  try {
    // Initialize result structure
    const result = {
      pipeSections: [],
      fixtures: [],
      valvesAndSpecialties: [],
      notes: [],
      pipeByType: {},
      pipeBySize: {},
      laborHours: analysisType === 'full' ? 0 : undefined
    };
    
    // Split the response into sections
    const sections = claudeResponse.split(/\n\s*#{1,3}\s*/);
    
    // Parse pipe sections - look for pipe tables in the response
    const pipeTablePattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+\.?\d*)\s*\|/g;
    let match;
    let pipeId = 1;
    
    while ((match = pipeTablePattern.exec(claudeResponse)) !== null) {
      // Skip table headers
      if (/Type|Size|Pipe|Length|Description|Quantity/i.test(match[1])) {
        continue;
      }
      
      // Extract pipe type and size from the table rows
      const fullType = match[1].trim();
      const size = match[2].trim();
      const length = parseFloat(match[3]);
      
      // Extract standardized type code
      let type = fullType;
      if (/soil|waste|sanitary/i.test(fullType)) type = 'SP';
      else if (/grease/i.test(fullType)) type = 'GW';
      else if (/storm/i.test(fullType)) type = 'ST';
      else if (/vent/i.test(fullType)) type = 'VP';
      else if (/cold water/i.test(fullType)) type = 'CW';
      else if (/hot water circ/i.test(fullType)) type = 'HWC';
      else if (/hot water/i.test(fullType)) type = 'HW';
      else if (/gas/i.test(fullType)) type = 'G';
      else if (/fire/i.test(fullType)) type = 'FP';
      
      // Determine material based on pipe type
      let material = 'PVC';
      if (type === 'CW' || type === 'HW' || type === 'HWC') material = 'Copper';
      else if (type === 'G') material = 'Carbon Steel';
      
      // Add to pipe sections array
      result.pipeSections.push({
        id: String(pipeId++),
        type,
        size,
        length,
        material,
        unitPrice: analysisType !== 'materials' ? getPipeUnitPrice(type, size, material) : undefined,
        totalPrice: analysisType !== 'materials' ? length * getPipeUnitPrice(type, size, material) : undefined
      });
      
      // Update pipe by type and size
      result.pipeByType[type] = (result.pipeByType[type] || 0) + length;
      result.pipeBySize[size] = (result.pipeBySize[size] || 0) + length;
    }
    
    // If no pipe sections found in tables, try parsing from text blocks
    if (result.pipeSections.length === 0) {
      const pipeTextPattern = /(?:([A-Za-z\s\/]+)\s+(?:pipe|piping)(?:\s+([^:]+))?):\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|')/gi;
      
      while ((match = pipeTextPattern.exec(claudeResponse)) !== null) {
        const fullType = match[1].trim();
        const size = match[2]?.trim() || '';
        const length = parseFloat(match[3]);
        
        // Extract standardized type code (same logic as above)
        let type = 'SP'; // Default
        if (/soil|waste|sanitary/i.test(fullType)) type = 'SP';
        else if (/grease/i.test(fullType)) type = 'GW';
        else if (/storm/i.test(fullType)) type = 'ST';
        else if (/vent/i.test(fullType)) type = 'VP';
        else if (/cold water/i.test(fullType)) type = 'CW';
        else if (/hot water circ/i.test(fullType)) type = 'HWC';
        else if (/hot water/i.test(fullType)) type = 'HW';
        else if (/gas/i.test(fullType)) type = 'G';
        else if (/fire/i.test(fullType)) type = 'FP';
        
        // Determine material based on pipe type (same logic as above)
        let material = 'PVC';
        if (type === 'CW' || type === 'HW' || type === 'HWC') material = 'Copper';
        else if (type === 'G') material = 'Carbon Steel';
        
        // Only add if not already included
        if (!result.pipeSections.some(p => p.type === type && p.size === size)) {
          result.pipeSections.push({
            id: String(pipeId++),
            type,
            size,
            length,
            material,
            unitPrice: analysisType !== 'materials' ? getPipeUnitPrice(type, size, material) : undefined,
            totalPrice: analysisType !== 'materials' ? length * getPipeUnitPrice(type, size, material) : undefined
          });
          
          // Update pipe by type and size
          result.pipeByType[type] = (result.pipeByType[type] || 0) + length;
          result.pipeBySize[size] = (result.pipeBySize[size] || 0) + length;
        }
      }
    }
    
    // Parse fixtures - look for fixture tables or lists in the response
    const fixturePattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*\|/g;
    let fixtureId = 1;
    
    while ((match = fixturePattern.exec(claudeResponse)) !== null) {
      // Skip table headers and if it looks like pipe data
      if (/Type|Fixture|Description|Quantity/i.test(match[1]) || /^\d+(?:\.\d+)?$/.test(match[3])) {
        continue;
      }
      
      const type = match[1].trim();
      const description = match[2].trim();
      const quantity = parseInt(match[3]);
      
      // Extract connection information from description or context
      const connections = {};
      
      // Look for connection patterns in nearby text
      const connectionContext = claudeResponse.substring(
        Math.max(0, claudeResponse.indexOf(type) - 200),
        Math.min(claudeResponse.length, claudeResponse.indexOf(type) + 200)
      );
      
      // Extract connection sizes from context
      if (/waste.*?(\d+")/i.test(connectionContext)) {
        connections.waste = connectionContext.match(/waste.*?(\d+(?:-\d+\/\d+)?")|\d+(?:-\d+\/\d+)?".*?waste/i)?.[1];
      }
      
      if (/vent.*?(\d+")/i.test(connectionContext)) {
        connections.vent = connectionContext.match(/vent.*?(\d+(?:-\d+\/\d+)?")|\d+(?:-\d+\/\d+)?".*?vent/i)?.[1];
      }
      
      if (/cold.*?(\d+")|CW.*?(\d+")/i.test(connectionContext)) {
        connections.coldWater = connectionContext.match(/cold.*?(\d+(?:-\d+\/\d+)?")|\d+(?:-\d+\/\d+)?".*?cold|CW.*?(\d+(?:-\d+\/\d+)?")|\d+(?:-\d+\/\d+)?".*?CW/i)?.[1];
      }
      
      if (/hot.*?(\d+")|HW.*?(\d+")/i.test(connectionContext)) {
        connections.hotWater = connectionContext.match(/hot.*?(\d+(?:-\d+\/\d+)?")|\d+(?:-\d+\/\d+)?".*?hot|HW.*?(\d+(?:-\d+\/\d+)?")|\d+(?:-\d+\/\d+)?".*?HW/i)?.[1];
      }
      
      // Add fixture to the fixtures array
      result.fixtures.push({
        id: String(fixtureId++),
        type,
        description,
        quantity,
        connections,
        unitPrice: analysisType !== 'materials' ? getFixtureUnitPrice(type) : undefined,
        totalPrice: analysisType !== 'materials' ? quantity * getFixtureUnitPrice(type) : undefined
      });
    }
    
    // If no fixtures found in tables, try parsing from text blocks
    if (result.fixtures.length === 0) {
      const fixtureTextPattern = /(\d+)\s+([A-Za-z\s]+(?:closet|sink|drain|interceptor|fountain|bibb|lavatory|urinal)s?)/gi;
      
      while ((match = fixtureTextPattern.exec(claudeResponse)) !== null) {
        const quantity = parseInt(match[1]);
        const type = match[2].trim();
        
        // Create a standardized fixture type
        let standardType = type;
        if (/water\s*closet|wc/i.test(type)) standardType = 'Water Closet (WC)';
        else if (/lavatory|lav/i.test(type)) standardType = 'Lavatory (LAV)';
        else if (/floor\s*drain|fld/i.test(type)) standardType = 'Floor Drain (FLD)';
        else if (/floor\s*sink|fls/i.test(type)) standardType = 'Floor Sink (FLS)';
        else if (/roof\s*drain|rd/i.test(type)) standardType = 'Roof Drain (RD)';
        else if (/urinal|ur/i.test(type)) standardType = 'Urinal (UR)';
        
        // Only add if not already included
        if (!result.fixtures.some(f => f.type === standardType)) {
          result.fixtures.push({
            id: String(fixtureId++),
            type: standardType,
            description: type,
            quantity,
            connections: {},
            unitPrice: analysisType !== 'materials' ? getFixtureUnitPrice(standardType) : undefined,
            totalPrice: analysisType !== 'materials' ? quantity * getFixtureUnitPrice(standardType) : undefined
          });
        }
      }
    }
    
    // Parse valves and specialties - look for valve tables or lists in the response
    const valvePattern = /\|\s*([^|]+valve|cleanout|trap|backflow|cock|specialty)\s*\|\s*([^|]*)\s*\|\s*(\d+)\s*\|/gi;
    let valveId = 1;
    
    while ((match = valvePattern.exec(claudeResponse)) !== null) {
      // Skip table headers
      if (/Type|Valve|Description|Quantity/i.test(match[1])) {
        continue;
      }
      
      const type = match[1].trim();
      const size = match[2].trim() || 'Various';
      const quantity = parseInt(match[3]);
      
      // Add valve to the valves and specialties array
      result.valvesAndSpecialties.push({
        id: String(valveId++),
        type,
        size,
        quantity,
        unitPrice: analysisType !== 'materials' ? getValveUnitPrice(type) : undefined,
        totalPrice: analysisType !== 'materials' ? quantity * getValveUnitPrice(type) : undefined
      });
    }
    
    // If no valves found in tables, try parsing from text blocks
    if (result.valvesAndSpecialties.length === 0) {
      const valveTextPattern = /(\d+)\s+([A-Za-z\s]+(?:valve|cleanout|trap|backflow|cock|specialty)s?)/gi;
      
      while ((match = valveTextPattern.exec(claudeResponse)) !== null) {
        const quantity = parseInt(match[1]);
        const type = match[2].trim();
        
        // Create a standardized valve type
        let standardType = type;
        if (/gate|ball/i.test(type)) standardType = 'Gate/Ball Valve';
        else if (/check/i.test(type)) standardType = 'Check Valve';
        else if (/gas\s*cock/i.test(type)) standardType = 'Gas Cock';
        else if (/balancing/i.test(type)) standardType = 'Balancing Valve';
        else if (/os&y/i.test(type)) standardType = 'OS&Y Valve';
        else if (/backflow/i.test(type)) standardType = 'Backflow Preventer';
        else if (/pressure\s*reducing/i.test(type)) standardType = 'Pressure Reducing Valve';
        else if (/cleanout/i.test(type)) standardType = 'Cleanout';
        else if (/tempering/i.test(type)) standardType = 'Tempering Valve';
        else if (/p-trap/i.test(type)) standardType = 'P-Trap with Insulation';
        
        // Only add if not already included
        if (!result.valvesAndSpecialties.some(v => v.type === standardType)) {
          result.valvesAndSpecialties.push({
            id: String(valveId++),
            type: standardType,
            size: 'Various',
            quantity,
            unitPrice: analysisType !== 'materials' ? getValveUnitPrice(standardType) : undefined,
            totalPrice: analysisType !== 'materials' ? quantity * getValveUnitPrice(standardType) : undefined
          });
        }
      }
    }
    
    // Parse installation notes if this is a full analysis
    if (analysisType === 'full') {
      // Look for notes section
      const notesSection = claudeResponse.match(/(?:Installation\s+Notes|Notes|Important\s+Considerations)[\s\S]*?(?=\n\s*#|$)/i);
      
      if (notesSection) {
        const notesText = notesSection[0];
        
        // Look for bulleted notes
        const bulletPattern = /[-•*]\s*([^-•*\n]+)/g;
        
        while ((match = bulletPattern.exec(notesText)) !== null) {
          const noteText = match[1].trim();
          
          // Skip empty notes or headers
          if (noteText && !noteText.match(/^Notes|^Installation|^Important/i)) {
            // Determine priority based on content
            let priority = 'medium';
            
            if (/critical|required|must|code|safety|emergency|danger|warning/i.test(noteText)) {
              priority = 'high';
            } else if (/consider|option|suggestion|recommend|may|might/i.test(noteText)) {
              priority = 'low';
            }
            
            result.notes.push({
              text: noteText,
              priority
            });
          }
        }
        
        // If no bulleted notes found, try extracting sentences
        if (result.notes.length === 0) {
          const sentences = notesText.split(/(?<=[.!?])\s+/);
          
          sentences.forEach(sentence => {
            const noteText = sentence.trim();
            
            // Skip short or header-like sentences
            if (noteText.length > 15 && !noteText.match(/^Notes|^Installation|^Important/i)) {
              // Determine priority (same logic as above)
              let priority = 'medium';
              
              if (/critical|required|must|code|safety|emergency|danger|warning/i.test(noteText)) {
                priority = 'high';
              } else if (/consider|option|suggestion|recommend|may|might/i.test(noteText)) {
                priority = 'low';
              }
              
              result.notes.push({
                text: noteText,
                priority
              });
            }
          });
        }
      }
      
      // Extract labor hours if mentioned
      const laborMatch = claudeResponse.match(/(?:Total\s+)?Labor\s+Hours:?\s*(\d+(?:\.\d+)?)/i);
      if (laborMatch) {
        result.laborHours = parseInt(laborMatch[1]);
      } else {
        // Default labor calculation if not provided (1 hour per $500 of materials)
        const materialCost = result.pipeSections.reduce((sum, p) => sum + (p.totalPrice || 0), 0) +
                           result.fixtures.reduce((sum, f) => sum + (f.totalPrice || 0), 0) +
                           result.valvesAndSpecialties.reduce((sum, v) => sum + (v.totalPrice || 0), 0);
        result.laborHours = Math.round(materialCost / 500);
      }
    }
    
    return result;
  } catch (error) {
    logger.error('Error parsing Claude response:', error);
    throw new Error(`Failed to parse Claude response: ${error.message}`);
  }
}

/**
 * Get pipe unit price based on type, size and material
 * @param {String} type - Pipe type code
 * @param {String} size - Pipe size
 * @param {String} material - Pipe material
 * @returns {Number} - Unit price per linear foot
 */
/**
 * Get fixture unit price based on fixture type
 * @param {String} fixtureType - Type of fixture
 * @returns {Number} - Unit price per fixture
 */
function getFixtureUnitPrice(fixtureType) {
  // Base prices by fixture type
  const fixturePrices = {
    // Toilets
    'Water Closet (WC)': 550.00,
    'Water Closet': 550.00,
    'WC': 550.00,
    'Toilet': 550.00,
    
    // Sinks
    'Lavatory (LAV)': 325.00,
    'Lavatory': 325.00,
    'LAV': 325.00,
    'Sink': 295.00,
    'Kitchen Sink': 450.00,
    'Service Sink': 575.00,
    'Mop Sink': 575.00,
    'Hand Sink': 325.00,
    
    // Drains
    'Floor Drain (FD)': 185.00,
    'Floor Drain': 185.00,
    'FD': 185.00,
    'Floor Sink (FS)': 225.00,
    'Floor Sink': 225.00,
    'FS': 225.00,
    'Roof Drain (RD)': 495.00,
    'Roof Drain': 495.00,
    'RD': 495.00,
    'Area Drain (AD)': 285.00,
    'Area Drain': 285.00,
    'AD': 285.00,
    'Trench Drain': 825.00,
    
    // Bathing Fixtures
    'Shower': 625.00,
    'Bath Tub': 775.00,
    'Tub/Shower Combo': 950.00,
    
    // Appliances
    'Dishwasher': 125.00, // Connection only, not appliance
    'Washing Machine': 145.00, // Connection only, not appliance
    'Ice Maker': 85.00, // Connection only
    
    // Drinking
    'Drinking Fountain': 950.00,
    'Water Cooler': 1250.00,
    'Bottle Filler': 1450.00,
    
    // Urinals
    'Urinal (UR)': 675.00,
    'Urinal': 675.00,
    'UR': 675.00,
    
    // Specialty
    'Grease Interceptor': 2750.00,
    'Oil Interceptor': 2250.00,
    'Mixing Valve': 750.00,
    'Emergency Shower': 1250.00,
    'Emergency Eyewash': 950.00,
    'Backflow Preventer': 950.00
  };
  
  // Normalize fixture type - convert to title case
  const normalizedType = fixtureType.trim();
  
  // Try to get exact match
  if (fixturePrices[normalizedType]) {
    return fixturePrices[normalizedType];
  }
  
  // If exact match not found, try to find partial match
  for (const [key, price] of Object.entries(fixturePrices)) {
    if (normalizedType.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(normalizedType.toLowerCase())) {
      return price;
    }
  }
  
  // Default price if no match found
  return 350.00;
}

/**
 * Get valve or specialty item unit price based on type
 * @param {String} valveType - Type of valve or specialty item
 * @returns {Number} - Unit price per item
 */
function getValveUnitPrice(valveType) {
  // Base prices by valve/specialty type
  const valvePrices = {
    // General Valves
    'Gate Valve': 125.00,
    'Ball Valve': 115.00,
    'Gate/Ball Valve': 120.00,
    'Check Valve': 145.00,
    'Control Valve': 250.00,
    'Butterfly Valve': 185.00,
    'Globe Valve': 155.00,
    'Angle Valve': 165.00,
    'Shutoff Valve': 110.00,
    'Balancing Valve': 275.00,
    'Pressure Reducing Valve': 325.00,
    'Pressure Relief Valve': 295.00,
    'OS&Y Valve': 475.00,
    'Solenoid Valve': 225.00,
    'Zone Valve': 205.00,
    'Thermostatic Mixing Valve': 375.00,
    'Temperature Control Valve': 375.00,
    'Tempering Valve': 345.00,
    
    // Gas-specific
    'Gas Cock': 135.00,
    'Gas Valve': 145.00,
    'Earthquake Valve': 685.00,
    
    // Specialty Items
    'Cleanout': 85.00,
    'P-Trap': 45.00,
    'P-Trap with Insulation': 65.00,
    'Floor Cleanout': 95.00,
    'Wall Cleanout': 105.00,
    'Backflow Preventer': 950.00,
    'Vacuum Breaker': 165.00,
    'Air Gap': 125.00,
    'Shock Absorber': 85.00,
    'Water Hammer Arrestor': 85.00,
    'Expansion Tank': 225.00,
    'Air Chamber': 65.00,
    'Trap Primer': 175.00,
    'Flow Switch': 215.00,
    'Hose Bibb': 65.00,
    'Wall Hydrant': 175.00,
    'Access Panel': 95.00
  };
  
  // Normalize valve type - convert to title case
  const normalizedType = valveType.trim();
  
  // Try to get exact match
  if (valvePrices[normalizedType]) {
    return valvePrices[normalizedType];
  }
  
  // If exact match not found, try to find partial match
  for (const [key, price] of Object.entries(valvePrices)) {
    if (normalizedType.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(normalizedType.toLowerCase())) {
      return price;
    }
  }
  
  // Default price if no match found
  return 150.00;
}

/**
 * Get pipe unit price based on type, size and material
 * @param {String} type - Pipe type code
 * @param {String} size - Pipe size
 * @param {String} material - Pipe material
 * @returns {Number} - Unit price per linear foot
 */
function getPipeUnitPrice(type, size, material) {
  // Base prices by material and size
  const basePrices = {
    'PVC': {
      '1/2"': 2.95,
      '3/4"': 3.25,
      '1"': 3.75,
      '1-1/4"': 4.25,
      '1-1/2"': 4.75,
      '2"': 5.25,
      '3"': 6.50,
      '4"': 8.25,
      '6"': 15.50
    },
    'Copper': {
      '1/2"': 7.65,
      '3/4"': 9.85,
      '1"': 12.35,
      '1-1/4"': 14.85,
      '1-1/2"': 17.35,
      '2"': 23.50,
      '3"': 42.75,
      '4"': 68.50
    },
    'Carbon Steel': {
      '1/2"': 8.75,
      '3/4"': 10.25,
      '1"': 12.50,
      '1-1/4"': 14.75,
      '1-1/2"': 16.95,
      '2"': 21.75,
      '3"': 36.25,
      '4"': 54.50
    }
  };
  
  // Try to get price for exact size
  if (basePrices[material] && basePrices[material][size]) {
    return basePrices[material][size];
  }
  
  // If size not found, try to find closest size
  const sizeNum = parseFloat(size);
  if (!isNaN(sizeNum) && basePrices[material]) {
    const sizes = Object.keys(basePrices[material])
                       .map(s => parseFloat(s))
                       .filter(s => !isNaN(s))
                       .sort((a, b) => a - b);
    
    // Find closest size
    let closestSize = null;
    let minDiff = Infinity;
    
    for (const s of sizes) {
      const diff = Math.abs(s - sizeNum);
      if (diff < minDiff) {
        minDiff = diff;
        closestSize = s;
      }
    }
    
    if (closestSize !== null) {
      const closestSizeStr = closestSize.toString() + '"';
      return basePrices[material][closestSizeStr];
    }
  }
  
  // Default fallback prices by pipe type
  const fallbackPrices = {
    'SP': 6.50,  // Soil/Waste Pipe
    'GW': 6.50,  // Grease Waste
    'ST': 8.25,  // Storm Drain
    'VP': 4.75,  // Vent Pipe
    'CW': 9.85,  // Cold Water
    'HW': 12.35, // Hot Water
    'HWC': 14.85, // Hot Water Circulation
    'G': 12.50,  // Gas
    'FP': 36.25  // Fire Protection
  };
  
  return fallbackPrices[type] || 10.00; // Default price if all else fails
}

/**
 * Calculate estimated labor hours for plumbing installation
 * @param {Object} analysis - Plumbing analysis results
 * @returns {Number} - Estimated labor hours
 */
function calculateLaborHours(analysis) {
  let totalHours = 0;
  
  // Base labor rates (hours per unit)
  const pipeLaborRates = {
    'PVC': 0.25,    // Hours per linear foot
    'Copper': 0.35,  // Hours per linear foot
    'Carbon Steel': 0.45,  // Hours per linear foot
    'Cast Iron': 0.50  // Hours per linear foot
  };
  
  const fixtureLaborRates = {
    'Water Closet': 3.0,
    'Urinal': 3.0,
    'Lavatory': 2.5,
    'Sink': 2.0,
    'Floor Drain': 1.5,
    'Roof Drain': 2.5,
    'Shower': 4.0, 
    'Tub': 4.5,
    'Drinking Fountain': 3.0,
    'Grease Interceptor': 8.0
  };
  
  const valveLaborRates = {
    'standard': 0.5,  // Hours per valve for standard valves
    'complex': 1.5    // Hours per valve for complex valves/specialties
  };
  
  // Calculate pipe labor
  for (const pipe of analysis.pipeSections) {
    const laborRate = pipeLaborRates[pipe.material] || 0.3;
    let sizeMultiplier = 1.0;
    
    // Adjust labor based on pipe size
    const sizeInInches = parseFloat(pipe.size);
    if (!isNaN(sizeInInches)) {
      if (sizeInInches <= 1) sizeMultiplier = 0.8;
      else if (sizeInInches <= 2) sizeMultiplier = 1.0;
      else if (sizeInInches <= 4) sizeMultiplier = 1.2;
      else sizeMultiplier = 1.5;
    }
    
    totalHours += pipe.length * laborRate * sizeMultiplier;
  }
  
  // Calculate fixture labor
  for (const fixture of analysis.fixtures) {
    let laborHours = 2.0; // Default labor hours per fixture
    
    // Try to find a match in labor rates
    for (const [fixtureType, hours] of Object.entries(fixtureLaborRates)) {
      if (fixture.type.toLowerCase().includes(fixtureType.toLowerCase())) {
        laborHours = hours;
        break;
      }
    }
    
    totalHours += laborHours * fixture.quantity;
  }
  
  // Calculate valve/specialty labor
  for (const valve of analysis.valvesAndSpecialties) {
    let laborRate = valveLaborRates.standard;
    
    // Determine if valve is complex
    if (/backflow|tempering|mixing|pressure|regulate|control/i.test(valve.type)) {
      laborRate = valveLaborRates.complex;
    }
    
    totalHours += laborRate * valve.quantity;
  }
  
  // Add additional time for testing and coordination
  totalHours *= 1.15; // 15% overhead for testing, cleanup, coordination
  
  return Math.round(totalHours);
}

/**
 * Generate a plumbing materials summary report
 * @param {Object} analysisResults - Structured plumbing analysis results
 * @returns {String} - Formatted summary report
 */
function generatePlumbingSummaryReport(analysisResults) {
  const { pipeSections, fixtures, valvesAndSpecialties, notes, pipeByType, pipeBySize, laborHours, metadata } = analysisResults;
  
  // Calculate totals
  const totalPipeLength = Object.values(pipeByType).reduce((sum, length) => sum + length, 0);
  const totalFixtures = fixtures.reduce((sum, fixture) => sum + fixture.quantity, 0);
  const totalValves = valvesAndSpecialties.reduce((sum, valve) => sum + valve.quantity, 0);
  
  let totalMaterialCost = 0;
  if (metadata.analysisType !== 'materials') {
    totalMaterialCost = 
      pipeSections.reduce((sum, pipe) => sum + (pipe.totalPrice || 0), 0) +
      fixtures.reduce((sum, fixture) => sum + (fixture.totalPrice || 0), 0) +
      valvesAndSpecialties.reduce((sum, valve) => sum + (valve.totalPrice || 0), 0);
  }
  
  // Format the report
  let report = `# Plumbing Materials Summary Report\n\n`;
  report += `**Analysis Type:** ${metadata.analysisType}\n`;
  report += `**Date:** ${new Date(metadata.timestamp).toLocaleDateString()}\n`;
  report += `**Blueprint Count:** ${metadata.blueprintCount}\n`;
  if (metadata.projectScale) {
    report += `**Project Scale:** ${metadata.projectScale}\n`;
  }
  
  report += `\n## Overview\n\n`;
  report += `- Total Pipe Length: ${totalPipeLength.toFixed(2)} linear feet\n`;
  report += `- Total Fixtures: ${totalFixtures}\n`;
  report += `- Total Valves & Specialties: ${totalValves}\n`;
  
  if (metadata.analysisType !== 'materials') {
    report += `- Total Material Cost: ${totalMaterialCost.toFixed(2)}\n`;
    
    if (laborHours) {
      const laborRate = 85.00; // Default hourly labor rate
      const laborCost = laborHours * laborRate;
      report += `- Estimated Labor Hours: ${laborHours}\n`;
      report += `- Estimated Labor Cost: ${laborCost.toFixed(2)}\n`;
      report += `- Total Project Cost: ${(totalMaterialCost + laborCost).toFixed(2)}\n`;
    }
  }
  
  report += `\n## Pipe Summary\n\n`;
  
  report += `### By Type\n\n`;
  for (const [type, length] of Object.entries(pipeByType)) {
    report += `- ${type}: ${length.toFixed(2)} linear feet\n`;
  }
  
  report += `\n### By Size\n\n`;
  for (const [size, length] of Object.entries(pipeBySize)) {
    report += `- ${size}: ${length.toFixed(2)} linear feet\n`;
  }
  
  report += `\n## Fixture Summary\n\n`;
  if (fixtures.length > 0) {
    // Group fixtures by type
    const fixturesByType = {};
    fixtures.forEach(fixture => {
      if (!fixturesByType[fixture.type]) {
        fixturesByType[fixture.type] = 0;
      }
      fixturesByType[fixture.type] += fixture.quantity;
    });
    
    for (const [type, quantity] of Object.entries(fixturesByType)) {
      report += `- ${type}: ${quantity}\n`;
    }
  } else {
    report += `No fixtures found in analysis.\n`;
  }
  
  report += `\n## Valves & Specialties Summary\n\n`;
  if (valvesAndSpecialties.length > 0) {
    // Group valves by type
    const valvesByType = {};
    valvesAndSpecialties.forEach(valve => {
      if (!valvesByType[valve.type]) {
        valvesByType[valve.type] = 0;
      }
      valvesByType[valve.type] += valve.quantity;
    });
    
    for (const [type, quantity] of Object.entries(valvesByType)) {
      report += `- ${type}: ${quantity}\n`;
    }
  } else {
    report += `No valves or specialties found in analysis.\n`;
  }
  
  if (metadata.analysisType === 'full' && notes.length > 0) {
    report += `\n## Installation Notes\n\n`;
    
    // Group notes by priority
    const highPriorityNotes = notes.filter(note => note.priority === 'high');
    const mediumPriorityNotes = notes.filter(note => note.priority === 'medium');
    const lowPriorityNotes = notes.filter(note => note.priority === 'low');
    
    if (highPriorityNotes.length > 0) {
      report += `### Critical Considerations\n\n`;
      highPriorityNotes.forEach(note => {
        report += `- ${note.text}\n`;
      });
      report += `\n`;
    }
    
    if (mediumPriorityNotes.length > 0) {
      report += `### Important Notes\n\n`;
      mediumPriorityNotes.forEach(note => {
        report += `- ${note.text}\n`;
      });
      report += `\n`;
    }
    
    if (lowPriorityNotes.length > 0) {
      report += `### Recommendations\n\n`;
      lowPriorityNotes.forEach(note => {
        report += `- ${note.text}\n`;
      });
    }
  }
  
  return report;
}

// Export the module functions
module.exports = {
  analyzePlumbingBlueprints,
  generatePlumbingSummaryReport,
  calculateLaborHours
};
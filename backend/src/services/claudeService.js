/**
 * @file claudeService.js
 * Enhanced service for Claude AI blueprint analysis
 * Provides structured data extraction and standardized response handling
 */
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // For image processing

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Claude model to use (can be overridden by environment variable)
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219';

// Maximum tokens for response
const MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '8000', 10);

// Cache for recent analysis (simple in-memory cache)
const analysisCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Analyzes blueprint images using Claude
 * @param {Array} files - Array of file objects with buffer, originalname, and type properties
 * @param {Object} options - Analysis options (trade, analysisLevel, etc)
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeBlueprintsWithClaude(files, options) {
  try {
    // Extract options with defaults
    const { 
      trade, 
      analysisLevel = 'takeoff', 
      projectType = '',
      clientId = '',
      projectId = '',
      retryCount = 0,
      maxRetries = 2
    } = options;
    
    // Validate essential inputs
    if (!files || !files.length) {
      throw new Error('No files provided for analysis');
    }
    
    if (!trade) {
      throw new Error('Trade type must be specified');
    }

    // Generate cache key
    const cacheKey = generateCacheKey(files, options);
    
    // Check cache for recent identical analysis
    if (analysisCache.has(cacheKey)) {
      console.log('Using cached analysis result');
      return analysisCache.get(cacheKey).result;
    }
    
    // Preprocess images for better analysis
    const processedFiles = await preprocessImages(files);
    
    // Prepare file content as base64
    const fileContents = processedFiles.map(file => {
      const base64Content = file.buffer.toString('base64');
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: determineMediaType(file.originalname),
          data: base64Content
        }
      };
    });
    
    // Create JSON schema for Claude's response format
    const responseSchema = createResponseSchema(analysisLevel);
    
    // Craft the prompt based on the analysis level and trade
    const systemPrompt = craftSystemPrompt(trade, analysisLevel, projectType, responseSchema);
    
    // Create messages for Claude
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: systemPrompt
          },
          ...fileContents
        ]
      }
    ];
    
    // Configure Claude API parameters
    const claudeParams = {
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: messages,
      system: "You are Uncle Jerry, a friendly and experienced contractor who has been in the construction business for over 40 years. You're analyzing blueprint sections to provide material takeoffs and cost estimates. Be helpful, practical, and use conversational language with occasional construction lingo. Focus on accuracy in your material counts and cost estimates. Always format your response as structured JSON for easy processing. Use the JSON schema provided.",
      temperature: 0.1, // Lower temperature for more predictable outputs
    };

    // Call Claude API with timeout and retry handling
    let response;
    try {
      response = await Promise.race([
        anthropic.messages.create(claudeParams),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Claude API timeout')), 60000)
        )
      ]);
    } catch (apiError) {
      console.error('Error calling Claude API:', apiError.message);
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        console.log(`Retrying analysis (${retryCount + 1}/${maxRetries})...`);
        // Recursively retry with incremented retry count
        return analyzeBlueprintsWithClaude(files, {
          ...options,
          retryCount: retryCount + 1
        });
      }
      
      throw new Error(`Failed to analyze blueprint with Claude after ${maxRetries} attempts: ${apiError.message}`);
    }
    
    // Process and structure the response
    const processedResponse = processClaudeResponse(response.content, analysisLevel);
    
    // Cache the result with TTL
    analysisCache.set(cacheKey, {
      result: processedResponse,
      timestamp: Date.now()
    });
    
    // Clean expired cache entries
    cleanupCache();
    
    return processedResponse;
    
  } catch (error) {
    console.error('Error with Claude API:', error);
    throw new Error(`Failed to analyze blueprint with Claude: ${error.message}`);
  }
}

/**
 * Preprocesses images to optimize for Claude analysis
 * @param {Array} files - Array of file objects
 * @returns {Promise<Array>} - Processed file objects
 */
async function preprocessImages(files) {
  return Promise.all(files.map(async (file) => {
    // Skip non-image files or PDF
    if (!file.buffer || !file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return file;
    }
    
    try {
      // Process image with sharp
      const processedBuffer = await sharp(file.buffer)
        .resize({
          width: 1500,           // Resize to reasonable dimensions
          height: 1500,
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .sharpen()              // Enhance details
        .normalise()            // Normalize brightness and contrast
        .toBuffer();
      
      return {
        ...file,
        buffer: processedBuffer
      };
    } catch (err) {
      console.warn(`Image preprocessing failed for ${file.originalname}:`, err.message);
      return file; // Fall back to original file on error
    }
  }));
}

/**
 * Determines the media type based on file extension
 * @param {string} filename - Original filename
 * @returns {string} Media type
 */
function determineMediaType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  switch(ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.pdf':
      return 'application/pdf';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.tiff':
    case '.tif':
      return 'image/tiff';
    case '.bmp':
      return 'image/bmp';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

/**
 * Creates JSON schema for Claude's response
 * @param {string} analysisLevel - Level of analysis
 * @returns {Object} Schema object
 */
function createResponseSchema(analysisLevel) {
  // Base schema with materials array
  const baseSchema = {
    type: 'object',
    properties: {
      materials: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
          },
          required: ['name', 'quantity', 'unit']
        }
      },
      notes: { type: 'string' }
    },
    required: ['materials']
  };

  // Add additional properties based on analysis level
  if (analysisLevel === 'costEstimate' || analysisLevel === 'fullEstimate') {
    // Add cost property to materials
    baseSchema.properties.materials.items.properties.cost = { type: 'number' };
    // Add total material cost
    baseSchema.properties.totalMaterialCost = { type: 'number' };
    baseSchema.required.push('totalMaterialCost');
  }

  // Add labor properties for full estimate
  if (analysisLevel === 'fullEstimate') {
    baseSchema.properties.labor = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          task: { type: 'string' },
          hours: { type: 'number' },
          rate: { type: 'number' },
          cost: { type: 'number' }
        },
        required: ['task', 'hours']
      }
    };
    baseSchema.properties.totalLaborCost = { type: 'number' };
    baseSchema.properties.totalCost = { type: 'number' };
    baseSchema.required.push('labor', 'totalLaborCost', 'totalCost');
  }

  return baseSchema;
}

/**
 * Crafts a system prompt based on trade and analysis level
 * @param {string} trade - Type of trade (electrical, plumbing, etc)
 * @param {string} analysisLevel - Level of analysis (takeoff, costEstimate, fullEstimate)
 * @param {string} projectType - Type of project (optional)
 * @param {Object} responseSchema - JSON schema for response format
 * @returns {string} System prompt
 */
function craftSystemPrompt(trade, analysisLevel, projectType, responseSchema) {
  // Base prompt
  let prompt = `Analyze these ${trade} blueprint sections`;
  
  if (projectType) {
    prompt += ` for a ${projectType} project`;
  }
  
  // Add trade-specific instructions
  prompt += addTradeSpecificInstructions(trade);
  
  // Add analysis level instructions
  prompt += addAnalysisLevelInstructions(analysisLevel);
  
  // Add schema requirements
  prompt += `\n\nYour response MUST follow this JSON schema: ${JSON.stringify(responseSchema, null, 2)}`;
  
  // Add scale detection instruction
  prompt += `\n\nLook for scale information in the blueprint (e.g., "1/4" = 1'-0"" or "Scale: 1:100") to ensure accurate measurements. If no scale is visible, use standard dimensions for a typical construction project.`;
  
  // Add notes request
  prompt += `\n\nAlso include a 'notes' field with any special considerations, assumptions, or limitations of your analysis.`;
  
  return prompt;
}

/**
 * Adds trade-specific instructions to the prompt
 * @param {string} trade - Type of trade
 * @returns {string} Trade-specific instructions
 */
function addTradeSpecificInstructions(trade) {
  switch(trade) {
    case 'electrical':
      return `\n\nFor electrical work, please:
- Identify panel types, ratings, and locations
- List circuit counts and types (15A, 20A, etc.)
- Count outlet types (standard, GFCI, weatherproof) and locations
- Identify lighting fixtures by type, wattage, and mounting style
- Locate switches, dimmers, and control systems
- Identify special equipment (motors, HVAC connections, etc.)
- Calculate approximate wire lengths by type and gauge
- Note voltage requirements (120V, 240V, 277V, etc.)
- Identify conduit types and sizes where shown`;
    
    case 'plumbing':
      return `\n\nFor plumbing work, please:
- Identify all plumbing fixtures (sinks, toilets, tubs, etc.)
- List pipe types (PVC, copper, PEX, etc.) and sizes
- Calculate approximate pipe lengths for supply and drainage
- Count and specify fittings (elbows, tees, couplings)
- Identify valves by type and size
- Note special components (backflow preventers, pressure regulators)
- Identify water heater specifications if shown
- Note venting requirements
- List any specialty items (water filters, softeners, pumps)`;
    
    case 'carpentry':
      return `\n\nFor carpentry work, please:
- Identify stud sizes (2x4, 2x6, etc.) and material (wood, metal)
- Note stud spacing (16" O.C., 24" O.C., etc.)
- Calculate linear feet for top and bottom plates
- Identify header requirements above openings
- List sheathing types and quantities
- Calculate board feet for framing lumber
- Note special framing details or blocking requirements
- Identify insulation types and R-values
- Calculate square footage for wall, floor, and/or roof framing`;
    
    case 'hvac':
      return `\n\nFor HVAC/mechanical work, please:
- Identify duct sizes and types (rectangular, round, flexible)
- Calculate linear feet of ductwork by size
- Count registers, grilles, and diffusers by type and size
- Identify equipment specifications (furnaces, AC units, fans)
- List control components (thermostats, dampers, etc.)
- Note insulation requirements for ductwork
- Identify ventilation components
- Calculate CFM requirements based on room sizes
- List specialty items (humidifiers, air purifiers, etc.)`;
    
    case 'drywall':
      return `\n\nFor drywall work, please:
- Calculate square footage of drywall needed by type/thickness
- Identify board thickness (1/2", 5/8") and types (standard, fire-rated, water-resistant)
- Estimate joint compound requirements
- Calculate linear feet of corner bead, J-bead, and trim
- List fastener quantities (screws, nails)
- Note special details (curved walls, soffits, etc.)
- Identify acoustic treatments or special installations
- Estimate taping materials needed
- Calculate primer and finish requirements`;
    
    case 'flooring':
      return `\n\nFor flooring work, please:
- Calculate square footage by flooring type and room
- Identify flooring materials (hardwood, tile, carpet, etc.)
- List underlayment requirements
- Identify transition strips and locations
- Note special details (borders, patterns, inlays)
- Calculate materials for floor preparation
- Identify moisture barriers or vapor retarders
- List adhesives, grouts, or fasteners needed
- Calculate molding and trim requirements`;
    
    case 'roofing':
      return `\n\nFor roofing work, please:
- Calculate roof area by slope and section
- Identify roofing materials (asphalt shingles, metal, tile, etc.)
- List underlayment and ice/water shield requirements
- Calculate flashing needs for valleys, chimneys, and projections
- Identify ventilation components (ridge vents, soffit vents)
- Note drainage details (gutters, downspouts)
- List fasteners and adhesives
- Calculate ridge, hip, and valley linear footage
- Identify special details (skylights, penetrations, etc.)`;
    
    case 'sheathing':
      return `\n\nFor sheathing work, please:
- Calculate wall and roof sheathing square footage by type
- Identify sheathing materials (plywood, OSB, gypsum, etc.)
- List thickness and grade requirements
- Calculate linear feet of bracing or blocking
- Identify fastener patterns and quantities
- Note special details for corners and openings
- List weather barrier requirements (house wrap, felt)
- Identify flashing needs around openings
- Note structural considerations and areas requiring reinforcement`;
    
    case 'acoustics':
      return `\n\nFor acoustical work, please:
- Calculate ceiling grid system by square footage and type
- Identify acoustic panel types and quantities
- List suspension system components
- Calculate wall panel square footage
- Identify acoustic treatment materials and locations
- Note special isolation or sound barrier details
- List specialty hardware and mounting systems
- Identify lighting integration requirements
- Note NRC (Noise Reduction Coefficient) values where applicable`;
    
    default:
      return `\n\nPlease provide a comprehensive analysis that includes:
- All key components visible in the blueprint
- Quantities with appropriate units of measure
- Material specifications and types
- Dimensions and measurements using the provided scale
- Any special requirements or considerations`;
  }
}

/**
 * Adds analysis level instructions to the prompt
 * @param {string} analysisLevel - Level of analysis
 * @returns {string} Analysis level instructions
 */
function addAnalysisLevelInstructions(analysisLevel) {
  switch(analysisLevel) {
    case 'takeoff':
      return `\n\nProvide a detailed material takeoff only, listing all required materials with quantities and units. Include specific details like sizes, types, and specifications for each item. Group similar items together and provide subtotals where appropriate.`;
    
    case 'costEstimate':
      return `\n\nProvide a detailed material takeoff with cost estimates. Include all required materials with quantities, units, and approximate costs based on current national averages. Provide both unit costs and extended costs (quantity × unit cost). Include a totalMaterialCost value that sums all material costs.`;
    
    case 'fullEstimate':
      return `\n\nProvide a complete project estimate including:
1. Materials: All required materials with quantities, units, and current cost estimates
2. Labor: Detailed labor estimates with hours and hourly rates by task or trade
3. Equipment: Any special equipment required with rental rates
4. Permit fees and inspection costs if applicable
5. Overhead and profit calculations for a complete bid package

Include totalMaterialCost, totalLaborCost, and totalCost values that accurately sum all components.`;
    
    default:
      return `\n\nProvide a detailed material list with quantities and specifications.`;
  }
}

/**
 * Generates a cache key for a specific analysis request
 * @param {Array} files - Array of file objects
 * @param {Object} options - Analysis options
 * @returns {string} Cache key
 */
function generateCacheKey(files, options) {
  const { trade, analysisLevel, projectType } = options;
  
  // Create a hash of file contents
  const fileHash = files.map(file => {
    // Use first 100 bytes of each file as a fingerprint
    const sample = file.buffer.slice(0, 100).toString('base64');
    return `${file.originalname}-${sample}-${file.buffer.length}`;
  }).join('|');
  
  return `${trade}-${analysisLevel}-${projectType}-${fileHash}`;
}

/**
 * Cleans up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of analysisCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
    }
  }
}

/**
 * Processes and structures Claude's response
 * @param {Array} content - Claude response content
 * @param {string} analysisLevel - Level of analysis
 * @returns {Object} Structured analysis results
 */
function processClaudeResponse(content, analysisLevel) {
  try {
    // Extract the text from Claude's response
    const responseText = content[0].text;
    
    // Store raw response for debugging and development
    const result = {
      rawResponse: responseText
    };
    
    // Try to find and parse JSON in the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                      responseText.match(/{[\s\S]*}/);
    
    let parsedResults;
    
    if (jsonMatch) {
      // Extract just the JSON part
      const jsonString = jsonMatch[1] || jsonMatch[0];
      
      try {
        // Parse the JSON
        parsedResults = JSON.parse(jsonString);
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError, 'JSON string:', jsonString);
        // Try to clean the JSON string before parsing again
        const cleanedJson = cleanJsonString(jsonString);
        parsedResults = JSON.parse(cleanedJson);
      }
    } else {
      // If no JSON found, extract materials info manually
      console.warn('No JSON found in Claude response, extracting manually');
      parsedResults = extractMaterialsFromText(responseText, analysisLevel);
    }
    
    // Merge parsed results into our result object
    Object.assign(result, parsedResults);
    
    // Ensure result has the expected structure
    return structureResults(result, analysisLevel);
    
  } catch (error) {
    console.error('Error processing Claude response:', error);
    // Return a basic error structure
    return {
      error: true,
      errorMessage: `Error processing analysis results: ${error.message}`,
      materials: [],
      totalMaterialCost: 0,
      totalCost: 0,
      notes: "Error processing analysis results. Please try again with clearer blueprint images."
    };
  }
}

/**
 * Cleans a JSON string to fix common parsing issues
 * @param {string} jsonString - JSON string to clean
 * @returns {string} Cleaned JSON string
 */
function cleanJsonString(jsonString) {
  return jsonString
    // Replace single quotes with double quotes
    .replace(/'/g, '"')
    // Fix missing quotes around property names
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
    // Fix trailing commas in arrays and objects
    .replace(/,(\s*[\]}])/g, '$1')
    // Remove C-style comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove JSON5 comments
    .replace(/\/\/.*$/gm, '');
}

/**
 * Extracts materials information from text when JSON parsing fails
 * @param {string} text - Raw text response
 * @param {string} analysisLevel - Level of analysis
 * @returns {Object} Extracted materials information
 */
function extractMaterialsFromText(text, analysisLevel) {
  // Default structure
  const result = {
    materials: [],
    notes: "Extracted from text format. Results may not be complete."
  };
  
  // Look for material lists in text
  const materialSections = text.split(/materials:|material list:|required materials:|material takeoff:/i);
  
  if (materialSections.length > 1) {
    // Process the material section
    const materialText = materialSections[1].split(/notes:|labor:|total cost:|conclusion:|summary:/i)[0];
    
    // Try to extract lines that look like material entries
    const lines = materialText.split('\n').filter(line => line.trim());
    
    // Process each line looking for material entries
    lines.forEach(line => {
      // Look for patterns like "10 sheets of 1/2" drywall" or "Copper pipe, 3/4": 120 ft"
      const quantityMatch = line.match(/(\d+\.?\d*)\s*([\w\s'"]+)/) || 
                          line.match(/([\w\s'"]+):\s*(\d+\.?\d*)\s*([\w\s]+)/);
      
      if (quantityMatch) {
        // Extract material details based on match pattern
        let material = {};
        
        if (quantityMatch[3]) {
          // Pattern: "Material: 10 units"
          material = {
            name: quantityMatch[1].trim(),
            quantity: parseFloat(quantityMatch[2]),
            unit: quantityMatch[3].trim()
          };
        } else {
          // Pattern: "10 units of material"
          material = {
            name: quantityMatch[2].trim(),
            quantity: parseFloat(quantityMatch[1]),
            unit: "each" // Default unit if not specified
          };
        }
        
        // Look for cost if applicable
        const costMatch = line.match(/\$\s*(\d+\.?\d*)/);
        if (costMatch && (analysisLevel === 'costEstimate' || analysisLevel === 'fullEstimate')) {
          material.cost = parseFloat(costMatch[1]);
        }
        
        result.materials.push(material);
      }
    });
    
    // Extract notes if present
    const notesMatch = text.match(/notes:([\s\S]*?)(?:labor:|total cost:|conclusion:|summary:|$)/i);
    if (notesMatch) {
      result.notes = notesMatch[1].trim();
    }
    
    // Extract total costs if present
    if (analysisLevel === 'costEstimate' || analysisLevel === 'fullEstimate') {
      const totalMaterialCostMatch = text.match(/total material cost:?\s*\$?\s*(\d+\.?\d*)/i);
      if (totalMaterialCostMatch) {
        result.totalMaterialCost = parseFloat(totalMaterialCostMatch[1]);
      } else {
        // Calculate from individual costs if available
        result.totalMaterialCost = result.materials.reduce((sum, item) => sum + (item.cost || 0), 0);
      }
      
      if (analysisLevel === 'fullEstimate') {
        const totalLaborCostMatch = text.match(/total labor cost:?\s*\$?\s*(\d+\.?\d*)/i);
        if (totalLaborCostMatch) {
          result.totalLaborCost = parseFloat(totalLaborCostMatch[1]);
        }
        
        const totalCostMatch = text.match(/total cost:?\s*\$?\s*(\d+\.?\d*)/i);
        if (totalCostMatch) {
          result.totalCost = parseFloat(totalCostMatch[1]);
        } else {
          // Calculate total if not found
          result.totalCost = (result.totalMaterialCost || 0) + (result.totalLaborCost || 0);
        }
      }
    }
    
    // Extract labor if applicable
    if (analysisLevel === 'fullEstimate') {
      const laborSections = text.split(/labor:|labor estimate:|labor requirements:/i);
      
      if (laborSections.length > 1) {
        const laborText = laborSections[1].split(/total cost:|conclusion:|summary:|notes:/i)[0];
        const laborLines = laborText.split('\n').filter(line => line.trim());
        
        result.labor = [];
        
        laborLines.forEach(line => {
          // Match patterns like "Task: 10 hours @ $50/hr" or "10 hours - Task"
          const laborMatch = line.match(/([\w\s'"]+):\s*(\d+\.?\d*)\s*hours?(?:\s*@\s*\$?(\d+\.?\d*)(?:\/hr)?)?/) || 
                            line.match(/(\d+\.?\d*)\s*hours?\s*(?:-|:)\s*([\w\s'"]+)(?:\s*@\s*\$?(\d+\.?\d*)(?:\/hr)?)?/);
          
          if (laborMatch) {
            let labor = {};
            
            if (laborMatch[3]) {
              // Pattern with hours and rate
              if (laborMatch[1].match(/^\d+/)) {
                // Pattern: "10 hours - Task @ $50/hr"
                labor = {
                  task: laborMatch[2].trim(),
                  hours: parseFloat(laborMatch[1]),
                  rate: parseFloat(laborMatch[3])
                };
              } else {
                // Pattern: "Task: 10 hours @ $50/hr"
                labor = {
                  task: laborMatch[1].trim(),
                  hours: parseFloat(laborMatch[2]),
                  rate: parseFloat(laborMatch[3])
                };
              }
              
              // Calculate cost
              labor.cost = labor.hours * labor.rate;
            } else {
              // Pattern without rate
              if (laborMatch[1].match(/^\d+/)) {
                // Pattern: "10 hours - Task"
                labor = {
                  task: laborMatch[2].trim(),
                  hours: parseFloat(laborMatch[1])
                };
              } else {
                // Pattern: "Task: 10 hours"
                labor = {
                  task: laborMatch[1].trim(),
                  hours: parseFloat(laborMatch[2])
                };
              }
            }
            
            result.labor.push(labor);
          }
        });
      }
    }
  }
  
  return result;
}

/**
 * Ensures results have the expected structure based on analysis level
 * @param {Object} results - Parsed results
 * @param {string} analysisLevel - Level of analysis
 * @returns {Object} Properly structured results
 */
function structureResults(results, analysisLevel) {
  // Default structure
  const structured = {
    materials: Array.isArray(results.materials) ? results.materials : [],
    notes: results.notes || "Analysis completed."
  };
  
  // Store raw response if available
  if (results.rawResponse) {
    structured.rawResponse = results.rawResponse;
  }
  
  // Add cost properties for cost estimate or full estimate
  if (analysisLevel === 'costEstimate' || analysisLevel === 'fullEstimate') {
    structured.totalMaterialCost = results.totalMaterialCost || 
      structured.materials.reduce((sum, item) => sum + (item.cost || 0), 0);
      
    // Ensure all materials have cost property
    structured.materials.forEach(material => {
      if (!material.cost) {
        material.cost = 0;
      }
    });
  }
  
  // Add labor properties for full estimate
  if (analysisLevel === 'fullEstimate') {
    structured.labor = Array.isArray(results.labor) ? results.labor : [];
    
    // Calculate labor cost if missing
    const calculatedLaborCost = structured.labor.reduce((sum, item) => {
      // If item has cost, use it, otherwise calculate from hours and rate
      const itemCost = item.cost || (item.hours * (item.rate || 0));
      return sum + itemCost;
    }, 0);
    
    structured.totalLaborCost = results.totalLaborCost || calculatedLaborCost;
    
    // Ensure labor items have consistent properties
    structured.labor.forEach(labor => {
      if (!labor.rate) labor.rate = 0;
      if (!labor.cost) labor.cost = labor.hours * labor.rate;
    });
    
    // Calculate total cost
    structured.totalCost = results.totalCost || 
      (structured.totalMaterialCost + structured.totalLaborCost);
  }
  
  // Add project information if available
  if (results.projectName) structured.projectName = results.projectName;
  if (results.projectAddress) structured.projectAddress = results.projectAddress;
  if (results.permitCost) structured.permitCost = results.permitCost;
  if (results.equipmentCost) structured.equipmentCost = results.equipmentCost;
  
  return structured;
}

// Export functions for use in other modules
module.exports = {
  analyzeBlueprintsWithClaude,
  preprocessImages,
  craftSystemPrompt,
  processClaudeResponse
};
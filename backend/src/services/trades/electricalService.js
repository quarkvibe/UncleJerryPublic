// src/services/electrical.js

import axios from 'axios';
import { toast } from 'react-toastify';

// API endpoints
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const CLAUDE_ENDPOINT = `${API_BASE_URL}/claude/analyze`;
const PROJECTS_ENDPOINT = `${API_BASE_URL}/projects`;

/**
 * Analyzes uploaded blueprint images for electrical takeoff using Claude API
 * @param {Array} blueprintFiles - Array of blueprint file objects
 * @param {String} analysisType - Type of analysis ('materials', 'costs', 'full')
 * @param {String} projectScale - Scale of the blueprints (e.g., '1/4"=1\'')
 * @returns {Promise} - Promise with analysis results
 */
export const analyzeElectricalBlueprints = async (blueprintFiles, analysisType = 'full', projectScale = null) => {
  try {
    // Create form data with blueprint images
    const formData = new FormData();
    
    // Add each blueprint file
    blueprintFiles.forEach((blueprint, index) => {
      formData.append(`blueprint_${index}`, blueprint.file);
      formData.append(`blueprint_${index}_type`, blueprint.type);
    });
    
    // Add analysis parameters
    formData.append('trade', 'electrical');
    formData.append('analysis_type', analysisType);
    
    if (projectScale) {
      formData.append('project_scale', projectScale);
    }
    
    // Call Claude API
    const response = await axios.post(CLAUDE_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 90000 // 90 second timeout for image analysis (electrical can be complex)
    });
    
    if (response.status === 200 && response.data.success) {
      return response.data.results;
    } else {
      throw new Error(response.data.message || 'Failed to analyze blueprints');
    }
  } catch (error) {
    console.error('Blueprint analysis error:', error);
    
    // Handle specific error cases
    if (error.response && error.response.status === 429) {
      toast.error('Too many requests. Please try again in a few minutes.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Analysis timed out. Try with fewer or smaller images.');
    } else {
      toast.error('Error analyzing blueprints: ' + (error.message || 'Unknown error'));
    }
    
    throw error;
  }
};

/**
 * Saves an electrical analysis project to the database
 * @param {Object} projectData - Project data including analysis results
 * @returns {Promise} - Promise with saved project data
 */
export const saveProject = async (projectData) => {
  try {
    const response = await axios.post(PROJECTS_ENDPOINT, {
      ...projectData,
      trade: 'electrical'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.status === 201 && response.data.success) {
      toast.success('Project saved successfully!');
      return response.data.project;
    } else {
      throw new Error(response.data.message || 'Failed to save project');
    }
  } catch (error) {
    console.error('Project save error:', error);
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      toast.error('Your session has expired. Please log in again.');
      // Optionally redirect to login page
    } else {
      toast.error('Error saving project: ' + (error.message || 'Unknown error'));
    }
    
    throw error;
  }
};

/**
 * Gets a list of saved electrical projects for the current user
 * @param {Object} filters - Optional filters like date range
 * @returns {Promise} - Promise with list of projects
 */
export const getProjects = async (filters = {}) => {
  try {
    const response = await axios.get(PROJECTS_ENDPOINT, {
      params: {
        ...filters,
        trade: 'electrical'
      },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.status === 200) {
      return response.data.projects;
    } else {
      throw new Error(response.data.message || 'Failed to retrieve projects');
    }
  } catch (error) {
    console.error('Get projects error:', error);
    toast.error('Error retrieving projects: ' + (error.message || 'Unknown error'));
    return [];
  }
};

/**
 * Gets a specific electrical project by ID
 * @param {String} projectId - Project ID
 * @returns {Promise} - Promise with project data
 */
export const getProjectById = async (projectId) => {
  try {
    const response = await axios.get(`${PROJECTS_ENDPOINT}/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.status === 200) {
      return response.data.project;
    } else {
      throw new Error(response.data.message || 'Failed to retrieve project');
    }
  } catch (error) {
    console.error('Get project error:', error);
    toast.error('Error retrieving project: ' + (error.message || 'Unknown error'));
    throw error;
  }
};

/**
 * Updates an existing electrical project
 * @param {String} projectId - Project ID
 * @param {Object} updateData - Updated project data
 * @returns {Promise} - Promise with updated project data
 */
export const updateProject = async (projectId, updateData) => {
  try {
    const response = await axios.put(`${PROJECTS_ENDPOINT}/${projectId}`, {
      ...updateData,
      trade: 'electrical'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      toast.success('Project updated successfully!');
      return response.data.project;
    } else {
      throw new Error(response.data.message || 'Failed to update project');
    }
  } catch (error) {
    console.error('Project update error:', error);
    toast.error('Error updating project: ' + (error.message || 'Unknown error'));
    throw error;
  }
};

/**
 * Deletes an electrical project
 * @param {String} projectId - Project ID
 * @returns {Promise} - Promise with deletion result
 */
export const deleteProject = async (projectId) => {
  try {
    const response = await axios.delete(`${PROJECTS_ENDPOINT}/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      toast.success('Project deleted successfully!');
      return true;
    } else {
      throw new Error(response.data.message || 'Failed to delete project');
    }
  } catch (error) {
    console.error('Project deletion error:', error);
    toast.error('Error deleting project: ' + (error.message || 'Unknown error'));
    throw error;
  }
};

/**
 * Exports electrical analysis to various formats
 * @param {String} projectId - Project ID
 * @param {String} format - Export format ('pdf', 'csv', 'excel')
 * @returns {Promise} - Promise with export URL or blob
 */
export const exportProject = async (projectId, format = 'pdf') => {
  try {
    const response = await axios.get(`${PROJECTS_ENDPOINT}/${projectId}/export`, {
      params: { format, trade: 'electrical' },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      responseType: format === 'pdf' ? 'blob' : 'json'
    });
    
    if (response.status === 200) {
      if (format === 'pdf') {
        // Handle PDF blob
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Auto-download the file
        const link = document.createElement('a');
        link.href = url;
        link.download = `electrical_analysis_${projectId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return url;
      } else {
        // Handle JSON data for CSV or Excel
        return response.data;
      }
    } else {
      throw new Error('Failed to export project');
    }
  } catch (error) {
    console.error('Project export error:', error);
    toast.error('Error exporting project: ' + (error.message || 'Unknown error'));
    throw error;
  }
};

/**
 * Generates prompts for Claude API based on blueprint types and electrical analysis
 * @param {Array} blueprints - Blueprint file objects
 * @param {String} analysisType - Type of analysis ('materials', 'costs', 'full')
 * @param {String} projectScale - Scale of the blueprints (e.g., '1/4"=1\'')
 * @returns {String} - Formatted Claude prompt
 */
export const generateElectricalPrompt = (blueprints, analysisType = 'full', projectScale = null) => {
  // Get plan and legend blueprints
  const electricalPlan = blueprints.find(bp => bp.type === 'electrical_plan' || bp.type === 'floor_plan');
  const legend = blueprints.find(bp => bp.type === 'legend' || bp.type === 'electrical_legend');
  const powerPlan = blueprints.find(bp => bp.type === 'power_plan');
  const lightingPlan = blueprints.find(bp => bp.type === 'lighting_plan');
  const scalePlan = blueprints.find(bp => bp.type === 'scale_page' || bp.type === 'title_block');
  
  // Base prompt structure
  let prompt = `I need you to analyze the electrical blueprint images I've provided. Please perform a detailed electrical material takeoff and provide me with a comprehensive list of all electrical components and quantities.\n\n`;
  
  // Add specific instructions
  prompt += `First, carefully examine all the images to identify the electrical legend, symbols, and scale information.\n`;
  prompt += `Then, identify and count all electrical components shown in the plans, including but not limited to: receptacles, switches, lighting fixtures, panels, junction boxes, and any special electrical equipment.\n`;
  prompt += `For wiring, please estimate the quantities of MC cable, conduit, and wire based on the layout shown, adding appropriate percentages for vertical runs, turns, and waste.\n`;
  
  // Project scale instruction
  if (projectScale) {
    prompt += `The provided project scale is ${projectScale}. Use this to calculate distances and lengths of conduit and cable runs.\n`;
  } else if (scalePlan) {
    prompt += `Please identify the project scale from the title block or scale page and use it for your calculations.\n`;
  } else {
    prompt += `If you can identify the project scale from any of the drawings, please use it for your calculations. Otherwise, make reasonable assumptions based on standard construction practices.\n`;
  }
  
  // Analysis type specific instructions
  if (analysisType === 'materials') {
    prompt += `Focus on providing accurate component counts and material quantities without cost information.\n`;
  } else if (analysisType === 'costs') {
    prompt += `Please include both material quantities and cost estimates based on current industry standard pricing.\n`;
  } else if (analysisType === 'full') {
    prompt += `Provide a comprehensive analysis including material quantities, cost estimates, and labor hours. For labor, calculate based on standard industry productivity rates.\n`;
    prompt += `Also include important installation notes and special considerations based on the design.\n`;
  }
  
  // Special situations where calculation methodology needs explanation
  prompt += `For any areas where you have to make assumptions or use special calculation methods, please briefly explain your approach.\n`;
  
  // Specific request for output format
  prompt += `Format your response as follows:\n`;
  prompt += `1. A table of electrical components organized by category (Receptacles, Switches, Lighting, Panels, Conduit & Raceway, Wire, Boxes & Enclosures, Special Systems, Miscellaneous)\n`;
  prompt += `2. For each component, include: category, name, quantity, and unit of measure\n`;
  
  if (analysisType !== 'materials') {
    prompt += `3. Include unit price and total price for each component\n`;
  }
  
  if (analysisType === 'full') {
    prompt += `4. A list of important installation notes with priority levels (high, medium, low)\n`;
    prompt += `5. Total labor hours estimate\n`;
  }
  
  prompt += `6. Summary totals for MC cable, conduit, and boxes\n`;
  
  // Add reference to the uploaded blueprints
  prompt += `\nI've provided the following images for analysis:\n`;
  
  // List each blueprint type that was provided
  if (electricalPlan) {
    prompt += `- Electrical plan showing layout of components\n`;
  }
  
  if (legend) {
    prompt += `- Electrical legend with symbols and descriptions\n`;
  }
  
  if (powerPlan) {
    prompt += `- Power plan showing outlets, circuits, and panels\n`;
  }
  
  if (lightingPlan) {
    prompt += `- Lighting plan showing fixtures and switches\n`;
  }
  
  if (scalePlan) {
    prompt += `- Title block/scale page with project information\n`;
  }
  
  // List any other blueprints that don't fit the categories above
  const otherBlueprints = blueprints.filter(bp => 
    bp.type !== 'electrical_plan' && 
    bp.type !== 'floor_plan' && 
    bp.type !== 'legend' && 
    bp.type !== 'electrical_legend' &&
    bp.type !== 'power_plan' &&
    bp.type !== 'lighting_plan' &&
    bp.type !== 'scale_page' &&
    bp.type !== 'title_block'
  );
  
  otherBlueprints.forEach((bp, index) => {
    prompt += `- Additional blueprint ${index + 1}: ${bp.type.replace('_', ' ')}\n`;
  });
  
  return prompt;
};

/**
 * Parses Claude API response to extract electrical components and notes
 * @param {String} claudeResponse - Response text from Claude API
 * @param {String} analysisType - Type of analysis ('materials', 'costs', 'full')
 * @returns {Object} - Structured data with components and notes
 */
export const parseClaudeResponse = (claudeResponse, analysisType = 'full') => {
  // Initialize result structure
  const result = {
    components: [],
    notes: [],
    totalMCCable: 0,
    totalConduit: 0,
    totalBoxes: 0,
    laborHours: analysisType === 'full' ? 0 : undefined
  };
  
  try {
    // First, extract electrical components from tables in the response
    let tablePattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+\.?\d*)\s*\|\s*([^|]+)\s*\|/g;
    
    // If costs are included, use a different pattern
    if (analysisType !== 'materials') {
      tablePattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+\.?\d*)\s*\|\s*([^|]+)\s*\|\s*\$?(\d+\.?\d*)\s*\|\s*\$?(\d+\.?\d*)\s*\|/g;
    }
    
    let match;
    let currentCategory = 'Miscellaneous'; // Default category
    
    // First pass: extract category headers and components
    const lines = claudeResponse.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is a category header
      const categoryMatch = line.match(/^#+\s*(.*?)\s*(?:Components)?$/i) || 
                            line.match(/^[A-Z][A-Za-z\s]+:$/);
      
      if (categoryMatch) {
        const possibleCategory = categoryMatch[1].trim();
        
        // Verify this is one of our expected categories
        const validCategories = [
          'Receptacles', 'Switches', 'Lighting', 'Panels', 
          'Conduit', 'Raceway', 'Conduit & Raceway', 
          'Wire', 'Boxes', 'Enclosures', 'Boxes & Enclosures', 
          'Special Systems', 'Miscellaneous'
        ];
        
        const matchedCategory = validCategories.find(cat => 
          possibleCategory.includes(cat) || cat.includes(possibleCategory)
        );
        
        if (matchedCategory) {
          currentCategory = matchedCategory;
          // Handle combined categories
          if (currentCategory === 'Conduit' || currentCategory === 'Raceway') {
            currentCategory = 'Conduit & Raceway';
          }
          if (currentCategory === 'Boxes' || currentCategory === 'Enclosures') {
            currentCategory = 'Boxes & Enclosures';
          }
        }
      }
      
      // Reset the pattern to start from the beginning of the line
      if (analysisType !== 'materials') {
        tablePattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+\.?\d*)\s*\|\s*([^|]+)\s*\|\s*\$?(\d+\.?\d*)\s*\|\s*\$?(\d+\.?\d*)\s*\|/g;
      } else {
        tablePattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+\.?\d*)\s*\|\s*([^|]+)\s*\|/g;
      }
      
      // Extract components from this line
      while ((match = tablePattern.exec(line)) !== null) {
        // Skip table headers
        if (/Component|Description|Quantity|Unit|Price|Total/i.test(match[1]) ||
            /^\-+$/.test(match[1])) {
          continue;
        }
        
        // Create component based on analysis type
        if (analysisType !== 'materials') {
          result.components.push({
            // Use category from the markdown structure if available
            category: currentCategory,
            name: match[2].trim(),
            quantity: parseFloat(match[3]),
            unit: match[4].trim(),
            unitPrice: parseFloat(match[5]),
            totalPrice: parseFloat(match[6])
          });
        } else {
          result.components.push({
            category: currentCategory,
            name: match[2].trim(),
            quantity: parseFloat(match[3]),
            unit: match[4].trim()
          });
        }
      }
    }
    
    // If table parsing didn't work well, try to extract components from text
    if (result.components.length === 0) {
      // Look for component listings in various formats
      const componentPatterns = [
        // Format: Category: Component name - Quantity unit
        /([A-Za-z\s&]+):\s*([A-Za-z0-9\s\-'"]+)\s*-\s*(\d+\.?\d*)\s*([A-Za-z]+)/g,
        // Format: Component name: Quantity unit
        /([A-Za-z0-9\s\-'"]+):\s*(\d+\.?\d*)\s*([A-Za-z]+)/g,
        // Format: Quantity unit of Component name
        /(\d+\.?\d*)\s*([A-Za-z]+)\s*of\s*([A-Za-z0-9\s\-'"]+)/g
      ];
      
      componentPatterns.forEach(pattern => {
        while ((match = pattern.exec(claudeResponse)) !== null) {
          // Different parsing based on pattern
          if (pattern.source.includes('Category')) {
            // Format: Category: Component name - Quantity unit
            result.components.push({
              category: match[1].trim(),
              name: match[2].trim(),
              quantity: parseFloat(match[3]),
              unit: match[4].trim()
            });
          } else if (pattern.source.includes('Component name')) {
            // Format: Component name: Quantity unit
            // Try to infer category from component name
            const name = match[1].trim();
            let category = 'Miscellaneous';
            
            if (/receptacle|outlet|plug/i.test(name)) category = 'Receptacles';
            else if (/switch|dimmer/i.test(name)) category = 'Switches';
            else if (/light|fixture|lamp|luminaire/i.test(name)) category = 'Lighting';
            else if (/panel|board|disconnect/i.test(name)) category = 'Panels';
            else if (/conduit|raceway|mc cable|emt/i.test(name)) category = 'Conduit & Raceway';
            else if (/wire|conductor|thhn|cable/i.test(name)) category = 'Wire';
            else if (/box|enclosure|cabinet/i.test(name)) category = 'Boxes & Enclosures';
            
            result.components.push({
              category,
              name,
              quantity: parseFloat(match[2]),
              unit: match[3].trim()
            });
          } else {
            // Format: Quantity unit of Component name
            const name = match[3].trim();
            let category = 'Miscellaneous';
            
            if (/receptacle|outlet|plug/i.test(name)) category = 'Receptacles';
            else if (/switch|dimmer/i.test(name)) category = 'Switches';
            else if (/light|fixture|lamp|luminaire/i.test(name)) category = 'Lighting';
            else if (/panel|board|disconnect/i.test(name)) category = 'Panels';
            else if (/conduit|raceway|mc cable|emt/i.test(name)) category = 'Conduit & Raceway';
            else if (/wire|conductor|thhn|cable/i.test(name)) category = 'Wire';
            else if (/box|enclosure|cabinet/i.test(name)) category = 'Boxes & Enclosures';
            
            result.components.push({
              category,
              name,
              quantity: parseFloat(match[1]),
              unit: match[2].trim()
            });
          }
        }
      });
    }
    
    // Extract installation notes if this is a full analysis
    if (analysisType === 'full') {
      const notesSection = claudeResponse.match(/(?:Installation Notes|Notes|Important Considerations)(?:[\s\S]*?)(?=##|$)/i);
      
      if (notesSection) {
        const notesText = notesSection[0];
        
        // Look for notes in various formats
        // Format: - Note text (Priority)
        const priorityPattern = /-\s*([^(]+)\s*\(([^)]+)\)/g;
        
        while ((match = priorityPattern.exec(notesText)) !== null) {
          const noteText = match[1].trim();
          let priority = match[2].toLowerCase().trim();
          
          // Normalize priority
          if (priority.includes('high')) priority = 'high';
          else if (priority.includes('med')) priority = 'medium';
          else if (priority.includes('low')) priority = 'low';
          else priority = 'medium'; // Default
          
          result.notes.push({
            text: noteText,
            priority: priority
          });
        }
        
        // If no prioritized notes found, look for bullet points
        if (result.notes.length === 0) {
          const bulletPattern = /-\s*([^-]+)/g;
          
          while ((match = bulletPattern.exec(notesText)) !== null) {
            const noteText = match[1].trim();
            
            // Skip empty notes or headers
            if (noteText && !noteText.match(/^Notes|^Installation|^Important/i)) {
              // Infer priority based on keywords
              let priority = 'medium';
              
              if (/critical|essential|must|required|safety|fire|hazard|danger|warning/i.test(noteText)) {
                priority = 'high';
              } else if (/recommend|suggestion|consider|optional|might|may/i.test(noteText)) {
                priority = 'low';
              }
              
              result.notes.push({
                text: noteText,
                priority
              });
            }
          }
        }
      }
    }
    
    // Extract total MC cable
    const mcCableMatch = claudeResponse.match(/(?:Total\s+)?MC\s+Cable:?\s*(\d+[,\d]*\.?\d*)\s*(?:feet|ft)/i);
    if (mcCableMatch) {
      result.totalMCCable = parseFloat(mcCableMatch[1].replace(/,/g, ''));
    } else {
      // Calculate from components
      const mcComponents = result.components.filter(c => 
        c.name.toLowerCase().includes('mc cable') || 
        (c.category === 'Conduit & Raceway' && c.name.toLowerCase().includes('mc'))
      );
      
      if (mcComponents.length > 0) {
        result.totalMCCable = mcComponents.reduce((sum, comp) => sum + comp.quantity, 0);
      }
    }
    
    // Extract total conduit
    const conduitMatch = claudeResponse.match(/(?:Total\s+)?Conduit:?\s*(\d+[,\d]*\.?\d*)\s*(?:feet|ft)/i);
    if (conduitMatch) {
      result.totalConduit = parseFloat(conduitMatch[1].replace(/,/g, ''));
    } else {
      // Calculate from components
      const conduitComponents = result.components.filter(c => 
        c.name.toLowerCase().includes('conduit') || 
        (c.category === 'Conduit & Raceway' && 
         !c.name.toLowerCase().includes('mc') && 
         !c.name.toLowerCase().includes('cable'))
      );
      
      if (conduitComponents.length > 0) {
        result.totalConduit = conduitComponents.reduce((sum, comp) => sum + comp.quantity, 0);
      }
    }
    
    // Extract total boxes
    const boxesMatch = claudeResponse.match(/(?:Total\s+)?Boxes:?\s*(\d+[,\d]*\.?\d*)/i);
    if (boxesMatch) {
      result.totalBoxes = parseFloat(boxesMatch[1].replace(/,/g, ''));
    } else {
      // Calculate from components
      const boxComponents = result.components.filter(c => 
        c.category === 'Boxes & Enclosures' || 
        c.name.toLowerCase().includes('box') || 
        c.name.toLowerCase().includes('enclosure')
      );
      
      if (boxComponents.length > 0) {
        result.totalBoxes = boxComponents.reduce((sum, comp) => sum + comp.quantity, 0);
      }
    }
    
    // Extract labor hours if this is a full analysis
    if (analysisType === 'full') {
      const laborMatch = claudeResponse.match(/(?:Total\s+)?Labor\s+Hours:?\s*(\d+[,\d]*\.?\d*)/i);
      if (laborMatch) {
        result.laborHours = parseFloat(laborMatch[1].replace(/,/g, ''));
      } else {
        // Default labor calculation if not provided
        // Typical electrical labor estimation: 1 hour per $100 in material
        const materialCost = result.components.reduce(
          (sum, comp) => sum + (comp.totalPrice || 0), 0
        );
        result.laborHours = Math.round(materialCost / 100);
      }
    }
    
    // Add unit prices if not provided but analysis type requires it
    if (analysisType !== 'materials' && 
        result.components.some(c => c.unitPrice === undefined)) {
      result.components = assignDefaultPrices(result.components);
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return result;
  }
};

/**
 * Assigns default prices to electrical components if prices are missing
 * @param {Array} components - Array of electrical components
 * @returns {Array} - Components with prices assigned
 */
const assignDefaultPrices = (components) => {
  const defaultPrices = {
    // Receptacles
    'Standard Duplex Receptacles': 3.25,
    'GFCI Receptacles': 15.75,
    'Weather Resistant Receptacles': 18.50,
    'Floor Receptacles': 35.00,
    'Hospital Grade Receptacles': 22.50,
    'USB Receptacles': 25.00,
    
    // Switches
    'Toggle Switches': 2.95,
    '3-Way Toggle Switches': 5.45,
    'Dimmer Switches': 18.25,
    'Occupancy Sensor Switches': 35.75,
    
    // Lighting
    'Recessed Downlights': 24.50,
    'Track Lighting': 32.75,
    'Fluorescent Fixtures': 45.00,
    'LED Fixtures': 85.00,
    'Exit Signs': 75.00,
    'Emergency Lighting': 95.00,
    
    // Panels
    'Main Panel': 750.00,
    'Branch Panel': 425.00,
    'Subpanel': 350.00,
    'Load Center': 225.00,
    
    // Conduit & Raceway
    'EMT Conduit': 1.75,
    'Rigid Conduit': 3.25,
    'PVC Conduit': 1.50,
    'Flexible Conduit': 2.25,
    'MC Cable': 1.85,
    'Cable Tray': 45.00,
    
    // Wire
    '#12 THHN': 0.18,
    '#10 THHN': 0.28,
    '#8 THHN': 0.45,
    '#6 THHN': 0.65,
    '#4 THHN': 0.95,
    '#2 THHN': 1.25,
    'CAT6 Cable': 0.65,
    
    // Boxes & Enclosures
    'Standard Device Box': 3.15,
    'Deep Device Box': 4.50,
    'Ceiling Box': 5.25,
    'Junction Box': 7.85,
    'Pull Box': 35.00,
    'NEMA 1 Enclosure': 45.00,
    'NEMA 3R Enclosure': 65.00,
    'NEMA 4X Enclosure': 125.00,
    
    // Special Systems
    'Fire Alarm Pull Station': 95.00,
    'Smoke Detector': 45.00,
    'Horn/Strobe': 85.00,
    'Security Camera': 135.00,
    'Card Reader': 225.00,
    'Access Control Panel': 450.00,
    'Data Outlet': 12.50,
    
    // Miscellaneous
    'Concrete Anchor': 0.85,
    'Mounting Hardware Kit': 12.50,
    'Wire Connector': 0.35,
    'Cable Tie': 0.15,
    'Tape': 4.25,
    'Label': 0.25
  };
  
  // Make a copy of the components array to avoid mutating the original
  const updatedComponents = [...components];
  
  // Assign default prices to any components that don't have prices
  for (let i = 0; i < updatedComponents.length; i++) {
    const component = updatedComponents[i];
    
    // Skip if unit price is already defined
    if (component.unitPrice !== undefined) continue;
    
    // Check for exact name match
    if (defaultPrices[component.name]) {
      component.unitPrice = defaultPrices[component.name];
      component.totalPrice = component.quantity * component.unitPrice;
      continue;
    }
    
    // If no exact match, look for partial matches
    let found = false;
    for (const [defaultName, price] of Object.entries(defaultPrices)) {
      if (component.name.toLowerCase().includes(defaultName.toLowerCase()) ||
          defaultName.toLowerCase().includes(component.name.toLowerCase())) {
        component.unitPrice = price;
        component.totalPrice = component.quantity * component.unitPrice;
        found = true;
        break;
      }
    }
    
    // If still no match, use category-based defaults
    if (!found) {
      switch (component.category) {
        case 'Receptacles':
          component.unitPrice = 5.00;
          break;
        case 'Switches':
          component.unitPrice = 4.50;
          break;
        case 'Lighting':
          component.unitPrice = 55.00;
          break;
        case 'Panels':
          component.unitPrice = 350.00;
          break;
        case 'Conduit & Raceway':
          component.unitPrice = 2.50;
          break;
        case 'Wire':
          component.unitPrice = 0.35;
          break;
        case 'Boxes & Enclosures':
          component.unitPrice = 8.50;
          break;
        case 'Special Systems':
          component.unitPrice = 75.00;
          break;
        case 'Miscellaneous':
        default:
          component.unitPrice = 5.00;
          break;
      }
      component.totalPrice = component.quantity * component.unitPrice;
    }
  }
  
  return updatedComponents;
};

/**
 * Calculates project totals from component list
 * @param {Array} components - Array of electrical components
 * @returns {Object} - Totals including material cost, labor, and tax
 */
export const calculateProjectTotals = (components, laborHours = 0) => {
  // Initialize totals
  const totals = {
    materialCost: 0,
    laborCost: 0,
    tax: 0,
    overhead: 0,
    profit: 0,
    totalCost: 0
  };
  
  // Constants for calculations
  const LABOR_RATE = 85; // $85 per hour
  const TAX_RATE = 0.08; // 8% sales tax
  const OVERHEAD_RATE = 0.15; // 15% overhead
  const PROFIT_RATE = 0.10; // 10% profit
  
  // Calculate material cost
  totals.materialCost = components.reduce(
    (sum, component) => sum + (component.totalPrice || 0), 0
  );
  
  // Calculate labor cost
  totals.laborCost = laborHours * LABOR_RATE;
  
  // Calculate tax
  totals.tax = totals.materialCost * TAX_RATE;
  
  // Calculate overhead and profit
  const subtotal = totals.materialCost + totals.laborCost + totals.tax;
  totals.overhead = subtotal * OVERHEAD_RATE;
  totals.profit = subtotal * PROFIT_RATE;
  
  // Calculate total cost
  totals.totalCost = subtotal + totals.overhead + totals.profit;
  
  return totals;
};

/**
 * Calculates labor hours required for an electrical project
 * @param {Array} components - Array of electrical components
 * @returns {Number} - Estimated labor hours
 */
export const calculateLaborHours = (components) => {
  // Labor hour rates for different component categories (hours per unit)
  const laborRates = {
    'Receptacles': 0.5, // 30 minutes per device
    'Switches': 0.5, // 30 minutes per device
    'Lighting': 1.0, // 1 hour per fixture
    'Panels': 6.0, // 6 hours per panel
    'Conduit & Raceway': 0.1, // 6 minutes per foot
    'Wire': 0.02, // 1.2 minutes per foot
    'Boxes & Enclosures': 0.75, // 45 minutes per box
    'Special Systems': 2.0, // 2 hours per device
    'Miscellaneous': 0.1 // 6 minutes per item
  };
  
  // Calculate labor hours for each component
  let totalHours = 0;
  
  components.forEach(component => {
    const rate = laborRates[component.category] || 0.1; // Default to 6 minutes if category not found
    const hours = component.quantity * rate;
    totalHours += hours;
  });
  
  // Add 15% for coordination, cleanup, and testing
  totalHours *= 1.15;
  
  // Round to nearest quarter hour
  return Math.round(totalHours * 4) / 4;
};

/**
 * Validates material quantities for consistency and minimum values
 * @param {Array} components - Array of electrical components
 * @returns {Array} - Array of validation issues found
 */
export const validateMaterials = (components) => {
  const issues = [];
  const receptacleCount = components
    .filter(c => c.category === 'Receptacles')
    .reduce((sum, c) => sum + c.quantity, 0);
    
  const boxCount = components
    .filter(c => c.category === 'Boxes & Enclosures')
    .reduce((sum, c) => sum + c.quantity, 0);
    
  const conduitLength = components
    .filter(c => c.category === 'Conduit & Raceway')
    .reduce((sum, c) => sum + c.quantity, 0);
    
  const wireLength = components
    .filter(c => c.category === 'Wire')
    .reduce((sum, c) => sum + c.quantity, 0);
  
  // Check for appropriate number of boxes for devices
  if (boxCount < receptacleCount) {
    issues.push({
      severity: 'high',
      message: `Not enough boxes (${boxCount}) for the number of receptacles (${receptacleCount})`
    });
  }
  
  // Check for appropriate amount of wire for conduit
  if (wireLength < conduitLength * 1.1) {
    issues.push({
      severity: 'medium',
      message: `Wire length (${wireLength} ft) may be insufficient for conduit runs (${conduitLength} ft)`
    });
  }
  
  // Check for balance between components
  const panelCount = components
    .filter(c => c.category === 'Panels')
    .reduce((sum, c) => sum + c.quantity, 0);
    
  if (panelCount === 0 && receptacleCount > 0) {
    issues.push({
      severity: 'high',
      message: 'No panels specified for powering receptacles and other devices'
    });
  }
  
  // Check for missing essential categories
  const categories = new Set(components.map(c => c.category));
  const essentialCategories = [
    'Receptacles', 'Wire', 'Boxes & Enclosures', 'Conduit & Raceway'
  ];
  
  essentialCategories.forEach(category => {
    if (!categories.has(category)) {
      issues.push({
        severity: 'medium',
        message: `No ${category} items specified in the takeoff`
      });
    }
  });
  
  return issues;
};

/**
 * Groups electrical components by circuit for load calculations
 * @param {Array} components - Array of electrical components
 * @returns {Object} - Grouped components by circuit with load calculations
 */
export const calculateCircuitLoads = (components) => {
  // Extract circuit information from component names if available
  const circuits = {};
  
  components.forEach(component => {
    // Try to find circuit number in the component name
    const circuitMatch = component.name.match(/(?:circuit|ckt)\.?\s*#?\s*(\d+)/i);
    let circuitNumber = circuitMatch ? circuitMatch[1] : 'Unassigned';
    
    // Estimate load for component
    let load = 0;
    
    // Assign load based on component category and name
    if (component.category === 'Receptacles') {
      if (component.name.toLowerCase().includes('gfci')) {
        load = 180; // GFCI receptacle - 1.5A at 120V
      } else {
        load = 120; // Standard receptacle - 1A at 120V
      }
    } else if (component.category === 'Lighting') {
      if (component.name.toLowerCase().includes('led')) {
        load = 60; // LED fixture - 0.5A at 120V
      } else if (component.name.toLowerCase().includes('fluorescent')) {
        load = 72; // Fluorescent fixture - 0.6A at 120V
      } else {
        load = 100; // Other lighting - estimated 100W
      }
    } else if (component.category === 'Special Systems') {
      load = 50; // Low voltage systems typically have minimal load
    }
    
    // Multiply by quantity to get total load
    const totalLoad = load * component.quantity;
    
    // Add to circuit or create new entry
    if (circuits[circuitNumber]) {
      circuits[circuitNumber].components.push(component);
      circuits[circuitNumber].totalLoad += totalLoad;
    } else {
      circuits[circuitNumber] = {
        circuitNumber,
        components: [component],
        totalLoad,
        isOverloaded: false
      };
    }
  });
  
  // Check for overloaded circuits (standard 15A circuit = 1800W, 80% = 1440W)
  Object.values(circuits).forEach(circuit => {
    if (circuit.totalLoad > 1440) {
      circuit.isOverloaded = true;
    }
  });
  
  return circuits;
};

/**
 * Generates a PDF report from electrical analysis results
 * @param {Object} analysisResults - Complete analysis results
 * @param {String} projectName - Name of the project
 * @returns {Promise} - Promise with PDF blob
 */
export const generatePDFReport = async (analysisResults, projectName) => {
  try {
    // We'll use the API to generate the PDF
    const response = await axios.post(`${API_BASE_URL}/reports/generate`, {
      type: 'electrical',
      projectName,
      data: analysisResults
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    });
    
    if (response.status === 200) {
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      return url;
    } else {
      throw new Error('Failed to generate PDF report');
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.error('Error generating PDF report: ' + (error.message || 'Unknown error'));
    throw error;
  }
};

/**
 * Compares two electrical analyses to identify differences
 * @param {Object} baselineAnalysis - Original analysis results
 * @param {Object} updatedAnalysis - New analysis results
 * @returns {Object} - Differences between analyses
 */
export const compareAnalyses = (baselineAnalysis, updatedAnalysis) => {
  const differences = {
    added: [],
    removed: [],
    modified: [],
    costChange: 0,
    percentageChange: 0
  };
  
  // Create maps for easy lookup
  const baselineMap = new Map(
    baselineAnalysis.components.map(c => [`${c.category}-${c.name}`, c])
  );
  
  const updatedMap = new Map(
    updatedAnalysis.components.map(c => [`${c.category}-${c.name}`, c])
  );
  
  // Find added and modified components
  updatedAnalysis.components.forEach(component => {
    const key = `${component.category}-${component.name}`;
    const baselineComponent = baselineMap.get(key);
    
    if (!baselineComponent) {
      // Component was added
      differences.added.push(component);
    } else if (baselineComponent.quantity !== component.quantity) {
      // Component quantity was modified
      differences.modified.push({
        component,
        previousQuantity: baselineComponent.quantity,
        quantityChange: component.quantity - baselineComponent.quantity
      });
    }
  });
  
  // Find removed components
  baselineAnalysis.components.forEach(component => {
    const key = `${component.category}-${component.name}`;
    if (!updatedMap.has(key)) {
      differences.removed.push(component);
    }
  });
  
  // Calculate cost changes
  const baselineCost = baselineAnalysis.components.reduce(
    (sum, c) => sum + (c.totalPrice || 0), 0
  );
  
  const updatedCost = updatedAnalysis.components.reduce(
    (sum, c) => sum + (c.totalPrice || 0), 0
  );
  
  differences.costChange = updatedCost - baselineCost;
  differences.percentageChange = baselineCost > 0 ? 
    (differences.costChange / baselineCost * 100) : 0;
  
  return differences;
};

// Export utilities for testing
export const __testing = {
  assignDefaultPrices,
  calculateLaborHours,
  validateMaterials
};
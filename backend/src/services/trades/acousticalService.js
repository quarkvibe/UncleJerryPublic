// src/services/acoustical.js

import axios from 'axios';
import { toast } from 'react-toastify';

// API endpoints
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const CLAUDE_ENDPOINT = `${API_BASE_URL}/claude/analyze`;
const PROJECTS_ENDPOINT = `${API_BASE_URL}/projects`;

/**
 * Analyzes uploaded blueprint images for acoustical ceiling takeoff using Claude API
 * @param {Array} blueprintFiles - Array of blueprint file objects
 * @param {Boolean} includeGridSystem - Whether to include grid system in the analysis
 * @returns {Promise} - Promise with analysis results
 */
export const analyzeAcousticalCeiling = async (blueprintFiles, includeGridSystem = true) => {
  try {
    // Create form data with blueprint images
    const formData = new FormData();
    
    // Add each blueprint file
    blueprintFiles.forEach((blueprint, index) => {
      formData.append(`blueprint_${index}`, blueprint.file);
      formData.append(`blueprint_${index}_type`, blueprint.type);
    });
    
    // Add analysis parameters
    formData.append('trade', 'acoustical');
    formData.append('analysis_type', 'material_takeoff');
    formData.append('include_grid', includeGridSystem.toString());
    
    // Call Claude API
    const response = await axios.post(CLAUDE_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 second timeout for image analysis
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
 * Saves an acoustical ceiling analysis project to the database
 * @param {Object} projectData - Project data including analysis results
 * @returns {Promise} - Promise with saved project data
 */
export const saveProject = async (projectData) => {
  try {
    const response = await axios.post(PROJECTS_ENDPOINT, {
      ...projectData,
      trade: 'acoustical'
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
 * Gets a list of saved acoustical ceiling projects for the current user
 * @param {Object} filters - Optional filters like date range
 * @returns {Promise} - Promise with list of projects
 */
export const getProjects = async (filters = {}) => {
  try {
    const response = await axios.get(PROJECTS_ENDPOINT, {
      params: {
        ...filters,
        trade: 'acoustical'
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
 * Gets a specific acoustical ceiling project by ID
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
 * Updates an existing acoustical ceiling project
 * @param {String} projectId - Project ID
 * @param {Object} updateData - Updated project data
 * @returns {Promise} - Promise with updated project data
 */
export const updateProject = async (projectId, updateData) => {
  try {
    const response = await axios.put(`${PROJECTS_ENDPOINT}/${projectId}`, {
      ...updateData,
      trade: 'acoustical'
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
 * Deletes an acoustical ceiling project
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
 * Exports acoustical ceiling analysis to various formats
 * @param {String} projectId - Project ID
 * @param {String} format - Export format ('pdf', 'csv', 'excel')
 * @returns {Promise} - Promise with export URL or blob
 */
export const exportProject = async (projectId, format = 'pdf') => {
  try {
    const response = await axios.get(`${PROJECTS_ENDPOINT}/${projectId}/export`, {
      params: { format, trade: 'acoustical' },
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
        link.download = `acoustical_ceiling_analysis_${projectId}.pdf`;
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
 * Generates prompts for Claude API based on blueprint types and acoustical analysis
 * @param {Array} blueprints - Blueprint file objects
 * @param {Boolean} includeGridSystem - Whether to include grid system
 * @returns {String} - Formatted Claude prompt
 */
export const generateAcousticalPrompt = (blueprints, includeGridSystem = true) => {
  // Get RCP plan and legend blueprints
  const ceilingPlan = blueprints.find(bp => bp.type === 'ceiling_plan' || bp.type === 'rcp');
  const legend = blueprints.find(bp => bp.type === 'legend');
  
  // Base prompt structure
  let prompt = `I need you to analyze the legend and this acoustical ceiling drawing. I need an accurate material estimate and sqft of each.\n\n`;
  
  // Add specific instructions
  prompt += `Please analyze the reflected ceiling plan and material legend to determine acoustical ceiling requirements.\n`;
  prompt += `First, identify all ceiling material types from the legend (like ACP, ACT, GYP, etc.) and note their specific descriptions.\n`;
  prompt += `Then, measure and calculate the square footage of each ceiling type throughout the plan.\n`;
  prompt += `For each ceiling type, determine the appropriate unit size and calculate the quantity of materials needed.\n`;
  prompt += `Consider special areas like dining rooms, kitchens, restrooms, and vestibules that may have unique ceiling requirements.\n`;
  
  if (includeGridSystem) {
    prompt += `Include requirements for the appropriate ceiling grid system components for each ceiling type.\n`;
  }
  
  // Add reference to the uploaded blueprints
  prompt += `\nImage 1: ${ceilingPlan ? 'Reflected Ceiling Plan' : 'Blueprint'}\n`;
  if (legend) {
    prompt += `Image 2: Ceiling Legend and Material Specifications\n`;
  }
  
  return prompt;
};

/**
 * Parses Claude API response to extract ceiling sections, types and material requirements
 * @param {String} claudeResponse - Response text from Claude API
 * @returns {Object} - Structured data with ceiling sections and requirements
 */
export const parseClaudeResponse = (claudeResponse) => {
  // Initialize result structure
  const result = {
    ceilingSections: [],
    acousticalTypes: [],
    materialTypes: [],  // Array to hold detected ceiling material types from legend
    totalArea: 0,
    gridRequirements: [],
    includeGridSystem: false
  };
  
  try {
    // First, try to extract material types from legend information
    // Look for legend sections, material codes with descriptions
    const legendPatterns = [
      // Pattern looking for structured legend tables
      /\|\s*([A-Z0-9-]+)\s*\|\s*([^|]+)\s*\|/g,
      // Pattern for "CODE - Description" format
      /(?:^|\n)([A-Z0-9-]+)\s*[-:]\s*([^\n]+)/gm,
      // Pattern for "Description (CODE)" format
      /([^(]+)\s*\(([A-Z0-9-]+)\)/g
    ];
    
    // Try each pattern to find material types
    legendPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(claudeResponse)) !== null) {
        const code = match[1].trim();
        const description = match[2].trim();
        
        // Skip table headers and non-material codes
        if (!/^(CODE|TYPE|SYMBOL|MATERIAL)/i.test(code) && 
            !/^(DESCRIPTION)/i.test(description) &&
            code.length < 10) { // Reasonable length for a code
          
          // Check if this type is already added
          if (!result.materialTypes.some(t => t.code === code)) {
            result.materialTypes.push({
              code: code,
              description: description,
              // Infer unit size and cost based on common materials
              unitSize: inferUnitSize(code, description),
              unitCost: inferUnitCost(code, description)
            });
          }
        }
      }
    });
    
    // Extract ceiling sections using regex patterns
    const ceilingSectionPattern = /\|\s*([^|]+)\s*\|\s*([A-Z0-9-]{1,10})\s*\|\s*(\d+\.?\d*)\s*\|/g;
    let match;
    
    while ((match = ceilingSectionPattern.exec(claudeResponse)) !== null) {
      const name = match[1].trim();
      const type = match[2].trim();
      const area = parseFloat(match[3]);
      
      // Skip table headers
      if (!/AREA|SECTION|TYPE|DESCRIPTION/i.test(name) && area > 0) {
        result.ceilingSections.push({
          id: `claude-${result.ceilingSections.length + 1}`,
          name: name,
          type: type,
          area: area
        });
      }
    }
    
    // Extract acoustical types and totals
    const acousticalTypePattern = /\|\s*([A-Z0-9-]{1,10})\s*\|\s*([^|]+)\s*\|\s*(\d+,?\d*\.?\d*)\s*\|\s*(\d+)\s*\|/g;
    
    while ((match = acousticalTypePattern.exec(claudeResponse)) !== null) {
      const code = match[1].trim();
      const description = match[2].trim();
      const area = parseFloat(match[3].replace(',', ''));
      const units = parseInt(match[4]);
      
      // Skip table headers
      if (!/TYPE|CODE|DESCRIPTION/i.test(code) && area > 0) {
        result.acousticalTypes.push({
          type: code,
          description: description,
          totalArea: area,
          unitsRequired: units
        });
      }
    }
    
    // If we didn't find any acoustical types but have ceiling sections, derive the types
    if (result.acousticalTypes.length === 0 && result.ceilingSections.length > 0) {
      // Group sections by type
      const typeGroups = {};
      result.ceilingSections.forEach(section => {
        if (!typeGroups[section.type]) {
          typeGroups[section.type] = { area: 0, sections: [] };
        }
        typeGroups[section.type].area += section.area;
        typeGroups[section.type].sections.push(section);
      });
      
      // Create acoustical types from grouped sections
      Object.keys(typeGroups).forEach(typeCode => {
        const materialType = result.materialTypes.find(t => t.code === typeCode) || {
          code: typeCode,
          description: `Material type ${typeCode}`,
          unitSize: inferUnitSize(typeCode, '')
        };
        
        const totalArea = typeGroups[typeCode].area;
        const unitSize = materialType.unitSize || 4; // Default to 2x2 = 4 sq ft
        const unitsRequired = Math.ceil(totalArea * 1.1 / unitSize); // 10% waste
        
        result.acousticalTypes.push({
          type: typeCode,
          description: materialType.description,
          totalArea: totalArea,
          unitsRequired: unitsRequired
        });
      });
    }
    
    // Extract total area
    const totalAreaMatch = /Total (?:Ceiling )?Area:\s*(\d+,?\d*\.?\d*)\s*(?:sq ft|square feet)/i.exec(claudeResponse);
    if (totalAreaMatch) {
      result.totalArea = parseFloat(totalAreaMatch[1].replace(',', ''));
    } else {
      // Alternative pattern for finding total area
      const altTotalMatch = /GRAND TOTAL.*?(\d+,?\d*\.?\d*)\s*(?:sq ft|square feet)/i.exec(claudeResponse);
      if (altTotalMatch) {
        result.totalArea = parseFloat(altTotalMatch[1].replace(',', ''));
      } else {
        // If no total specified, sum the areas
        result.totalArea = result.ceilingSections.reduce((sum, section) => sum + section.area, 0);
      }
    }
    
    // Extract grid system requirements if present
    if (/Grid System Requirements|Suspension System|T-Bar Grid/i.test(claudeResponse)) {
      result.includeGridSystem = true;
      
      // Look for grid items in tables
      const gridItemPattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*([^|]+)\s*\|/g;
      
      while ((match = gridItemPattern.exec(claudeResponse)) !== null) {
        // Skip table headers
        if (!/Item|Description|Quantity|Unit/i.test(match[1])) {
          result.gridRequirements.push({
            itemName: match[1].trim(),
            description: match[2].trim(),
            quantity: parseInt(match[3]),
            unit: match[4].trim()
          });
        }
      }
      
      // Alternative pattern for grid items in lists
      const listItemPattern = /[-•]?\s*(.*?(?:Runners|Tees|Molding|Channels|Wire|Clips).*?):\s*(\d+)\s+(pieces|linear feet)/gi;
      
      while ((match = listItemPattern.exec(claudeResponse)) !== null) {
        result.gridRequirements.push({
          itemName: match[1].trim(),
          description: match[1].trim(),
          quantity: parseInt(match[2]),
          unit: match[3].trim().toLowerCase()
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return result;
  }
};

/**
 * Infer the unit size based on material type code and description
 * @param {String} code - Material type code
 * @param {String} description - Material description
 * @returns {Number} - Unit size in square feet
 */
const inferUnitSize = (code, description) => {
  const desc = description.toLowerCase();
  const codeUpper = code.toUpperCase();
  
  // Check for common material types
  if (codeUpper.includes('ACP') || desc.includes('2x4') || desc.includes('2\'x4\'') || desc.match(/2[\'"]?\s*x\s*4[\'"]?/)) {
    return 8; // 2'x4' = 8 sq ft
  } else if (codeUpper.includes('ACT') || desc.includes('2x2') || desc.includes('2\'x2\'') || desc.match(/2[\'"]?\s*x\s*2[\'"]?/)) {
    return 4; // 2'x2' = 4 sq ft
  } else if (codeUpper.includes('GYP') || desc.includes('gypsum') || desc.includes('drywall') || desc.includes('gyp')) {
    return 32; // 4'x8' = 32 sq ft
  } else if (codeUpper.includes('WOOD') || desc.includes('wood') || desc.includes('plank') || desc.includes('cypress')) {
    // Wood plank - estimate based on description
    if (desc.includes('6"') || desc.includes('6 inch')) {
      return 4; // 6" x 8' = 4 sq ft
    } else if (desc.includes('4"') || desc.includes('4 inch')) {
      return 2.67; // 4" x 8' = 2.67 sq ft
    } else {
      return 4; // Default wood plank size
    }
  } else {
    // Default to 2x2 ceiling tile as most common
    return 4;
  }
};

/**
 * Infer the unit cost based on material type code and description
 * @param {String} code - Material type code
 * @param {String} description - Material description
 * @returns {Number} - Unit cost per square foot
 */
const inferUnitCost = (code, description) => {
  const desc = description.toLowerCase();
  const codeUpper = code.toUpperCase();
  
  // Check for common material types and assign reasonable costs
  if (codeUpper.includes('ACP') || desc.includes('2x4') || desc.includes('acoustical panel')) {
    return 3.25; // $3.25 per sq ft for 2x4 acoustical panels
  } else if (codeUpper.includes('ACT') || desc.includes('2x2') || desc.includes('acoustical tile')) {
    return 3.75; // $3.75 per sq ft for 2x2 acoustical tiles
  } else if (codeUpper.includes('GYP') || desc.includes('gypsum') || desc.includes('drywall') || desc.includes('gyp')) {
    return 2.95; // $2.95 per sq ft for gypsum board
  } else if (codeUpper.includes('WOOD') || desc.includes('wood') || desc.includes('plank') || desc.includes('cypress')) {
    return 11.50; // $11.50 per sq ft for wood planks
  } else if (desc.includes('open') || desc.includes('exposed')) {
    return 0; // $0 per sq ft for open ceiling areas
  } else {
    // Default cost for unknown materials
    return 3.50; // $3.50 per sq ft
  }
};

/**
 * Format the result data for display in the UI
 * @param {Object} parsedData - Parsed data from Claude API
 * @returns {Object} - Formatted result object for the UI component
 */
export const formatResultData = (parsedData) => {
  // Create a mapping of ceiling types from the material types
  const ceilingTypesMap = {};
  
  // First use detected material types from legend
  if (parsedData.materialTypes && parsedData.materialTypes.length > 0) {
    parsedData.materialTypes.forEach(type => {
      ceilingTypesMap[type.code] = {
        code: type.code,
        name: type.description.split(' - ')[0] || type.description,
        description: type.description,
        unitCost: type.unitCost || inferUnitCost(type.code, type.description),
        standardSize: {
          width: Math.sqrt(type.unitSize || inferUnitSize(type.code, type.description)),
          height: Math.sqrt(type.unitSize || inferUnitSize(type.code, type.description))
        }
      };
    });
  }
  
  // Add any material types that appear in sections but weren't in the legend
  if (parsedData.ceilingSections && parsedData.ceilingSections.length > 0) {
    parsedData.ceilingSections.forEach(section => {
      if (!ceilingTypesMap[section.type]) {
        ceilingTypesMap[section.type] = {
          code: section.type,
          name: `Material ${section.type}`,
          description: `Material type ${section.type}`,
          unitCost: inferUnitCost(section.type, ''),
          standardSize: {
            width: Math.sqrt(inferUnitSize(section.type, '')),
            height: Math.sqrt(inferUnitSize(section.type, ''))
          }
        };
      }
    });
  }
  
  // If no ceiling types detected, use defaults
  if (Object.keys(ceilingTypesMap).length === 0) {
    const defaultTypes = [
      { code: 'ACP', name: '2x4 Acoustical Ceiling Panel', description: '2x4 Acoustical Ceiling Panel, Paint P-2', unitCost: 3.25 },
      { code: 'ACT', name: '2x2 Acoustical Ceiling Tile', description: '2x2 Acoustical Ceiling Tile (Washable)', unitCost: 3.75 },
      { code: 'GYP', name: 'Gypsum Board Ceiling', description: 'Gypsum Board Ceiling - See plan for paint color', unitCost: 2.95 },
      { code: 'WOOD', name: 'Wood Ceiling Planks', description: 'Wood Ceiling Planks', unitCost: 11.50 },
      { code: 'OPEN', name: 'Open Ceiling (No Material)', description: 'Open Ceiling Areas with Exposed Structure', unitCost: 0 }
    ];
    
    defaultTypes.forEach(type => {
      ceilingTypesMap[type.code] = {
        ...type,
        standardSize: {
          width: Math.sqrt(inferUnitSize(type.code, type.description)),
          height: Math.sqrt(inferUnitSize(type.code, type.description))
        }
      };
    });
  }
  
  // Calculate material costs for each section
  const sections = parsedData.ceilingSections.map(section => {
    const typeInfo = ceilingTypesMap[section.type] || { 
      code: section.type, 
      unitCost: inferUnitCost(section.type, '') 
    };
    
    return {
      ...section,
      materialCost: section.area * typeInfo.unitCost
    };
  });
  
  // Format type results
  const totalsByType = parsedData.acousticalTypes.map(type => {
    const typeInfo = ceilingTypesMap[type.type] || { 
      code: type.type, 
      description: type.description || `Material ${type.type}`,
      unitCost: inferUnitCost(type.type, type.description || '') 
    };
    
    return {
      type: type.type,
      description: type.description || typeInfo.description,
      totalArea: type.totalArea,
      unitsRequired: type.unitsRequired,
      materialCost: type.totalArea * typeInfo.unitCost
    };
  });
  
  // Return formatted result object
  return {
    sections,
    totalsByType,
    totalArea: parsedData.totalArea,
    gridRequirements: parsedData.gridRequirements,
    materialTypes: Object.values(ceilingTypesMap),
    wasteFactor: 10, // Default value
    timestamp: Date.now()
  };
};

/**
 * Validates ceiling section inputs before calculation
 * @param {Array} ceilingSections - Ceiling section objects
 * @returns {Object} - Validation result with isValid flag and errors
 */
export const validateCeilingSections = (ceilingSections) => {
  const result = {
    isValid: true,
    errors: []
  };
  
  // Check if there are any ceiling sections
  if (!ceilingSections || ceilingSections.length === 0) {
    result.isValid = false;
    result.errors.push('No ceiling sections provided');
    return result;
  }
  
  // Validate each ceiling section
  ceilingSections.forEach((section, index) => {
    if (!section.name || section.name.trim() === '') {
      result.isValid = false;
      result.errors.push(`Ceiling section #${index + 1} is missing a name`);
    }
    
    if (!section.type || section.type.trim() === '') {
      result.isValid = false;
      result.errors.push(`Ceiling section "${section.name || `#${index + 1}`}" is missing a material type`);
    }
    
    if (!section.area || section.area <= 0) {
      result.isValid = false;
      result.errors.push(`Ceiling section "${section.name || `#${index + 1}`}" has an invalid area`);
    }
  });
  
  return result;
};

// Export all functions as a module
export default {
  analyzeAcousticalCeiling,
  saveProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  exportProject,
  generateAcousticalPrompt,
  parseClaudeResponse,
  validateCeilingSections,
  formatResultData
};
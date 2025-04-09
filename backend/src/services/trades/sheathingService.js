// src/services/sheathingAnalyzer.js

import axios from 'axios';
import { toast } from 'react-toastify';

// API endpoints
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const CLAUDE_ENDPOINT = `${API_BASE_URL}/claude/analyze`;
const PROJECTS_ENDPOINT = `${API_BASE_URL}/projects`;

/**
 * Analyzes uploaded blueprint images using Claude API
 * @param {Array} blueprintFiles - Array of blueprint file objects
 * @param {String} tradeType - Type of trade analysis (e.g., 'sheathing')
 * @returns {Promise} - Promise with analysis results
 */
export const analyzeBlueprints = async (blueprintFiles, tradeType = 'sheathing') => {
  try {
    // Create form data with blueprint images
    const formData = new FormData();
    
    // Add each blueprint file
    blueprintFiles.forEach((blueprint, index) => {
      formData.append(`blueprint_${index}`, blueprint.file);
      formData.append(`blueprint_${index}_type`, blueprint.type);
    });
    
    // Add analysis parameters
    formData.append('trade', tradeType);
    formData.append('analysis_type', 'material_takeoff');
    
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
 * Saves a sheathing analysis project to the database
 * @param {Object} projectData - Project data including analysis results
 * @returns {Promise} - Promise with saved project data
 */
export const saveProject = async (projectData) => {
  try {
    const response = await axios.post(PROJECTS_ENDPOINT, projectData, {
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
 * Gets a list of saved projects for the current user
 * @param {Object} filters - Optional filters like date range, project type
 * @returns {Promise} - Promise with list of projects
 */
export const getProjects = async (filters = {}) => {
  try {
    const response = await axios.get(PROJECTS_ENDPOINT, {
      params: filters,
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
 * Gets a specific project by ID
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
 * Updates an existing project
 * @param {String} projectId - Project ID
 * @param {Object} updateData - Updated project data
 * @returns {Promise} - Promise with updated project data
 */
export const updateProject = async (projectId, updateData) => {
  try {
    const response = await axios.put(`${PROJECTS_ENDPOINT}/${projectId}`, updateData, {
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
 * Deletes a project
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
 * Exports project data to a specific format
 * @param {String} projectId - Project ID
 * @param {String} format - Export format ('pdf', 'csv', 'excel')
 * @returns {Promise} - Promise with export URL or blob
 */
export const exportProject = async (projectId, format = 'pdf') => {
  try {
    const response = await axios.get(`${PROJECTS_ENDPOINT}/${projectId}/export`, {
      params: { format },
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
 * Generates prompts for Claude API based on blueprint types and trade
 * @param {Array} blueprints - Blueprint file objects
 * @param {String} trade - Trade type ('sheathing', 'electrical', etc.)
 * @returns {String} - Formatted Claude prompt
 */
export const generateTradePrompt = (blueprints, trade) => {
  // Get floor plan and legend blueprints
  const floorPlan = blueprints.find(bp => bp.type === 'floorplan');
  const legend = blueprints.find(bp => bp.type === 'legend');
  
  // Base prompt structure
  let prompt = `I need you to analyze these blueprint images for a ${trade} material takeoff.\n\n`;
  
  // Add specific instructions based on trade
  if (trade === 'sheathing') {
    prompt += `Please analyze the floor plan and wall legend to determine wall sheathing requirements.\n`;
    prompt += `Identify different wall types and their corresponding sheathing materials.\n`;
    prompt += `For each wall section, determine the linear footage and calculate the required sheathing area.\n`;
    prompt += `Include any special requirements for areas like freezers, coolers, restrooms, etc.\n`;
    prompt += `Calculate total square footage and number of sheets required for each type of sheathing material.\n`;
  }
  
  // Add reference to the uploaded blueprints
  prompt += `\nImage 1: ${floorPlan ? 'Floor Plan' : 'Blueprint'}\n`;
  if (legend) {
    prompt += `Image 2: Wall Legend and Details\n`;
  }
  
  return prompt;
};

/**
 * Parses Claude API response to extract wall sections and sheathing requirements
 * @param {String} claudeResponse - Response text from Claude API
 * @returns {Object} - Structured data with wall sections and requirements
 */
export const parseClaudeResponse = (claudeResponse) => {
  // Initialize result structure
  const result = {
    wallSections: [],
    sheathingTypes: [],
    totalArea: 0,
    totalSheets: 0,
    additionalRequirements: []
  };
  
  try {
    // Extract wall sections using regex patterns
    const wallSectionPattern = /\|\s*([^|]+)\s*\|\s*([^|]{1,2})\s*\|\s*(\d+\.?\d*)\s*\|\s*(\d+\.?\d*)\s*\|\s*(\d+\.?\d*)\s*\|/g;
    let match;
    
    while ((match = wallSectionPattern.exec(claudeResponse)) !== null) {
      result.wallSections.push({
        id: `claude-${result.wallSections.length + 1}`,
        name: match[1].trim(),
        type: match[2].trim(),
        length: parseFloat(match[3]),
        height: parseFloat(match[4]),
        area: parseFloat(match[5])
      });
    }
    
    // Extract sheathing types and totals
    const sheathingTypePattern = /\|\s*([^|]{1,2})\s*\|\s*([^|]+)\s*\|\s*(\d+,?\d*\.?\d*)\s*\|\s*(\d+)\s*\|/g;
    
    while ((match = sheathingTypePattern.exec(claudeResponse)) !== null) {
      result.sheathingTypes.push({
        type: match[1].trim(),
        description: match[2].trim(),
        totalArea: parseFloat(match[3].replace(',', '')),
        sheetsRequired: parseInt(match[4])
      });
    }
    
    // Extract total area
    const totalAreaMatch = /GRAND TOTAL:\s*(\d+,?\d*\.?\d*)\s*square feet/i.exec(claudeResponse);
    if (totalAreaMatch) {
      result.totalArea = parseFloat(totalAreaMatch[1].replace(',', ''));
    }
    
    // Extract additional requirements
    const cementBoardMatch = /Total linear feet requiring base cement board:\s*(\d+,?\d*\.?\d*)\s*ft/i.exec(claudeResponse);
    if (cementBoardMatch) {
      result.additionalRequirements.push({
        type: 'Cement Board Base',
        linearFeet: parseFloat(cementBoardMatch[1].replace(',', '')),
        areaNeeded: 0,
        sheetsRequired: 0
      });
      
      // Try to extract area needed
      const areaMatch = /Required 8" wide cement board:\s*(\d+,?\d*\.?\d*)\s*sq ft/i.exec(claudeResponse);
      if (areaMatch) {
        result.additionalRequirements[0].areaNeeded = parseFloat(areaMatch[1].replace(',', ''));
      }
      
      // Try to extract sheets required
      const sheetsMatch = /Cement board sheets required \(4'×8'\):\s*(\d+)/i.exec(claudeResponse);
      if (sheetsMatch) {
        result.additionalRequirements[0].sheetsRequired = parseInt(sheetsMatch[1]);
      }
    }
    
    // Calculate total sheets
    result.totalSheets = result.sheathingTypes.reduce((sum, type) => sum + type.sheetsRequired, 0);
    
    return result;
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return result;
  }
};

/**
 * Validates wall section inputs before calculation
 * @param {Array} wallSections - Wall section objects
 * @returns {Object} - Validation result with isValid flag and errors
 */
export const validateWallSections = (wallSections) => {
  const result = {
    isValid: true,
    errors: []
  };
  
  // Check if there are any wall sections
  if (!wallSections || wallSections.length === 0) {
    result.isValid = false;
    result.errors.push('No wall sections provided');
    return result;
  }
  
  // Validate each wall section
  wallSections.forEach((section, index) => {
    if (!section.name || section.name.trim() === '') {
      result.isValid = false;
      result.errors.push(`Wall section #${index + 1} is missing a name`);
    }
    
    if (!section.type || section.type.trim() === '') {
      result.isValid = false;
      result.errors.push(`Wall section "${section.name || `#${index + 1}`}" is missing a sheathing type`);
    }
    
    if (!section.length || section.length <= 0) {
      result.isValid = false;
      result.errors.push(`Wall section "${section.name || `#${index + 1}`}" has an invalid length`);
    }
    
    if (!section.height || section.height <= 0) {
      result.isValid = false;
      result.errors.push(`Wall section "${section.name || `#${index + 1}`}" has an invalid height`);
    }
  });
  
  return result;
};

// Export all functions as a module
export default {
  analyzeBlueprints,
  saveProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  exportProject,
  generateTradePrompt,
  parseClaudeResponse,
  validateWallSections
};
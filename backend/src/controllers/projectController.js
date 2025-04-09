/**
 * @file projectController.js
 * Controller for project-related operations
 */
const Project = require('../models/Project');
const { analyzeBlueprintsWithClaude } = require('../services/claudeService');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Upload directory for blueprint images
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Create a new project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createProject = async (req, res) => {
  try {
    const { userId, title, description, trade, projectType } = req.body;
    
    // Validate required fields
    if (!userId || !title || !trade) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields (userId, title, trade)' 
      });
    }

    // Create new project
    const project = new Project({
      userId,
      title,
      description,
      trade,
      projectType,
      blueprints: [],
      analysisResults: []
    });

    // Save project to database
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      projectId: project._id,
      project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create project',
      error: error.message
    });
  }
};

/**
 * Upload blueprints to a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadBlueprints = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { pageTypes } = req.body; // Optional mapping of file index to page type
    
    // Validate project ID
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required' 
      });
    }
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Process each uploaded file
    const blueprintPromises = req.files.map(async (file, index) => {
      // Create unique filename
      const filename = `${uuidv4()}-${file.originalname.replace(/\s+/g, '_')}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      
      // Determine page type
      let pageType = 'other';
      if (pageTypes && pageTypes[index]) {
        pageType = pageTypes[index];
      }
      
      // Save file to disk
      await fs.promises.writeFile(filePath, file.buffer);
      
      // Create blueprint object
      return {
        name: filename,
        originalName: file.originalname,
        path: filePath,
        url: `/uploads/${filename}`,
        contentType: file.mimetype,
        size: file.size,
        pageType,
        uploadDate: new Date()
      };
    });

    // Wait for all files to be processed
    const blueprintObjects = await Promise.all(blueprintPromises);
    
    // Add blueprints to project
    project.blueprints.push(...blueprintObjects);
    
    // Save updated project
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Blueprints uploaded successfully',
      blueprints: blueprintObjects
    });
  } catch (error) {
    console.error('Error uploading blueprints:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload blueprints',
      error: error.message
    });
  }
};

/**
 * Analyze blueprints for a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.analyzeBlueprints = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { analysisLevel = 'takeoff' } = req.body;
    
    // Validate project ID
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required' 
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Check if project has blueprints
    if (!project.blueprints || project.blueprints.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project has no blueprints to analyze' 
      });
    }

    // Prepare files for Claude analysis
    const files = project.blueprints.map(blueprint => ({
      buffer: fs.readFileSync(blueprint.path),
      originalname: blueprint.originalName,
      mimetype: blueprint.contentType
    }));

    // Create initial analysis result entry
    const analysisResult = {
      trade: project.trade,
      analysisLevel,
      status: 'processing',
      analysisDate: new Date()
    };
    
    // Add analysis to project
    project.analysisResults.push(analysisResult);
    await project.save();
    
    // Get the ID of the new analysis result
    const analysisId = project.analysisResults[project.analysisResults.length - 1]._id;

    // Start analysis asynchronously and send initial response
    res.status(202).json({
      success: true,
      message: 'Analysis started',
      analysisId,
      status: 'processing'
    });

    // Perform analysis with Claude
    try {
      const analysisOptions = {
        trade: project.trade,
        analysisLevel,
        projectType: project.projectType,
        projectId
      };
      
      const analysisResults = await analyzeBlueprintsWithClaude(files, analysisOptions);
      
      // Update analysis results in database
      await Project.updateOne(
        { "_id": projectId, "analysisResults._id": analysisId },
        { 
          "$set": { 
            "analysisResults.$.materials": analysisResults.materials,
            "analysisResults.$.labor": analysisResults.labor,
            "analysisResults.$.totalMaterialCost": analysisResults.totalMaterialCost,
            "analysisResults.$.totalLaborCost": analysisResults.totalLaborCost,
            "analysisResults.$.totalCost": analysisResults.totalCost,
            "analysisResults.$.notes": analysisResults.notes,
            "analysisResults.$.rawResponse": analysisResults.rawResponse,
            "analysisResults.$.status": "completed",
            "analysisResults.$.analysisDate": new Date()
          }
        }
      );
      
      console.log(`Analysis completed for project ${projectId}`);
    } catch (analysisError) {
      console.error('Error during blueprint analysis:', analysisError);
      
      // Update analysis status to failed
      await Project.updateOne(
        { "_id": projectId, "analysisResults._id": analysisId },
        { 
          "$set": { 
            "analysisResults.$.status": "failed",
            "analysisResults.$.errorMessage": analysisError.message
          }
        }
      );
    }
  } catch (error) {
    console.error('Error analyzing blueprints:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to analyze blueprints',
      error: error.message
    });
  }
};

/**
 * Get analysis results by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAnalysisResults = async (req, res) => {
  try {
    const { projectId, analysisId } = req.params;
    
    // Validate parameters
    if (!projectId || !analysisId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID and Analysis ID are required' 
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Find analysis result
    const analysis = project.analysisResults.id(analysisId);
    if (!analysis) {
      return res.status(404).json({ 
        success: false, 
        message: 'Analysis not found' 
      });
    }

    res.status(200).json({
      success: true,
      analysis,
      project: {
        _id: project._id,
        title: project.title,
        trade: project.trade,
        blueprintCount: project.blueprints.length
      }
    });
  } catch (error) {
    console.error('Error getting analysis results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get analysis results',
      error: error.message
    });
  }
};

/**
 * Get all projects for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, skip = 0 } = req.query;
    
    // Validate user ID
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Find projects
    const projects = await Project.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .select('-blueprints -analysisResults.rawResponse'); // Exclude large fields
    
    // Count total projects
    const totalProjects = await Project.countDocuments({ userId });

    res.status(200).json({
      success: true,
      projects,
      pagination: {
        total: totalProjects,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: totalProjects > (parseInt(skip) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting user projects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user projects',
      error: error.message
    });
  }
};

/**
 * Get a project by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required' 
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Remove raw response data to reduce payload size
    if (project.analysisResults) {
      project.analysisResults.forEach(result => {
        if (result.rawResponse) {
          result.rawResponse = '[Raw response omitted]';
        }
      });
    }

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get project',
      error: error.message
    });
  }
};

/**
 * Update a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, trade, projectType, status, clientInfo } = req.body;
    
    // Validate project ID
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required' 
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Update fields if provided
    if (title) project.title = title;
    if (description) project.description = description;
    if (trade) project.trade = trade;
    if (projectType) project.projectType = projectType;
    if (status) project.status = status;
    
    // Update client info if provided
    if (clientInfo) {
      project.clientInfo = {
        ...project.clientInfo,
        ...clientInfo
      };
    }

    // Save updated project
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
        trade: project.trade,
        projectType: project.projectType,
        status: project.status,
        clientInfo: project.clientInfo,
        updatedAt: project.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update project',
      error: error.message
    });
  }
};

/**
 * Delete a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID is required' 
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Delete blueprint files
    for (const blueprint of project.blueprints) {
      try {
        if (fs.existsSync(blueprint.path)) {
          await fs.promises.unlink(blueprint.path);
        }
      } catch (fileError) {
        console.warn(`Failed to delete file ${blueprint.path}:`, fileError);
      }
    }

    // Delete project from database
    await Project.findByIdAndDelete(projectId);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete project',
      error: error.message
    });
  }
};

/**
 * Delete a blueprint from a project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteBlueprint = async (req, res) => {
  try {
    const { projectId, blueprintId } = req.params;
    
    // Validate parameters
    if (!projectId || !blueprintId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID and Blueprint ID are required' 
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Find blueprint
    const blueprint = project.blueprints.id(blueprintId);
    if (!blueprint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blueprint not found' 
      });
    }

    // Delete file from disk
    try {
      if (fs.existsSync(blueprint.path)) {
        await fs.promises.unlink(blueprint.path);
      }
    } catch (fileError) {
      console.warn(`Failed to delete file ${blueprint.path}:`, fileError);
    }

    // Remove blueprint from project
    project.blueprints.pull(blueprintId);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Blueprint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blueprint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete blueprint',
      error: error.message
    });
  }
};

/**
 * Get blueprint image file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBlueprintImage = async (req, res) => {
  try {
    const { projectId, blueprintId } = req.params;
    
    // Validate parameters
    if (!projectId || !blueprintId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project ID and Blueprint ID are required' 
      });
    }

    // Find project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Find blueprint
    const blueprint = project.blueprints.id(blueprintId);
    if (!blueprint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blueprint not found' 
      });
    }

    // Check if file exists
    if (!fs.existsSync(blueprint.path)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blueprint file not found' 
      });
    }

    // Send file
    res.setHeader('Content-Type', blueprint.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${blueprint.originalName}"`);
    fs.createReadStream(blueprint.path).pipe(res);
  } catch (error) {
    console.error('Error getting blueprint image:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get blueprint image',
      error: error.message
    });
  }
};
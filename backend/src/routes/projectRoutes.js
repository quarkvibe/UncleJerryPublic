/**
 * @file projectRoutes.js
 * Project management and blueprint analysis routes
 */
const express = require('express');
const multer = require('multer');
const projectController = require('../controllers/projectController');
const { auth, contractor } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB file size limit
  }
});

/**
 * @route POST /api/projects
 * @desc Create a new project
 * @access Private
 */
router.post('/', contractor, projectController.createProject);

/**
 * @route GET /api/projects/user/:userId
 * @desc Get all projects for a user
 * @access Private
 */
router.get('/user/:userId', contractor, projectController.getUserProjects);

/**
 * @route GET /api/projects/:projectId
 * @desc Get a project by ID
 * @access Private
 */
router.get('/:projectId', contractor, projectController.getProject);

/**
 * @route PUT /api/projects/:projectId
 * @desc Update a project
 * @access Private
 */
router.put('/:projectId', contractor, projectController.updateProject);

/**
 * @route DELETE /api/projects/:projectId
 * @desc Delete a project
 * @access Private
 */
router.delete('/:projectId', contractor, projectController.deleteProject);

/**
 * @route POST /api/projects/:projectId/blueprints
 * @desc Upload blueprints to a project
 * @access Private
 */
router.post(
  '/:projectId/blueprints',
  contractor,
  upload.array('blueprints', 10), // Max 10 files
  projectController.uploadBlueprints
);

/**
 * @route DELETE /api/projects/:projectId/blueprints/:blueprintId
 * @desc Delete a blueprint from a project
 * @access Private
 */
router.delete(
  '/:projectId/blueprints/:blueprintId',
  contractor,
  projectController.deleteBlueprint
);

/**
 * @route GET /api/projects/:projectId/blueprints/:blueprintId/image
 * @desc Get blueprint image file
 * @access Private
 */
router.get(
  '/:projectId/blueprints/:blueprintId/image',
  contractor,
  projectController.getBlueprintImage
);

/**
 * @route POST /api/projects/:projectId/analyze
 * @desc Analyze blueprints for a project
 * @access Private
 */
router.post(
  '/:projectId/analyze',
  contractor,
  projectController.analyzeBlueprints
);

/**
 * @route GET /api/projects/:projectId/analysis/:analysisId
 * @desc Get analysis results by ID
 * @access Private
 */
router.get(
  '/:projectId/analysis/:analysisId',
  contractor,
  projectController.getAnalysisResults
);

module.exports = router;
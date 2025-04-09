const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { Anthropic } = require('@anthropic/sdk');
const PDFDocument = require('pdfkit');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// MongoDB Models
const Blueprint = require('../models/blueprint');
const Project = require('../models/project');
const Analysis = require('../models/analysis');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDFs, PNGs, and JPGs
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PNG, and JPG are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to detect blueprint type
const detectBlueprintType = (filename) => {
  const lowercaseName = filename.toLowerCase();
  
  if (lowercaseName.includes('demolition')) return 'demolition';
  if (lowercaseName.includes('floor') && lowercaseName.includes('plan')) return 'floorplan';
  if (lowercaseName.includes('notes') || lowercaseName.includes('scope')) return 'notes';
  
  return 'other';
};

// Blueprint Upload Endpoint
router.post('/blueprints/upload', upload.array('blueprints', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    // Create a new project or use existing one (could be based on user session)
    let project = await Project.findOne({ 
      userId: req.user.id, 
      status: 'in-progress' 
    });

    if (!project) {
      project = new Project({
        name: 'Demolition Project', // Default name, can be updated later
        userId: req.user.id,
        status: 'in-progress',
        createdAt: new Date()
      });
      await project.save();
    }

    // Process each uploaded file
    const blueprintData = [];
    for (const file of req.files) {
      const blueprint = new Blueprint({
        projectId: project._id,
        name: file.originalname,
        path: file.path,
        type: detectBlueprintType(file.originalname),
        fileSize: file.size,
        uploadedAt: new Date()
      });
      
      await blueprint.save();
      
      blueprintData.push({
        id: blueprint._id,
        name: blueprint.name,
        url: `/api/blueprints/${blueprint._id}`,
        type: blueprint.type
      });
    }

    res.status(200).json({ 
      success: true, 
      projectId: project._id,
      blueprints: blueprintData
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload blueprints.' });
  }
});

// Blueprint Access Endpoint
router.get('/blueprints/:id', async (req, res) => {
  try {
    const blueprint = await Blueprint.findById(req.params.id);
    
    if (!blueprint) {
      return res.status(404).json({ error: 'Blueprint not found.' });
    }
    
    // Security check - make sure the user has access to this blueprint
    const project = await Project.findById(blueprint.projectId);
    if (project.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to blueprint.' });
    }
    
    // Send the file
    res.sendFile(blueprint.path);
  } catch (error) {
    console.error('Blueprint access error:', error);
    res.status(500).json({ error: 'Failed to access blueprint.' });
  }
});

// Demolition Analysis Endpoint
router.post('/analysis/demolition', async (req, res) => {
  try {
    const { blueprints, analysisType } = req.body;
    
    if (!blueprints || blueprints.length === 0) {
      return res.status(400).json({ error: 'No blueprints provided for analysis.' });
    }
    
    // Find the project
    const blueprint = await Blueprint.findById(blueprints[0].id);
    if (!blueprint) {
      return res.status(404).json({ error: 'Blueprint not found.' });
    }
    
    const project = await Project.findById(blueprint.projectId);
    
    // Fetch the blueprint files
    const blueprintFiles = [];
    for (const bp of blueprints) {
      const blueprint = await Blueprint.findById(bp.id);
      if (blueprint) {
        // Read file content as base64
        const fileContent = fs.readFileSync(blueprint.path, { encoding: 'base64' });
        blueprintFiles.push({
          id: blueprint._id.toString(),
          name: blueprint.name,
          type: blueprint.type,
          content: fileContent
        });
      }
    }
    
    // Prepare the prompt for Claude
    const prompt = createDemolitionAnalysisPrompt(blueprintFiles, analysisType);
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      system: "You are an expert construction estimator specializing in blueprint analysis and demolition cost estimation. You can accurately identify demolition scope, quantify materials, and estimate labor and equipment needs from construction blueprints.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    // Parse the Claude response
    const analysisResult = parseDemolitionAnalysisResponse(response.content[0].text);
    
    // Save the analysis to database
    const analysis = new Analysis({
      projectId: project._id,
      type: 'demolition',
      analysisType: analysisType,
      results: analysisResult,
      createdAt: new Date()
    });
    
    await analysis.save();
    
    // Return the analysis results
    res.status(200).json({
      success: true,
      analysisId: analysis._id,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze blueprints.' });
  }
});

// PDF Export Endpoint
router.post('/export/pdf', async (req, res) => {
  try {
    const { analysis } = req.body;
    
    if (!analysis) {
      return res.status(400).json({ error: 'No analysis data provided for export.' });
    }
    
    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${analysis.projectName.replace(/\s+/g, '_')}_demolition_estimate.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Generate PDF content
    generateDemolitionPDF(doc, analysis);
    
    // Finalize the PDF and end the stream
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});

// Helper function to create a prompt for Claude
function createDemolitionAnalysisPrompt(blueprintFiles, analysisType) {
  // Basic prompt structure
  let prompt = `Please analyze the following demolition blueprints and provide a detailed estimate. `;
  
  switch (analysisType) {
    case 'materials':
      prompt += 'Focus only on identifying and quantifying materials to be demolished.';
      break;
    case 'costs':
      prompt += 'Provide material quantities along with estimated costs.';
      break;
    case 'full':
      prompt += 'Provide a full estimate including materials, costs, labor hours, equipment needs, and overall project timeline.';
      break;
    default:
      prompt += 'Provide a comprehensive analysis.';
  }
  
  prompt += `\n\nPlease structure your response as a JSON object with the following structure (using null for any fields you can't determine):
  {
    "projectName": "Project name derived from blueprints",
    "drawingReference": "Reference number or identifier from blueprints",
    "totalSquareFootage": numeric_value,
    "scopeSummary": ["Item 1", "Item 2", ...],
    "materials": [
      { 
        "description": "Description", 
        "quantity": numeric_value, 
        "unit": "unit of measurement", 
        "unitRate": numeric_value, 
        "laborHours": numeric_value, 
        "cost": numeric_value 
      },
      ...
    ],
    "equipment": [
      { 
        "description": "Equipment description", 
        "duration": numeric_value, 
        "dailyRate": numeric_value, 
        "totalCost": numeric_value 
      },
      ...
    ],
    "labor": [
      { 
        "category": "Labor category", 
        "hours": numeric_value, 
        "rate": numeric_value, 
        "totalCost": numeric_value 
      },
      ...
    ],
    "specialConsiderations": ["Consideration 1", "Consideration 2", ...],
    "timeline": {
      "duration": numeric_value,
      "crewSize": numeric_value
    },
    "costSummary": {
      "materials": numeric_value,
      "equipment": numeric_value,
      "labor": numeric_value,
      "subtotal": numeric_value,
      "generalConditions": numeric_value,
      "overheadProfit": numeric_value,
      "contingency": numeric_value,
      "total": numeric_value
    }
  }
  
  Only include the JSON in your response, with no additional text.`;
  
  // Add information about the blueprint files
  prompt += '\n\nHere are the blueprint files as base64 encoded images. Each file is prefixed with information about its type:';
  
  blueprintFiles.forEach((file, index) => {
    prompt += `\n\nBlueprint ${index + 1}:`;
    prompt += `\nName: ${file.name}`;
    prompt += `\nType: ${file.type}`;
    prompt += `\nContent: data:${file.type === 'pdf' ? 'application/pdf' : 'image/jpeg'};base64,${file.content}`;
  });
  
  return prompt;
}

// Helper function to parse Claude's response
function parseDemolitionAnalysisResponse(response) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/```json\n([\s\S]*)\n```/) || 
                     response.match(/```\n([\s\S]*)\n```/) || 
                     response.match(/{[\s\S]*}/);
    
    let parsedResponse;
    
    if (jsonMatch) {
      parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } else {
      // If Claude didn't return valid JSON, attempt to parse the entire response
      parsedResponse = JSON.parse(response);
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    
    // Fallback to a simplified structure with error message
    return {
      projectName: "Demolition Project",
      drawingReference: "N/A",
      totalSquareFootage: 0,
      scopeSummary: ["Analysis failed to parse correctly"],
      materials: [],
      equipment: [],
      labor: [],
      specialConsiderations: [`Error during analysis: ${error.message}`],
      timeline: {
        duration: 0,
        crewSize: 0
      },
      costSummary: {
        materials: 0,
        equipment: 0,
        labor: 0,
        subtotal: 0,
        generalConditions: 0,
        overheadProfit: 0,
        contingency: 0,
        total: 0
      }
    };
  }
}

// Helper function to generate a PDF document
function generateDemolitionPDF(doc, analysis) {
  // Add company logo (if available)
  // doc.image('path/to/logo.png', 50, 45, { width: 150 });
  
  // Add title
  doc.fontSize(18).font('Helvetica-Bold').text('DEMOLITION ESTIMATE', { align: 'center' });
  doc.moveDown();
  
  // Add project information
  doc.fontSize(12).font('Helvetica-Bold').text('PROJECT INFORMATION');
  doc.fontSize(10).font('Helvetica')
    .text(`Project Name: ${analysis.projectName}`)
    .text(`Drawing Reference: ${analysis.drawingReference}`)
    .text(`Total Square Footage: ${analysis.totalSquareFootage} sq ft`)
    .text(`Prepared Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  
  // Add scope summary
  doc.fontSize(12).font('Helvetica-Bold').text('SCOPE SUMMARY');
  doc.fontSize(10).font('Helvetica');
  analysis.scopeSummary.forEach(item => {
    doc.text(`• ${item}`);
  });
  doc.moveDown();
  
  // Add materials table
  doc.fontSize(12).font('Helvetica-Bold').text('MATERIALS & QUANTITIES');
  doc.moveDown(0.5);
  
  // Define the table structure
  const tableTop = doc.y;
  const itemX = 50;
  const quantityX = 280;
  const unitX = 330;
  const rateX = 380;
  const hoursX = 430;
  const costX = 500;
  
  // Add table headers
  doc.fontSize(9).font('Helvetica-Bold')
    .text('ITEM DESCRIPTION', itemX, tableTop)
    .text('QTY', quantityX, tableTop, { width: 40, align: 'right' })
    .text('UNIT', unitX, tableTop)
    .text('RATE', rateX, tableTop, { width: 40, align: 'right' })
    .text('HOURS', hoursX, tableTop, { width: 40, align: 'right' })
    .text('COST', costX, tableTop, { width: 40, align: 'right' });
  
  doc.moveDown();
  let y = doc.y;
  
  // Add table lines
  doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();
  
  // Add table content
  doc.fontSize(9).font('Helvetica');
  
  analysis.materials.forEach((material, i) => {
    // Check if we need a new page
    if (doc.y > 700) {
      doc.addPage();
      y = 50;
      doc.y = y;
    }
    
    y = doc.y;
    doc.text(material.description, itemX, y, { width: 220 });
    doc.text(material.quantity.toString(), quantityX, y, { width: 40, align: 'right' });
    doc.text(material.unit, unitX, y);
    doc.text(`$${material.unitRate.toFixed(2)}`, rateX, y, { width: 40, align: 'right' });
    doc.text(material.laborHours.toString(), hoursX, y, { width: 40, align: 'right' });
    doc.text(`$${material.cost.toFixed(2)}`, costX, y, { width: 40, align: 'right' });
    
    // Move to next item position
    const textHeight = Math.max(
      doc.heightOfString(material.description, { width: 220 }),
      doc.heightOfString(material.quantity.toString(), { width: 40 })
    );
    doc.moveDown(textHeight / 20 + 0.5);
  });
  
  // Add material total
  y = doc.y + 5;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;
  doc.fontSize(9).font('Helvetica-Bold')
    .text('MATERIALS SUBTOTAL:', 350, y)
    .text(`$${analysis.costSummary.materials.toFixed(2)}`, costX, y, { width: 40, align: 'right' });
  
  doc.moveDown(2);
  
  // If this is a full estimate, add equipment and labor
  if (analysis.equipment && analysis.equipment.length > 0) {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }
    
    // Add equipment table
    doc.fontSize(12).font('Helvetica-Bold').text('EQUIPMENT REQUIREMENTS');
    doc.moveDown(0.5);
    
    // Define the equipment table structure
    const eqTableTop = doc.y;
    const eqDescX = 50;
    const durationX = 300;
    const rateX = 380;
    const eqCostX = 500;
    
    // Add table headers
    doc.fontSize(9).font('Helvetica-Bold')
      .text('EQUIPMENT', eqDescX, eqTableTop)
      .text('DAYS', durationX, eqTableTop, { width: 40, align: 'right' })
      .text('RATE', rateX, eqTableTop, { width: 40, align: 'right' })
      .text('TOTAL', eqCostX, eqTableTop, { width: 40, align: 'right' });
    
    doc.moveDown();
    y = doc.y;
    
    // Add table lines
    doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();
    
    // Add equipment content
    doc.fontSize(9).font('Helvetica');
    
    analysis.equipment.forEach(equipment => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        y = 50;
        doc.y = y;
      }
      
      y = doc.y;
      doc.text(equipment.description, eqDescX, y, { width: 240 });
      doc.text(equipment.duration.toString(), durationX, y, { width: 40, align: 'right' });
      doc.text(`$${equipment.dailyRate.toFixed(2)}`, rateX, y, { width: 40, align: 'right' });
      doc.text(`$${equipment.totalCost.toFixed(2)}`, eqCostX, y, { width: 40, align: 'right' });
      
      // Move to next item position
      doc.moveDown();
    });
    
    // Add equipment total
    y = doc.y + 5;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    doc.fontSize(9).font('Helvetica-Bold')
      .text('EQUIPMENT SUBTOTAL:', 350, y)
      .text(`$${analysis.costSummary.equipment.toFixed(2)}`, eqCostX, y, { width: 40, align: 'right' });
    
    doc.moveDown(2);
  }
  
  if (analysis.labor && analysis.labor.length > 0) {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }
    
    // Add labor table
    doc.fontSize(12).font('Helvetica-Bold').text('LABOR BREAKDOWN');
    doc.moveDown(0.5);
    
    // Define the labor table structure
    const laborTableTop = doc.y;
    const categoryX = 50;
    const hoursX = 300;
    const rateX = 380;
    const laborCostX = 500;
    
    // Add table headers
    doc.fontSize(9).font('Helvetica-Bold')
      .text('CATEGORY', categoryX, laborTableTop)
      .text('HOURS', hoursX, laborTableTop, { width: 40, align: 'right' })
      .text('RATE', rateX, laborTableTop, { width: 40, align: 'right' })
      .text('TOTAL', laborCostX, laborTableTop, { width: 40, align: 'right' });
    
    doc.moveDown();
    y = doc.y;
    
    // Add table lines
    doc.moveTo(50, y - 5).lineTo(550, y - 5).stroke();
    
    // Add labor content
    doc.fontSize(9).font('Helvetica');
    
    analysis.labor.forEach(labor => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
        y = 50;
        doc.y = y;
      }
      
      y = doc.y;
      doc.text(labor.category, categoryX, y, { width: 240 });
      doc.text(labor.hours.toString(), hoursX, y, { width: 40, align: 'right' });
      doc.text(`$${labor.rate.toFixed(2)}`, rateX, y, { width: 40, align: 'right' });
      doc.text(`$${labor.totalCost.toFixed(2)}`, laborCostX, y, { width: 40, align: 'right' });
      
      // Move to next item position
      doc.moveDown();
    });
    
    // Add labor total
    y = doc.y + 5;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    doc.fontSize(9).font('Helvetica-Bold')
      .text('LABOR SUBTOTAL:', 350, y)
      .text(`$${analysis.costSummary.labor.toFixed(2)}`, laborCostX, y, { width: 40, align: 'right' });
    
    doc.moveDown(2);
  }
  
  // Check if we need a new page
  if (doc.y > 600) {
    doc.addPage();
  }
  
  // Add special considerations
  if (analysis.specialConsiderations && analysis.specialConsiderations.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('SPECIAL CONSIDERATIONS');
    doc.fontSize(10).font('Helvetica');
    analysis.specialConsiderations.forEach(item => {
      doc.text(`• ${item}`);
    });
    doc.moveDown();
  }
  
  // Add project timeline
  doc.fontSize(12).font('Helvetica-Bold').text('PROJECT TIMELINE');
  doc.fontSize(10).font('Helvetica')
    .text(`Estimated Duration: ${analysis.timeline.duration} days`)
    .text(`Recommended Crew Size: ${analysis.timeline.crewSize} workers`);
  doc.moveDown();
  
  // Add total cost summary
  doc.fontSize(12).font('Helvetica-Bold').text('COST SUMMARY');
  doc.moveDown(0.5);
  
  // Create cost summary table
  const summaryTop = doc.y;
  const summaryLabelX = 300;
  const summaryValueX = 500;
  
  doc.fontSize(10).font('Helvetica')
    .text('Materials and Disposal:', summaryLabelX, summaryTop)
    .text(`$${analysis.costSummary.materials.toFixed(2)}`, summaryValueX, summaryTop, { width: 40, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('Equipment:', summaryLabelX)
    .text(`$${analysis.costSummary.equipment.toFixed(2)}`, summaryValueX, doc.y, { width: 40, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('Labor:', summaryLabelX)
    .text(`$${analysis.costSummary.labor.toFixed(2)}`, summaryValueX, doc.y, { width: 40, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('Subtotal:', summaryLabelX)
    .text(`$${analysis.costSummary.subtotal.toFixed(2)}`, summaryValueX, doc.y, { width: 40, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('General Conditions (10%):', summaryLabelX)
    .text(`$${analysis.costSummary.generalConditions.toFixed(2)}`, summaryValueX, doc.y, { width: 40, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('Overhead and Profit (15%):', summaryLabelX)
    .text(`$${analysis.costSummary.overheadProfit.toFixed(2)}`, summaryValueX, doc.y, { width: 40, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('Contingency (10%):', summaryLabelX)
    .text(`$${analysis.costSummary.contingency.toFixed(2)}`, summaryValueX, doc.y, { width: 40, align: 'right' });
  
  // Add final total with highlight
  doc.moveDown();
  y = doc.y;
  doc.rect(summaryLabelX - 10, y - 5, 260, 25).fill('#f0f0f0');
  doc.fillColor('#000000');
  doc.fontSize(12).font('Helvetica-Bold')
    .text('TOTAL ESTIMATE:', summaryLabelX, y)
    .text(`$${analysis.costSummary.total.toFixed(2)}`, summaryValueX, y, { width: 40, align: 'right' });
  
  // Add footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Add page number
    doc.fontSize(8).font('Helvetica')
      .text(
        `Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );
      
    // Add disclaimer
    if (i === pageCount - 1) {
      doc.fontSize(8).font('Helvetica')
        .text(
          'This demolition estimate is based on the provided blueprints and is subject to change based on actual site conditions. All measurements and quantities should be verified in the field prior to commencing work.',
          50,
          doc.page.height - 30,
          { align: 'center', width: doc.page.width - 100 }
        );
    }
  }
}

// MongoDB Schemas (would typically be in separate files)
const blueprintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  path: { type: String, required: true },
  type: { type: String, enum: ['demolition', 'floorplan', 'notes', 'other'], default: 'other' },
  fileSize: { type: Number },
  uploadedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['in-progress', 'completed', 'archived'], default: 'in-progress' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const analysisSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, required: true },
  analysisType: { type: String, enum: ['materials', 'costs', 'full'], default: 'full' },
  results: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = router;
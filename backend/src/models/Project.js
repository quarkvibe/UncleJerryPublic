const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Blueprint image schema
const BlueprintImageSchema = new Schema({
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
  url: { type: String },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  pageType: { type: String, enum: ['title', 'floorplan', 'detail', 'scope', 'other'], default: 'other' },
  scale: { type: String }
});

// Material item schema
const MaterialItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  cost: { type: Number },
  category: { type: String }
});

// Labor item schema
const LaborItemSchema = new Schema({
  task: { type: String, required: true },
  hours: { type: Number, required: true },
  rate: { type: Number },
  cost: { type: Number }
});

// Analysis result schema
const AnalysisResultSchema = new Schema({
  trade: { type: String, required: true },
  analysisLevel: { type: String, enum: ['takeoff', 'costEstimate', 'fullEstimate'], default: 'takeoff' },
  materials: [MaterialItemSchema],
  labor: [LaborItemSchema],
  totalMaterialCost: { type: Number },
  totalLaborCost: { type: Number },
  totalCost: { type: Number },
  notes: { type: String },
  rawResponse: { type: String },
  analysisDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  errorMessage: { type: String }
});

// Project schema
const ProjectSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  blueprints: [BlueprintImageSchema],
  trade: { type: String, required: true },
  analysisResults: [AnalysisResultSchema],
  projectType: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'draft' },
  clientInfo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String }
  },
  permitInfo: {
    required: { type: Boolean, default: false },
    permitNumber: { type: String },
    permitCost: { type: Number }
  }
});

// Add pre-save hook to update the updatedAt field
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add methods to the project schema
ProjectSchema.methods = {
  // Add a blueprint to the project
  addBlueprint(blueprintData) {
    this.blueprints.push(blueprintData);
    return this.save();
  },
  
  // Add an analysis result to the project
  addAnalysisResult(analysisData) {
    this.analysisResults.push(analysisData);
    return this.save();
  },
  
  // Get the most recent analysis result
  getLatestAnalysis() {
    if (this.analysisResults && this.analysisResults.length > 0) {
      return this.analysisResults.sort((a, b) => 
        new Date(b.analysisDate) - new Date(a.analysisDate)
      )[0];
    }
    return null;
  }
};

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
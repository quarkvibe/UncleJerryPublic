import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
// Mock Redux hooks
const useAppDispatch = () => (action: any) => {
  console.log('Dispatch:', action);
  return {
    payload: {
      id: '1',
      projectName: 'Mock Project',
      dateAnalyzed: new Date().toISOString(),
      categories: {
        floors: [],
        walls: [],
        ceilings: [],
        millwork: [],
        transitions: [],
        specialItems: []
      },
      totalCost: 0,
      totalArea: 0,
      imageUrls: []
    }
  };
};
const useAppSelector = (selector: any) => ({
  materials: [],
  isLoading: false,
  error: null,
  currentAnalysis: { id: '1' },
  isAnalyzing: false,
  takeoff: { materials: [], totalCost: 0 },
  activeStep: 0,
  finish: {
    currentAnalysis: { id: '1' },
    isAnalyzing: false,
    error: null,
    materials: [],
    takeoff: { materials: [], totalCost: 0 },
  }
});
// Mock Redux actions
interface AsyncAction {
  type: string;
  payload: any;
  fulfilled: { match: (result: any) => boolean };
}

const analyzeFinishSchedule: any = (files: any): Promise<AsyncAction> => {
  return Promise.resolve({
    type: 'ANALYZE_FINISH_SCHEDULE',
    payload: { materials: [] },
    fulfilled: { match: () => false }
  });
};
analyzeFinishSchedule.fulfilled = { match: () => true };
const updateMaterialItem = (update: any) => ({ type: 'UPDATE_MATERIAL_ITEM', payload: update });
const exportTakeoff = (options: any) => ({ type: 'EXPORT_TAKEOFF', payload: options });
// Mock react-dropzone hook
const useDropzone = (options: any) => ({
  getRootProps: () => ({}),
  getInputProps: () => ({}),
  isDragActive: false,
  acceptedFiles: [],
});
// Mock ErrorBoundary component
const ErrorBoundary: React.FC<any> = ({ children }) => <>{children}</>;

// Types
export interface FinishMaterial {
  id: string;
  category: string;
  material: string;
  manufacturer: string;
  product: string;
  location: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  calculationBasis?: string;
  finishCode?: string;
}

export interface FinishCategory {
  name: string;
  materials: FinishMaterial[];
  totalQuantity: number;
  totalCost: number;
}

export interface FinishAnalysis {
  id: string;
  projectName: string;
  dateAnalyzed: string;
  categories: {
    floors: FinishCategory[];
    walls: FinishCategory[];
    ceilings: FinishCategory[];
    millwork: FinishCategory[];
    transitions: FinishCategory[];
    specialItems: FinishCategory[];
  };
  totalCost: number;
  totalArea: number;
  scaleReference?: {
    referenceLength: number;
    pixelLength: number;
    unit: string;
  };
  imageUrls: string[];
}

export interface FinishScheduleAnalyzerProps {
  projectId: string;
  onAnalysisComplete?: (analysis: FinishAnalysis) => void;
  initialData?: FinishAnalysis;
  isStandalone?: boolean;
}

const FinishScheduleAnalyzer: React.FC<FinishScheduleAnalyzerProps> = ({
  projectId,
  onAnalysisComplete,
  initialData,
  isStandalone = false
}) => {
  const dispatch = useAppDispatch();
  const { 
    currentAnalysis, 
    isAnalyzing, 
    error 
  } = useAppSelector((state: any) => state.finish);

  // Local state
  const [activeTab, setActiveTab] = useState<number>(0);
  const [scaleReference, setScaleReference] = useState<{
    referenceLength: number;
    pixelLength: number;
    unit: string;
  }>({ referenceLength: 0, pixelLength: 0, unit: 'ft' });
  const [blueprintImages, setBlueprintImages] = useState<{
    floorPlan?: File;
    finishSchedule?: File;
    finishPlan?: File;
    details?: File[];
  }>({
    details: []
  });
  const [blueprintImageUrls, setBlueprintImageUrls] = useState<{
    floorPlan?: string;
    finishSchedule?: string;
    finishPlan?: string;
    details: string[];
  }>({
    details: []
  });
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [showScaleDialog, setShowScaleDialog] = useState<boolean>(false);
  const [analysisSettings, setAnalysisSettings] = useState({
    includeWasteFactor: true,
    wasteFactorPercentage: 10,
    defaultCeilingHeight: 10,
    includeLabor: false,
    laborRate: 65,
    calculatePricing: true,
    roundUpQuantities: true
  });

  useEffect(() => {
    if (initialData) {
      // Initialize with provided data if available
      setScaleReference(initialData.scaleReference || { 
        referenceLength: 0, 
        pixelLength: 0, 
        unit: 'ft' 
      });
    }
  }, [initialData]);

  // File upload handlers
  const onDropFloorPlan = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setBlueprintImages(prev => ({ ...prev, floorPlan: file }));
      setBlueprintImageUrls(prev => ({ 
        ...prev, 
        floorPlan: URL.createObjectURL(file) 
      }));
    }
  };

  const onDropFinishSchedule = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setBlueprintImages(prev => ({ ...prev, finishSchedule: file }));
      setBlueprintImageUrls(prev => ({ 
        ...prev, 
        finishSchedule: URL.createObjectURL(file) 
      }));
    }
  };

  const onDropFinishPlan = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setBlueprintImages(prev => ({ ...prev, finishPlan: file }));
      setBlueprintImageUrls(prev => ({ 
        ...prev, 
        finishPlan: URL.createObjectURL(file) 
      }));
    }
  };

  const onDropDetails = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setBlueprintImages(prev => ({ 
        ...prev, 
        details: [...(prev.details || []), ...acceptedFiles] 
      }));
      
      const newUrls = acceptedFiles.map(file => URL.createObjectURL(file));
      setBlueprintImageUrls(prev => ({ 
        ...prev, 
        details: [...prev.details, ...newUrls] 
      }));
    }
  };

  // Dropzone hooks
  const { getRootProps: getFloorPlanRootProps, getInputProps: getFloorPlanInputProps } = 
    useDropzone({ onDrop: onDropFloorPlan, accept: { 'image/*': [] }, maxFiles: 1 });
  
  const { getRootProps: getFinishScheduleRootProps, getInputProps: getFinishScheduleInputProps } = 
    useDropzone({ onDrop: onDropFinishSchedule, accept: { 'image/*': [] }, maxFiles: 1 });
  
  const { getRootProps: getFinishPlanRootProps, getInputProps: getFinishPlanInputProps } = 
    useDropzone({ onDrop: onDropFinishPlan, accept: { 'image/*': [] }, maxFiles: 1 });
  
  const { getRootProps: getDetailsRootProps, getInputProps: getDetailsInputProps } = 
    useDropzone({ onDrop: onDropDetails, accept: { 'image/*': [] } });

  // Handle analysis submission
  const handleAnalyze = async () => {
    // Check if we have the minimum required files
    if (!blueprintImages.floorPlan || !blueprintImages.finishSchedule) {
      alert('Please upload both a floor plan and finish schedule to proceed with analysis');
      return;
    }

    const formData = new FormData();
    formData.append('projectId', projectId);
    
    if (blueprintImages.floorPlan) {
      formData.append('floorPlan', blueprintImages.floorPlan);
    }
    
    if (blueprintImages.finishSchedule) {
      formData.append('finishSchedule', blueprintImages.finishSchedule);
    }
    
    if (blueprintImages.finishPlan) {
      formData.append('finishPlan', blueprintImages.finishPlan);
    }
    
    if (blueprintImages.details && blueprintImages.details.length > 0) {
      blueprintImages.details.forEach((detail, index) => {
        formData.append(`detail_${index}`, detail);
      });
    }

    // Add scale reference information
    formData.append('scaleReference', JSON.stringify(scaleReference));
    
    // Add analysis settings
    formData.append('analysisSettings', JSON.stringify(analysisSettings));

    // Dispatch the analysis action
    const resultAction = await dispatch(analyzeFinishSchedule(formData));
    
    if (analyzeFinishSchedule.fulfilled.match(resultAction) && onAnalysisComplete) {
      onAnalysisComplete(resultAction.payload);
    }
  };

  // Handle material edit
  const handleMaterialUpdate = (material: FinishMaterial) => {
    dispatch(updateMaterialItem(material));
    setEditingMaterial(null);
  };

  // Handle export
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!currentAnalysis) return;
    
    dispatch(exportTakeoff({
      analysisId: currentAnalysis.id,
      format,
      includeImages: true
    }));
  };

  // Handle scale reference setting
  const setScale = (length: number, pixels: number, unit: string) => {
    setScaleReference({
      referenceLength: length,
      pixelLength: pixels,
      unit
    });
    setShowScaleDialog(false);
  };

  // Tab panels
  const renderTabPanel = (tabIndex: number) => {
    switch (tabIndex) {
      case 0: // Upload & Configure
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Upload Blueprint Images</Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Floor Plan Upload */}
              <Grid item xs={12} sm={6}>
                <Paper 
                  {...getFloorPlanRootProps()} 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    border: '2px dashed #ccc',
                    textAlign: 'center',
                    height: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundImage: blueprintImageUrls.floorPlan ? `url(${blueprintImageUrls.floorPlan})` : 'none',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  <input {...getFloorPlanInputProps()} />
                  {!blueprintImageUrls.floorPlan && (
                    <>
                      <Typography variant="body1">Upload Floor Plan</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Click or drag and drop
                      </Typography>
                    </>
                  )}
                </Paper>
                {blueprintImageUrls.floorPlan && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                    <Chip 
                      label="Floor Plan" 
                      color="primary" 
                      onDelete={() => {
                        setBlueprintImages(prev => ({ ...prev, floorPlan: undefined }));
                        setBlueprintImageUrls(prev => ({ ...prev, floorPlan: undefined }));
                      }} 
                    />
                  </Box>
                )}
              </Grid>
              
              {/* Finish Schedule Upload */}
              <Grid item xs={12} sm={6}>
                <Paper 
                  {...getFinishScheduleRootProps()} 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    border: '2px dashed #ccc',
                    textAlign: 'center',
                    height: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundImage: blueprintImageUrls.finishSchedule ? `url(${blueprintImageUrls.finishSchedule})` : 'none',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  <input {...getFinishScheduleInputProps()} />
                  {!blueprintImageUrls.finishSchedule && (
                    <>
                      <Typography variant="body1">Upload Finish Schedule</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Click or drag and drop
                      </Typography>
                    </>
                  )}
                </Paper>
                {blueprintImageUrls.finishSchedule && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                    <Chip 
                      label="Finish Schedule" 
                      color="primary" 
                      onDelete={() => {
                        setBlueprintImages(prev => ({ ...prev, finishSchedule: undefined }));
                        setBlueprintImageUrls(prev => ({ ...prev, finishSchedule: undefined }));
                      }} 
                    />
                  </Box>
                )}
              </Grid>
              
              {/* Finish Plan Upload */}
              <Grid item xs={12} sm={6}>
                <Paper 
                  {...getFinishPlanRootProps()} 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    border: '2px dashed #ccc',
                    textAlign: 'center',
                    height: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundImage: blueprintImageUrls.finishPlan ? `url(${blueprintImageUrls.finishPlan})` : 'none',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  <input {...getFinishPlanInputProps()} />
                  {!blueprintImageUrls.finishPlan && (
                    <>
                      <Typography variant="body1">Upload Finish Plan (Optional)</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Click or drag and drop
                      </Typography>
                    </>
                  )}
                </Paper>
                {blueprintImageUrls.finishPlan && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                    <Chip 
                      label="Finish Plan" 
                      color="primary" 
                      onDelete={() => {
                        setBlueprintImages(prev => ({ ...prev, finishPlan: undefined }));
                        setBlueprintImageUrls(prev => ({ ...prev, finishPlan: undefined }));
                      }} 
                    />
                  </Box>
                )}
              </Grid>
              
              {/* Details/Additional Images Upload */}
              <Grid item xs={12} sm={6}>
                <Paper 
                  {...getDetailsRootProps()} 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    border: '2px dashed #ccc',
                    textAlign: 'center',
                    height: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <input {...getDetailsInputProps()} />
                  <Typography variant="body1">Upload Detail Images (Optional)</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Click or drag and drop multiple images
                  </Typography>
                </Paper>
                {blueprintImageUrls.details.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                    {blueprintImageUrls.details.map((url, index) => (
                      <Chip 
                        key={`detail-${index}`}
                        label={`Detail ${index + 1}`}
                        color="primary"
                        onDelete={() => {
                          const newDetails = [...blueprintImageUrls.details];
                          newDetails.splice(index, 1);
                          setBlueprintImageUrls(prev => ({
                            ...prev,
                            details: newDetails
                          }));
                          
                          const newDetailFiles = [...(blueprintImages.details || [])];
                          newDetailFiles.splice(index, 1);
                          setBlueprintImages(prev => ({
                            ...prev,
                            details: newDetailFiles
                          }));
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>Scale Reference</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Reference Length"
                  type="number"
                  fullWidth
                  value={scaleReference.referenceLength || ''}
                  onChange={(e) => setScaleReference({
                    ...scaleReference,
                    referenceLength: parseFloat(e.target.value)
                  })}
                  InputProps={{ endAdornment: scaleReference.unit }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Pixel Length"
                  type="number"
                  fullWidth
                  value={scaleReference.pixelLength || ''}
                  onChange={(e) => setScaleReference({
                    ...scaleReference,
                    pixelLength: parseFloat(e.target.value)
                  })}
                  InputProps={{ endAdornment: 'px' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={scaleReference.unit}
                    label="Unit"
                    onChange={(e) => setScaleReference({
                      ...scaleReference,
                      unit: e.target.value
                    })}
                  >
                    <MenuItem value="ft">Feet</MenuItem>
                    <MenuItem value="in">Inches</MenuItem>
                    <MenuItem value="m">Meters</MenuItem>
                    <MenuItem value="cm">Centimeters</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" gutterBottom>Analysis Settings</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Include Waste Factor</InputLabel>
                  <Select
                    value={analysisSettings.includeWasteFactor ? 'yes' : 'no'}
                    label="Include Waste Factor"
                    onChange={(e) => setAnalysisSettings({
                      ...analysisSettings,
                      includeWasteFactor: e.target.value === 'yes'
                    })}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {analysisSettings.includeWasteFactor && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Waste Factor Percentage"
                    type="number"
                    fullWidth
                    value={analysisSettings.wasteFactorPercentage}
                    onChange={(e) => setAnalysisSettings({
                      ...analysisSettings,
                      wasteFactorPercentage: parseInt(e.target.value)
                    })}
                    InputProps={{ endAdornment: '%' }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Default Ceiling Height"
                  type="number"
                  fullWidth
                  value={analysisSettings.defaultCeilingHeight}
                  onChange={(e) => setAnalysisSettings({
                    ...analysisSettings,
                    defaultCeilingHeight: parseFloat(e.target.value)
                  })}
                  InputProps={{ endAdornment: 'ft' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Calculate Pricing</InputLabel>
                  <Select
                    value={analysisSettings.calculatePricing ? 'yes' : 'no'}
                    label="Calculate Pricing"
                    onChange={(e) => setAnalysisSettings({
                      ...analysisSettings,
                      calculatePricing: e.target.value === 'yes'
                    })}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Include Labor</InputLabel>
                  <Select
                    value={analysisSettings.includeLabor ? 'yes' : 'no'}
                    label="Include Labor"
                    onChange={(e) => setAnalysisSettings({
                      ...analysisSettings,
                      includeLabor: e.target.value === 'yes'
                    })}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {analysisSettings.includeLabor && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Labor Rate"
                    type="number"
                    fullWidth
                    value={analysisSettings.laborRate}
                    onChange={(e) => setAnalysisSettings({
                      ...analysisSettings,
                      laborRate: parseFloat(e.target.value)
                    })}
                    InputProps={{ endAdornment: '$/hr' }}
                  />
                </Grid>
              )}
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
                onClick={handleAnalyze}
                disabled={
                  isAnalyzing || 
                  !blueprintImages.floorPlan || 
                  !blueprintImages.finishSchedule ||
                  !scaleReference.referenceLength ||
                  !scaleReference.pixelLength
                }
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Materials'}
              </Button>
            </Box>
          </Box>
        );
        
      case 1: // Results - Material Takeoff
        return (
          <Box sx={{ p: 3 }}>
            {currentAnalysis ? (
              <>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5">Finish Schedule Material Takeoff</Typography>
                  <Box>
                    <Tooltip title="Export to PDF">
                      <IconButton onClick={() => handleExport('pdf')}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export to Excel">
                      <IconButton onClick={() => handleExport('excel')}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy to Clipboard">
                      <IconButton onClick={() => {
                        // Implementation for copying to clipboard
                      }}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                {/* Floor Finishes */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Floor Finishes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Material</TableCell>
                            <TableCell>Manufacturer/Product</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            {analysisSettings.calculatePricing && (
                              <>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </>
                            )}
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentAnalysis.categories.floors.flatMap(category => 
                            category.materials.map(material => (
                              <TableRow key={material.id}>
                                <TableCell>{material.material}</TableCell>
                                <TableCell>{material.manufacturer} - {material.product}</TableCell>
                                <TableCell>{material.location}</TableCell>
                                <TableCell align="right">{material.quantity.toFixed(2)}</TableCell>
                                <TableCell>{material.unit}</TableCell>
                                {analysisSettings.calculatePricing && (
                                  <>
                                    <TableCell align="right">${material.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell align="right">${material.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                                  </>
                                )}
                                <TableCell>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => setEditingMaterial(material.id)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Calculation">
                                    <IconButton size="small">
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
                
                {/* Wall Finishes */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Wall Finishes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Material</TableCell>
                            <TableCell>Manufacturer/Product</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            {analysisSettings.calculatePricing && (
                              <>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </>
                            )}
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentAnalysis.categories.walls.flatMap(category => 
                            category.materials.map(material => (
                              <TableRow key={material.id}>
                                <TableCell>{material.material}</TableCell>
                                <TableCell>{material.manufacturer} - {material.product}</TableCell>
                                <TableCell>{material.location}</TableCell>
                                <TableCell align="right">{material.quantity.toFixed(2)}</TableCell>
                                <TableCell>{material.unit}</TableCell>
                                {analysisSettings.calculatePricing && (
                                  <>
                                    <TableCell align="right">${material.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell align="right">${material.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                                  </>
                                )}
                                <TableCell>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => setEditingMaterial(material.id)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Calculation">
                                    <IconButton size="small">
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
                
                {/* Ceiling Finishes */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Ceiling Finishes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Material</TableCell>
                            <TableCell>Manufacturer/Product</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            {analysisSettings.calculatePricing && (
                              <>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </>
                            )}
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentAnalysis.categories.ceilings.flatMap(category => 
                            category.materials.map(material => (
                              <TableRow key={material.id}>
                                <TableCell>{material.material}</TableCell>
                                <TableCell>{material.manufacturer} - {material.product}</TableCell>
                                <TableCell>{material.location}</TableCell>
                                <TableCell align="right">{material.quantity.toFixed(2)}</TableCell>
                                <TableCell>{material.unit}</TableCell>
                                {analysisSettings.calculatePricing && (
                                  <>
                                    <TableCell align="right">${material.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell align="right">${material.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                                  </>
                                )}
                                <TableCell>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => setEditingMaterial(material.id)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Calculation">
                                    <IconButton size="small">
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
                
                {/* Millwork */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Millwork & Cabinetry</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Material</TableCell>
                            <TableCell>Manufacturer/Product</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            {analysisSettings.calculatePricing && (
                              <>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </>
                            )}
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentAnalysis.categories.millwork.flatMap(category => 
                            category.materials.map(material => (
                              <TableRow key={material.id}>
                                <TableCell>{material.material}</TableCell>
                                <TableCell>{material.manufacturer} - {material.product}</TableCell>
                                <TableCell>{material.location}</TableCell>
                                <TableCell align="right">{material.quantity.toFixed(2)}</TableCell>
                                <TableCell>{material.unit}</TableCell>
                                {analysisSettings.calculatePricing && (
                                  <>
                                    <TableCell align="right">${material.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell align="right">${material.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                                  </>
                                )}
                                <TableCell>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => setEditingMaterial(material.id)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Calculation">
                                    <IconButton size="small">
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
                
                {/* Transitions */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Transitions & Specialty Items</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Material</TableCell>
                            <TableCell>Manufacturer/Product</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            {analysisSettings.calculatePricing && (
                              <>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </>
                            )}
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...currentAnalysis.categories.transitions, ...currentAnalysis.categories.specialItems].flatMap(category => 
                            category.materials.map(material => (
                              <TableRow key={material.id}>
                                <TableCell>{material.material}</TableCell>
                                <TableCell>{material.manufacturer} - {material.product}</TableCell>
                                <TableCell>{material.location}</TableCell>
                                <TableCell align="right">{material.quantity.toFixed(2)}</TableCell>
                                <TableCell>{material.unit}</TableCell>
                                {analysisSettings.calculatePricing && (
                                  <>
                                    <TableCell align="right">${material.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell align="right">${material.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                                  </>
                                )}
                                <TableCell>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => setEditingMaterial(material.id)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="View Calculation">
                                    <IconButton size="small">
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
                
                {/* Summary */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body1">
                        Total Floor Area: {currentAnalysis.totalArea.toFixed(2)} SF
                      </Typography>
                      <Typography variant="body1">
                        Total Materials: {Object.values(currentAnalysis.categories)
                          .flat()
                          .reduce((acc, category) => acc + category.materials.length, 0)}
                      </Typography>
                      {analysisSettings.includeWasteFactor && (
                        <Typography variant="body1">
                          Waste Factor: {analysisSettings.wasteFactorPercentage}%
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {analysisSettings.calculatePricing && (
                        <>
                          <Typography variant="body1">
                            Materials Cost: ${Object.values(currentAnalysis.categories)
                              .flat()
                              .reduce((acc, category) => acc + category.totalCost, 0).toFixed(2)}
                          </Typography>
                          {analysisSettings.includeLabor && (
                            <Typography variant="body1">
                              Estimated Labor: ${(currentAnalysis.laborCost || 0).toFixed(2)}
                            </Typography>
                          )}
                          <Typography variant="h6" sx={{ mt: 1 }}>
                            Total Cost: ${currentAnalysis.totalCost.toFixed(2)}
                          </Typography>
                        </>
                      )}
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Material Edit Dialog */}
                {editingMaterial && (
                  <Dialog 
                    open={!!editingMaterial} 
                    onClose={() => setEditingMaterial(null)}
                    maxWidth="md"
                    fullWidth
                  >
                    <DialogTitle>Edit Material</DialogTitle>
                    <DialogContent>
                      {/* Find the current material being edited */}
                      {(() => {
                        const allMaterials = Object.values(currentAnalysis.categories)
                          .flat()
                          .flatMap(category => category.materials);
                        const material = allMaterials.find(m => m.id === editingMaterial);
                        
                        if (!material) return null;
                        
                        return (
                          <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Material"
                                fullWidth
                                value={material.material}
                                onChange={(e) => {
                                  // Create a new material object to update
                                  const updatedMaterial = {
                                    ...material,
                                    material: e.target.value
                                  };
                                  // This would be handled by the dispatch action in the actual component
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Manufacturer"
                                fullWidth
                                value={material.manufacturer}
                                onChange={(e) => {
                                  // Similarly for other fields
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Product"
                                fullWidth
                                value={material.product}
                                onChange={(e) => {
                                  // Similarly for other fields
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Location"
                                fullWidth
                                value={material.location}
                                onChange={(e) => {
                                  // Similarly for other fields
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Quantity"
                                type="number"
                                fullWidth
                                value={material.quantity}
                                onChange={(e) => {
                                  // Similarly for other fields
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                label="Unit"
                                fullWidth
                                value={material.unit}
                                onChange={(e) => {
                                  // Similarly for other fields
                                }}
                              />
                            </Grid>
                            {analysisSettings.calculatePricing && (
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  label="Unit Price"
                                  type="number"
                                  fullWidth
                                  value={material.unitPrice}
                                  onChange={(e) => {
                                    // Similarly for other fields
                                  }}
                                  InputProps={{
                                    startAdornment: '$'
                                  }}
                                />
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <TextField
                                label="Notes"
                                fullWidth
                                multiline
                                rows={2}
                                value={material.notes || ''}
                                onChange={(e) => {
                                  // Similarly for other fields
                                }}
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                label="Calculation Basis"
                                fullWidth
                                multiline
                                rows={2}
                                value={material.calculationBasis || ''}
                                onChange={(e) => {
                                  // Similarly for other fields
                                }}
                              />
                            </Grid>
                          </Grid>
                        );
                      })()}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setEditingMaterial(null)}>Cancel</Button>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => {
                          // This would call handleMaterialUpdate with the updated material
                          setEditingMaterial(null);
                        }}
                      >
                        Save Changes
                      </Button>
                    </DialogActions>
                  </Dialog>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>No Analysis Results Yet</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Upload blueprint images and run an analysis to see material takeoff results here.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveTab(0)}
                >
                  Go to Upload
                </Button>
              </Box>
            )}
          </Box>
        );
        
      case 2: // Results - Visualizations
        return (
          <Box sx={{ p: 3 }}>
            {currentAnalysis ? (
              <>
                <Typography variant="h5" gutterBottom>Finish Visualizations</Typography>
                
                <Grid container spacing={3}>
                  {/* Pie Chart for Material Categories */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Materials by Category</Typography>
                      <Box sx={{ height: 330, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Visualization would go here - using placeholder */}
                        <Typography color="text.secondary">Pie chart visualization of material categories</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Bar Chart for Cost Distribution */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 400 }}>
                      <Typography variant="h6" gutterBottom>Cost Distribution</Typography>
                      <Box sx={{ height: 330, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {/* Visualization would go here - using placeholder */}
                        <Typography color="text.secondary">Bar chart of cost distribution</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Color Visualization */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Finish Color Palette</Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {/* Color swatches would go here - using placeholders */}
                        {['#F5F5F5', '#E6E6E6', '#D2B48C', '#EADDCA', '#CCCCCC'].map((color, index) => (
                          <Grid item key={index}>
                            <Box 
                              sx={{ 
                                width: 100, 
                                height: 100, 
                                bgcolor: color,
                                borderRadius: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                p: 1
                              }}
                            >
                              <Typography variant="caption" sx={{ bgcolor: 'rgba(255,255,255,0.7)', p: 0.5, borderRadius: 0.5 }}>
                                {color}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  {/* Plan Overlay */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Floor Plan Material Overlay</Typography>
                      <Box sx={{ height: 500, position: 'relative', border: '1px solid #eee' }}>
                        {/* Floor plan with material overlay would go here */}
                        <Typography 
                          sx={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)' 
                          }}
                          color="text.secondary"
                        >
                          Interactive floor plan with finish materials overlay
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>No Visualization Data Available</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Run an analysis first to see visualization of finish materials.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setActiveTab(0)}
                >
                  Go to Upload
                </Button>
              </Box>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Upload & Configure" />
          <Tab label="Material Takeoff" disabled={!currentAnalysis} />
          <Tab label="Visualizations" disabled={!currentAnalysis} />
        </Tabs>
        
        {renderTabPanel(activeTab)}
      </Paper>
    </Box>
  );
};

export default FinishScheduleAnalyzer;

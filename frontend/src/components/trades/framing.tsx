import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper
} from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import axios from 'axios';

// Types for our blueprint data and framing analysis
interface WallSection {
  id: string;
  description?: string;
  typeCode: string;
  length: number;
  height?: number;
}

interface FramingMaterials {
  studs: Record<string, number>;
  track: Record<string, number>;
  headers: number;
  kingStuds: number;
  crippleStuds: number;
  cornerBacking: number;
  blocking: number;
  screws: number;
  nails: number;
}

interface FramingResults {
  materials: FramingMaterials;
  totals: {
    linearFeet: number;
    wallArea: number;
    openings: number;
    wallCorners: number;
  }
}

interface FramingProps {
  projectId: string;
  blueprintImages: string[];
  onMaterialsCalculated: (materials: any[]) => void;
  priceDatabase?: Record<string, number>;
}

const FramingAnalyzer: React.FC<FramingProps> = ({
  projectId,
  blueprintImages,
  onMaterialsCalculated,
  priceDatabase = {}
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FramingResults | null>(null);
  
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  // Get material name from its type code
  const getMaterialName = (type: string): string => {
    switch(type) {
      case 'metal_3_5_8': return '3-5/8" Metal Studs (20GA)';
      case 'metal_6': return '6" Metal Studs (20GA)';
      case 'metal_2_1_2': return '2-1/2" Metal Studs (20GA)';
      case 'wood_2x4': return '2x4 Wood Studs';
      case 'wood_2x6': return '2x6 Wood Studs';
      default: return type;
    }
  };
  
  // Get price for a material
  const getMaterialPrice = (id: string): number => {
    return priceDatabase[id] || 0;
  };
  
  // Calculate total cost for all materials
  const calculateTotalCost = (): number => {
    if (!results) return 0;
    
    let total = 0;
    
    // Add studs cost
    Object.entries(results.materials.studs).forEach(([type, count]) => {
      if (count > 0) {
        total += count * getMaterialPrice(`stud_${type}`);
      }
    });
    
    // Add track cost
    Object.entries(results.materials.track).forEach(([type, length]) => {
      if (length > 0) {
        total += length * getMaterialPrice(`track_${type}`);
      }
    });
    
    // Add other materials
    total += results.materials.headers * getMaterialPrice('headers');
    total += results.materials.kingStuds * getMaterialPrice('king_studs');
    total += results.materials.crippleStuds * getMaterialPrice('cripple_studs');
    total += results.materials.cornerBacking * getMaterialPrice('corner_backing');
    total += results.materials.blocking * getMaterialPrice('blocking');
    total += results.materials.screws * getMaterialPrice('screws');
    total += results.materials.nails * getMaterialPrice('nails');
    
    return total;
  };

  // Convert to material items array for parent component
  const convertToMaterialItems = () => {
    if (!results) return [];
    
    const items = [];
    
    // Add studs
    Object.entries(results.materials.studs).forEach(([type, count]) => {
      if (count > 0) {
        const price = getMaterialPrice(`stud_${type}`);
        items.push({
          id: `stud_${type}`,
          category: 'framing',
          name: getMaterialName(type),
          quantity: Math.ceil(count),
          unit: 'pieces',
          unitPrice: price,
          totalPrice: Math.ceil(count) * price
        });
      }
    });
    
    // Add track
    Object.entries(results.materials.track).forEach(([type, length]) => {
      if (length > 0) {
        const price = getMaterialPrice(`track_${type}`);
        items.push({
          id: `track_${type}`,
          category: 'framing',
          name: getMaterialName(type).replace('Studs', 'Track'),
          quantity: Math.ceil(length),
          unit: 'linear ft',
          unitPrice: price,
          totalPrice: Math.ceil(length) * price
        });
      }
    });
    
    // Add accessories
    const accessories = [
      { id: 'headers', name: 'Door/Window Headers', quantity: results.materials.headers, unit: 'pieces' },
      { id: 'king_studs', name: 'King Studs', quantity: results.materials.kingStuds, unit: 'pieces' },
      { id: 'cripple_studs', name: 'Cripple Studs', quantity: results.materials.crippleStuds, unit: 'pieces' },
      { id: 'corner_backing', name: 'Corner Backing', quantity: results.materials.cornerBacking, unit: 'pieces' },
      { id: 'blocking', name: 'Blocking', quantity: results.materials.blocking, unit: 'linear ft' },
      { id: 'screws', name: 'Framing Screws', quantity: results.materials.screws, unit: 'lbs' },
      { id: 'nails', name: 'Framing Nails', quantity: results.materials.nails, unit: 'lbs' }
    ];
    
    accessories.forEach(item => {
      if (item.quantity > 0) {
        const price = getMaterialPrice(item.id);
        items.push({
          id: item.id,
          category: 'framing',
          name: item.name,
          quantity: Math.ceil(item.quantity),
          unit: item.unit,
          unitPrice: price,
          totalPrice: Math.ceil(item.quantity) * price
        });
      }
    });
    
    return items;
  };
  
  // Run the analysis
  const analyzeBlueprints = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post('/api/analyze-blueprints', {
        projectId,
        images: blueprintImages,
        tradeType: 'framing'
      });
      
      setResults(response.data.materialTakeoff);
      
      // Pass materials to parent component
      const materials = convertToMaterialItems();
      onMaterialsCalculated(materials);
      
    } catch (err: any) {
      setError(err.message || 'Failed to analyze blueprints');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box>
      {error && (
        <Box mb={3} p={2} bgcolor="#fff4e5" borderRadius={1}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {!results && !isLoading && (
        <Box textAlign="center" my={4}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ConstructionIcon />}
            onClick={analyzeBlueprints}
            disabled={isLoading}
          >
            Analyze Framing
          </Button>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Calculate studs, track, and all framing materials
          </Typography>
        </Box>
      )}
      
      {isLoading && (
        <Box display="flex" flexDirection="column" alignItems="center" my={4}>
          <CircularProgress />
          <Typography variant="body1" mt={2}>
            Analyzing blueprints...
          </Typography>
        </Box>
      )}
      
      {results && (
        <Box mt={3}>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Linear Feet
                  </Typography>
                  <Typography variant="h4">
                    {results.totals.linearFeet.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Linear feet of walls
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Wall Area
                  </Typography>
                  <Typography variant="h4">
                    {results.totals.wallArea.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Square feet of walls
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Studs
                  </Typography>
                  <Typography variant="h4">
                    {Object.values(results.materials.studs).reduce((sum, count) => sum + count, 0).toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total number of studs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Estimated Cost
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(calculateTotalCost())}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total materials cost
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Materials Tables */}
          <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Studs & Track
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(results.materials.studs).map(([type, count]) => {
                    if (count > 0) {
                      const price = getMaterialPrice(`stud_${type}`);
                      return (
                        <TableRow key={`stud_${type}`}>
                          <TableCell>{getMaterialName(type)}</TableCell>
                          <TableCell align="right">{Math.ceil(count)}</TableCell>
                          <TableCell align="right">pieces</TableCell>
                          <TableCell align="right">{formatCurrency(price)}</TableCell>
                          <TableCell align="right">{formatCurrency(Math.ceil(count) * price)}</TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })}
                  
                  {Object.entries(results.materials.track).map(([type, length]) => {
                    if (length > 0) {
                      const price = getMaterialPrice(`track_${type}`);
                      return (
                        <TableRow key={`track_${type}`}>
                          <TableCell>{getMaterialName(type).replace('Studs', 'Track')}</TableCell>
                          <TableCell align="right">{Math.ceil(length)}</TableCell>
                          <TableCell align="right">linear ft</TableCell>
                          <TableCell align="right">{formatCurrency(price)}</TableCell>
                          <TableCell align="right">{formatCurrency(Math.ceil(length) * price)}</TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Additional Materials
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.materials.headers > 0 && (
                    <TableRow>
                      <TableCell>Door/Window Headers</TableCell>
                      <TableCell align="right">{Math.ceil(results.materials.headers)}</TableCell>
                      <TableCell align="right">pieces</TableCell>
                      <TableCell align="right">{formatCurrency(getMaterialPrice('headers'))}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Math.ceil(results.materials.headers) * getMaterialPrice('headers'))}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {results.materials.kingStuds > 0 && (
                    <TableRow>
                      <TableCell>King Studs</TableCell>
                      <TableCell align="right">{Math.ceil(results.materials.kingStuds)}</TableCell>
                      <TableCell align="right">pieces</TableCell>
                      <TableCell align="right">{formatCurrency(getMaterialPrice('king_studs'))}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Math.ceil(results.materials.kingStuds) * getMaterialPrice('king_studs'))}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {results.materials.crippleStuds > 0 && (
                    <TableRow>
                      <TableCell>Cripple Studs</TableCell>
                      <TableCell align="right">{Math.ceil(results.materials.crippleStuds)}</TableCell>
                      <TableCell align="right">pieces</TableCell>
                      <TableCell align="right">{formatCurrency(getMaterialPrice('cripple_studs'))}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Math.ceil(results.materials.crippleStuds) * getMaterialPrice('cripple_studs'))}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {results.materials.cornerBacking > 0 && (
                    <TableRow>
                      <TableCell>Corner Backing</TableCell>
                      <TableCell align="right">{Math.ceil(results.materials.cornerBacking)}</TableCell>
                      <TableCell align="right">pieces</TableCell>
                      <TableCell align="right">{formatCurrency(getMaterialPrice('corner_backing'))}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Math.ceil(results.materials.cornerBacking) * getMaterialPrice('corner_backing'))}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {results.materials.blocking > 0 && (
                    <TableRow>
                      <TableCell>Blocking</TableCell>
                      <TableCell align="right">{Math.ceil(results.materials.blocking)}</TableCell>
                      <TableCell align="right">linear ft</TableCell>
                      <TableCell align="right">{formatCurrency(getMaterialPrice('blocking'))}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Math.ceil(results.materials.blocking) * getMaterialPrice('blocking'))}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {results.materials.screws > 0 && (
                    <TableRow>
                      <TableCell>Framing Screws</TableCell>
                      <TableCell align="right">{Math.ceil(results.materials.screws)}</TableCell>
                      <TableCell align="right">lbs</TableCell>
                      <TableCell align="right">{formatCurrency(getMaterialPrice('screws'))}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Math.ceil(results.materials.screws) * getMaterialPrice('screws'))}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {results.materials.nails > 0 && (
                    <TableRow>
                      <TableCell>Framing Nails</TableCell>
                      <TableCell align="right">{Math.ceil(results.materials.nails)}</TableCell>
                      <TableCell align="right">lbs</TableCell>
                      <TableCell align="right">{formatCurrency(getMaterialPrice('nails'))}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(Math.ceil(results.materials.nails) * getMaterialPrice('nails'))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default FramingAnalyzer;

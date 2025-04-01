
import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { VisualizationMap, SensorPlacement } from '../types';

const router = Router();
const VISUALIZATIONS_FILE = path.join(__dirname, '../config/visualizations.json');

// Helper function to ensure the config directory exists
function ensureConfigDir() {
  const configDir = path.dirname(VISUALIZATIONS_FILE);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// Helper to read visualizations from file
function readVisualizations(): VisualizationMap[] {
  ensureConfigDir();
  if (!fs.existsSync(VISUALIZATIONS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(VISUALIZATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading visualizations file:', error);
    return [];
  }
}

// Helper to write visualizations to file
function writeVisualizations(maps: VisualizationMap[]): void {
  ensureConfigDir();
  try {
    fs.writeFileSync(VISUALIZATIONS_FILE, JSON.stringify(maps, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing visualizations file:', error);
  }
}

// Get all visualization maps
router.get('/', (req: Request, res: Response): void => {
  const maps = readVisualizations();
  res.json(maps);
});

// Get a specific visualization map
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const maps = readVisualizations();
  const map = maps.find(m => m.id === parseInt(id));
  
  if (!map) {
    res.status(404).json({ error: 'Visualization map not found' });
    return;
  }
  
  res.json(map);
});

// Create a new visualization map
router.post('/', (req: Request, res: Response): void => {
  const { name, imagePath, sensorPlacements } = req.body as {
    name: string;
    imagePath: string;
    sensorPlacements: SensorPlacement[];
  };
  
  if (!name || !imagePath) {
    res.status(400).json({ 
      error: 'Name and imagePath are required',
      success: false 
    });
    return;
  }
  
  const maps = readVisualizations();
  
  // Generate a new ID
  const maxId = maps.length > 0 ? Math.max(...maps.map(m => m.id || 0)) : 0;
  const newMap: VisualizationMap = {
    id: maxId + 1,
    name,
    imagePath,
    sensorPlacements: sensorPlacements || []
  };
  
  maps.push(newMap);
  writeVisualizations(maps);
  
  res.json({ 
    id: newMap.id, 
    success: true,
    message: 'Visualization map created successfully'
  });
});

// Update an existing visualization map
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { name, imagePath, sensorPlacements } = req.body as {
    name: string;
    imagePath: string;
    sensorPlacements: SensorPlacement[];
  };
  
  if (!name || !imagePath) {
    res.status(400).json({ 
      error: 'Name and imagePath are required',
      success: false 
    });
    return;
  }
  
  const maps = readVisualizations();
  const index = maps.findIndex(m => m.id === parseInt(id));
  
  if (index === -1) {
    res.status(404).json({ 
      error: 'Visualization map not found',
      success: false 
    });
    return;
  }
  
  maps[index] = {
    ...maps[index],
    name,
    imagePath,
    sensorPlacements: sensorPlacements || []
  };
  
  writeVisualizations(maps);
  
  res.json({ 
    success: true,
    message: 'Visualization map updated successfully'
  });
});

// Delete a visualization map
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const maps = readVisualizations();
  const filteredMaps = maps.filter(m => m.id !== parseInt(id));
  
  if (filteredMaps.length === maps.length) {
    res.status(404).json({ 
      error: 'Visualization map not found',
      success: false 
    });
    return;
  }
  
  writeVisualizations(filteredMaps);
  
  res.json({ 
    success: true,
    message: 'Visualization map deleted successfully'
  });
});

export default router;

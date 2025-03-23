
import { Router } from 'express';
import { db, DBVisualizationMap } from '../db';
import { VisualizationMap, SensorPlacement } from '../types';

const router = Router();

// Get all visualization maps
router.route('/').get((req, res) => {
  db.all('SELECT * FROM visualization_maps', [], (err, rows: DBVisualizationMap[]) => {
    if (err) {
      console.error('Error fetching visualization maps:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Convert JSON strings to objects
    const maps: VisualizationMap[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      sensorPlacements: JSON.parse(row.sensor_placements),
    }));
    
    return res.json(maps);
  });
});

// Get a specific visualization map
router.route('/:id').get((req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM visualization_maps WHERE id = ?', [id], (err, row: DBVisualizationMap) => {
    if (err) {
      console.error('Error fetching visualization map:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Visualization map not found' });
    }
    
    // Convert JSON string to object
    const map: VisualizationMap = {
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      sensorPlacements: JSON.parse(row.sensor_placements),
    };
    
    return res.json(map);
  });
});

// Create a new visualization map
router.route('/').post((req, res) => {
  const { name, imagePath, sensorPlacements } = req.body as {
    name: string;
    imagePath: string;
    sensorPlacements: SensorPlacement[];
  };
  
  if (!name || !imagePath) {
    return res.status(400).json({ 
      error: 'Name and imagePath are required',
      success: false 
    });
  }
  
  db.run(
    'INSERT INTO visualization_maps (name, image_path, sensor_placements) VALUES (?, ?, ?)',
    [name, imagePath, JSON.stringify(sensorPlacements || [])],
    function(err) {
      if (err) {
        console.error('Error creating visualization map:', err);
        return res.status(500).json({ error: err.message, success: false });
      }
      
      return res.json({ 
        id: this.lastID, 
        success: true,
        message: 'Visualization map created successfully'
      });
    }
  );
});

// Update an existing visualization map
router.route('/:id').put((req, res) => {
  const { id } = req.params;
  const { name, imagePath, sensorPlacements } = req.body as VisualizationMap;
  
  if (!name || !imagePath) {
    return res.status(400).json({ 
      error: 'Name and imagePath are required',
      success: false 
    });
  }
  
  db.run(
    'UPDATE visualization_maps SET name = ?, image_path = ?, sensor_placements = ? WHERE id = ?',
    [name, imagePath, JSON.stringify(sensorPlacements || []), id],
    function(err) {
      if (err) {
        console.error('Error updating visualization map:', err);
        return res.status(500).json({ error: err.message, success: false });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          error: 'Visualization map not found',
          success: false 
        });
      }
      
      return res.json({ 
        success: true,
        message: 'Visualization map updated successfully'
      });
    }
  );
});

// Delete a visualization map
router.route('/:id').delete((req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM visualization_maps WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting visualization map:', err);
      return res.status(500).json({ error: err.message, success: false });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        error: 'Visualization map not found',
        success: false 
      });
    }
    
    return res.json({ 
      success: true,
      message: 'Visualization map deleted successfully'
    });
  });
});

export default router;

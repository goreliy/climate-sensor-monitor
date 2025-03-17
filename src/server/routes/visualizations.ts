
import { Router } from 'express';
import { db, DBVisualizationMap } from '../db';
import { VisualizationMap } from '@/components/settings/types';

const router = Router();

// Create a new visualization map
router.post('/', (req, res) => {
  const { name, imagePath, sensorPlacements } = req.body;
  
  db.run(
    'INSERT INTO visualization_maps (name, image_path, sensor_placements) VALUES (?, ?, ?)',
    [name, imagePath, JSON.stringify(sensorPlacements)],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, success: true });
    }
  );
});

// Get all visualization maps
router.get('/', (req, res) => {
  db.all('SELECT * FROM visualization_maps', [], (err, rows: DBVisualizationMap[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Convert JSON strings to objects
    const maps = rows.map(row => ({
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      sensorPlacements: JSON.parse(row.sensor_placements),
    }));
    
    res.json(maps);
  });
});

// Get a specific visualization map
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM visualization_maps WHERE id = ?', [id], (err, row: DBVisualizationMap) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Visualization not found' });
      return;
    }
    
    // Convert JSON string to object
    const map = {
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      sensorPlacements: JSON.parse(row.sensor_placements),
    };
    
    res.json(map);
  });
});

export default router;


import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Add new sensor reading
router.post('/', (req, res) => {
  const { sensor_id, temperature, humidity } = req.body;
  
  db.run(
    'INSERT INTO sensor_readings (sensor_id, temperature, humidity) VALUES (?, ?, ?)',
    [sensor_id, temperature, humidity],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // Since our InMemoryDB doesn't support lastID yet, we just return success
      res.json({ success: true, id: Date.now() });
    }
  );
});

// Get the latest readings for all sensors
router.get('/latest', (req, res) => {
  db.all(
    'SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 100',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Process the results to get the latest reading for each sensor
      const latestReadings: Record<string, any> = {};
      
      rows.forEach(reading => {
        if (!latestReadings[reading.sensor_id] || 
            new Date(reading.timestamp) > new Date(latestReadings[reading.sensor_id].timestamp)) {
          latestReadings[reading.sensor_id] = reading;
        }
      });
      
      res.json(Object.values(latestReadings));
    }
  );
});

export default router;

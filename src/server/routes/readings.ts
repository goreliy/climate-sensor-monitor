
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
      res.json({ id: this.lastID });
    }
  );
});

export default router;

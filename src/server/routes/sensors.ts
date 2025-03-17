
import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Get all sensors
router.get('/', (req, res) => {
  db.all('SELECT * FROM sensors', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get readings for a specific sensor
router.get('/:id/readings', (req, res) => {
  const { id } = req.params;
  const { limit = 30, startDate, endDate } = req.query;
  
  let query = 'SELECT * FROM sensor_readings WHERE sensor_id = ?';
  const params = [id];
  
  if (startDate && endDate) {
    query += ' AND timestamp BETWEEN ? AND ?';
    params.push(startDate as string, endDate as string);
  }
  
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);
  
  db.all(
    query,
    params,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Save sensor configurations
router.post('/config', (req, res) => {
  const sensors = req.body;
  
  if (!Array.isArray(sensors) || sensors.length > 60) {
    res.status(400).json({ error: 'Invalid sensors configuration' });
    return;
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Clear existing sensors
    db.run('DELETE FROM sensors', (err) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }

      // Add new sensors
      const stmt = db.prepare(
        'INSERT INTO sensors (name, temp_min, temp_max, humidity_min, humidity_max) VALUES (?, ?, ?, ?, ?)'
      );

      sensors.forEach((sensor) => {
        stmt.run([
          sensor.name,
          sensor.tempMin,
          sensor.tempMax,
          sensor.humidityMin,
          sensor.humidityMax
        ]);
      });

      stmt.finalize();
      
      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true });
      });
    });
  });
});

// Create mock sensors for testing
router.get('/generate-mock', (req, res) => {
  const mockSensors = [
    { name: "Датчик 1", temp_min: 18, temp_max: 26, humidity_min: 30, humidity_max: 60 },
    { name: "Датчик 2", temp_min: 19, temp_max: 25, humidity_min: 35, humidity_max: 55 },
    { name: "Датчик 3", temp_min: 20, temp_max: 28, humidity_min: 40, humidity_max: 65 },
    { name: "Датчик серверной", temp_min: 16, temp_max: 22, humidity_min: 30, humidity_max: 50 },
    { name: "Датчик склада", temp_min: 15, temp_max: 24, humidity_min: 35, humidity_max: 70 },
    { name: "Датчик офиса", temp_min: 20, temp_max: 25, humidity_min: 40, humidity_max: 60 },
    { name: "Датчик лаборатории", temp_min: 21, temp_max: 23, humidity_min: 45, humidity_max: 55 },
    { name: "Датчик коридора", temp_min: 18, temp_max: 27, humidity_min: 30, humidity_max: 65 },
    { name: "Датчик производства", temp_min: 16, temp_max: 30, humidity_min: 25, humidity_max: 70 },
    { name: "Датчик столовой", temp_min: 19, temp_max: 26, humidity_min: 35, humidity_max: 60 }
  ];

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM sensors', (err) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }

      const stmt = db.prepare(
        'INSERT INTO sensors (name, temp_min, temp_max, humidity_min, humidity_max) VALUES (?, ?, ?, ?, ?)'
      );

      mockSensors.forEach((sensor) => {
        stmt.run([
          sensor.name,
          sensor.temp_min,
          sensor.temp_max,
          sensor.humidity_min,
          sensor.humidity_max
        ]);
      });

      stmt.finalize();
      
      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true, sensors: mockSensors });
      });
    });
  });
});

export default router;

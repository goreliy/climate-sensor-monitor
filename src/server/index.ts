
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Инициализация базы данных
const db = new sqlite3.Database(path.join(__dirname, 'sensors.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Создание таблиц при первом запуске
    db.run(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER NOT NULL,
        temperature REAL NOT NULL,
        humidity REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sensor_id) REFERENCES sensors(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS sensors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        temp_min REAL NOT NULL,
        temp_max REAL NOT NULL,
        humidity_min REAL NOT NULL,
        humidity_max REAL NOT NULL
      )
    `);
  }
});

// API endpoints
app.get('/api/sensors', (req, res) => {
  db.all('SELECT * FROM sensors', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/sensors/:id/readings', (req, res) => {
  const { id } = req.params;
  const { limit = 30 } = req.query;
  
  db.all(
    'SELECT * FROM sensor_readings WHERE sensor_id = ? ORDER BY timestamp DESC LIMIT ?',
    [id, limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.post('/api/readings', (req, res) => {
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

// Сохранение настроек датчиков
app.post('/api/sensors/config', (req, res) => {
  const sensors = req.body;
  
  if (!Array.isArray(sensors) || sensors.length > 60) {
    res.status(400).json({ error: 'Invalid sensors configuration' });
    return;
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Очищаем существующие датчики
    db.run('DELETE FROM sensors', (err) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }

      // Добавляем новые датчики
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

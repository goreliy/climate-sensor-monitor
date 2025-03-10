
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';
import { VisualizationMap } from '@/components/settings/types';

const app = express();
app.use(cors());
app.use(express.json());

// Database-related types
interface DBVisualizationMap {
  id: number;
  name: string;
  image_path: string;
  sensor_placements: string;
  created_at: string;
}

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

    // Создание таблицы для схем визуализации
    db.run(`
      CREATE TABLE IF NOT EXISTS visualization_maps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_path TEXT NOT NULL,
        sensor_placements TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// API для работы с визуализациями
app.post('/api/visualizations', (req, res) => {
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

app.get('/api/visualizations', (req, res) => {
  db.all('SELECT * FROM visualization_maps', [], (err, rows: DBVisualizationMap[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Преобразуем JSON строки в объекты
    const maps = rows.map(row => ({
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      sensorPlacements: JSON.parse(row.sensor_placements),
    }));
    
    res.json(maps);
  });
});

app.get('/api/visualizations/:id', (req, res) => {
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
    
    // Преобразуем JSON строку в объект
    const map = {
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      sensorPlacements: JSON.parse(row.sensor_placements),
    };
    
    res.json(map);
  });
});

// Мок настроек для тестирования
let mockSettings = {
  modbusPort: "COM1",
  modbusBaudRate: 9600,
  modbusDataBits: 8,
  modbusParity: "none",
  modbusStopBits: 1,
  dbPath: "./data/sensors.db",
  logLevel: "info",
  logPath: "./logs/app.log",
  logSizeLimit: 100, // размер в МБ
  telegramToken: "",
  telegramChatId: "",
  enableNotifications: true,
  sendThresholdAlerts: true,
  sendPeriodicReports: false,
  reportFrequency: "daily", // daily, weekly, monthly
  allowCommandRequests: true,
  pollingInterval: 5000,
};

// Получение настроек
app.get('/api/settings', (req, res) => {
  res.json(mockSettings);
});

// Сохранение настроек
app.post('/api/settings', (req, res) => {
  mockSettings = { ...mockSettings, ...req.body };
  res.json({ success: true });
});

// Создание моковых датчиков для тестирования
app.get('/api/generate-mock-sensors', (req, res) => {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

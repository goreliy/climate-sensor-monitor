
import sqlite3 from 'sqlite3';
import path from 'path';

// Database-related types
export interface DBVisualizationMap {
  id: number;
  name: string;
  image_path: string;
  sensor_placements: string;
  created_at: string;
}

// Initialize the database
const dbPath = path.join(__dirname, '..', 'sensors.db');
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Create tables on first run
    initTables();
  }
});

// Initialize database tables
function initTables() {
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

  // Create table for visualization maps
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

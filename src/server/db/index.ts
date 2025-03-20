
// Web-friendly database implementation that works in both browser and Node.js
// No native dependencies required

// Database-related types
export interface DBVisualizationMap {
  id: number;
  name: string;
  image_path: string;
  sensor_placements: string;
  created_at: string;
}

// In-memory database for development purposes
class InMemoryDB {
  private data: { [table: string]: any[] };
  private counters: { [table: string]: number };

  constructor() {
    this.data = {
      sensor_readings: [],
      sensors: [],
      visualization_maps: []
    };
    
    this.counters = {
      sensor_readings: 0,
      sensors: 0,
      visualization_maps: 0
    };
    
    console.log('Initialized in-memory database');
    this.seedData();
  }
  
  // Method to execute "SQL-like" operations
  run(sql: string, params?: any, callback?: (err: Error | null) => void): void {
    console.log(`Executing query: ${sql.substring(0, 50)}...`);
    
    // Check if it's a CREATE TABLE statement
    if (sql.trim().toUpperCase().startsWith('CREATE TABLE')) {
      const match = sql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
      if (match && match[1]) {
        const tableName = match[1];
        if (!this.data[tableName]) {
          this.data[tableName] = [];
          this.counters[tableName] = 0;
          console.log(`Created table: ${tableName}`);
        }
      }
    }
    
    // Execute callback if provided
    if (callback) {
      callback(null);
    }
  }
  
  // Seed the database with some initial data
  private seedData(): void {
    // Add sample sensors
    for (let i = 1; i <= 5; i++) {
      this.data.sensors.push({
        id: i,
        name: `Sensor ${i}`,
        temp_min: 18,
        temp_max: 28,
        humidity_min: 30,
        humidity_max: 70
      });
    }
    this.counters.sensors = 5;
    
    // Add sample sensor readings
    const now = new Date();
    for (let i = 1; i <= 5; i++) {
      for (let j = 0; j < 24; j++) {
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - j);
        
        this.data.sensor_readings.push({
          id: this.counters.sensor_readings++,
          sensor_id: i,
          temperature: 22 + (Math.random() * 6 - 3),
          humidity: 50 + (Math.random() * 20 - 10),
          timestamp: timestamp.toISOString()
        });
      }
    }
    
    // Add sample visualization map
    this.data.visualization_maps.push({
      id: 1,
      name: 'Office Floor Plan',
      image_path: '/placeholder.svg',
      sensor_placements: JSON.stringify([
        { sensor_id: 1, x: 100, y: 100 },
        { sensor_id: 2, x: 300, y: 150 },
        { sensor_id: 3, x: 500, y: 100 },
        { sensor_id: 4, x: 200, y: 300 },
        { sensor_id: 5, x: 400, y: 350 }
      ]),
      created_at: new Date().toISOString()
    });
    this.counters.visualization_maps = 1;
    
    console.log('Seeded database with sample data');
  }
  
  // Query method for SELECT statements
  all(sql: string, params: any, callback: (err: Error | null, rows: any[]) => void): void {
    console.log(`Executing query: ${sql.substring(0, 50)}...`);
    
    // Extract the table name from the query
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch || !tableMatch[1]) {
      callback(new Error('Invalid query - could not determine table name'), []);
      return;
    }
    
    const tableName = tableMatch[1];
    if (!this.data[tableName]) {
      callback(null, []);
      return;
    }
    
    // For simplicity, return all data from the table
    // In a real implementation, you would parse the SQL and filter accordingly
    callback(null, [...this.data[tableName]]);
  }
  
  // Method to get a single row
  get(sql: string, params: any, callback: (err: Error | null, row: any) => void): void {
    this.all(sql, params, (err, rows) => {
      if (err) {
        callback(err, null);
        return;
      }
      
      callback(null, rows.length > 0 ? rows[0] : null);
    });
  }
}

// Initialize the database
console.log('Initializing web-compatible database...');
export const db = new InMemoryDB();

// Function to initialize database tables
export function initTables() {
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
  
  console.log('Database tables initialized');
}

// Initialize tables
initTables();

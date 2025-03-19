
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Import routes
import sensorsRoutes from './routes/sensors';
import readingsRoutes from './routes/readings';
import visualizationsRoutes from './routes/visualizations';
import modbusRoutes from './routes/modbus';
import systemRoutes from './routes/system';
import settingsRoutes from './routes/settings';
import databaseRoutes from './routes/database';

// Add color to console logs
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

console.log(`${colors.cyan}Starting Climate Sensor Monitor Server...${colors.reset}`);

const app = express();
app.use(cors());
app.use(express.json());

// Create necessary directories
const configDir = path.join(__dirname, 'config');
const logsDir = path.join(__dirname, 'logs');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log(`${colors.green}Created config directory: ${configDir}${colors.reset}`);
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log(`${colors.green}Created logs directory: ${logsDir}${colors.reset}`);
}

// Add API request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${colors.blue}[${timestamp}] ${req.method} ${req.url}${colors.reset}`);
  next();
});

// Register route modules
app.use('/api/sensors', sensorsRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/visualizations', visualizationsRoutes);
app.use('/api/modbus', modbusRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/database', databaseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mode switch endpoint
app.post('/api/mode/:mode', (req, res) => {
  const { mode } = req.params;
  console.log(`${colors.yellow}Switching to ${mode} mode${colors.reset}`);
  res.json({ success: true, mode });
});

// Start message
console.log(`${colors.green}Climate Sensor Monitor Server initializing...${colors.reset}`);
console.log(`${colors.green}Using Web Modbus implementation (no native dependencies required)${colors.reset}`);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`${colors.green}Server running on port ${PORT}${colors.reset}`);
  console.log(`${colors.green}Web interface available at http://localhost:${PORT === 3001 ? 8080 : PORT}${colors.reset}`);
  console.log(`${colors.yellow}IMPORTANT: This is a web-based emulation server for development purposes.${colors.reset}`);
  console.log(`${colors.yellow}It does not connect to real Modbus devices.${colors.reset}`);
});

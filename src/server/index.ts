
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

const app = express();
app.use(cors());
app.use(express.json());

// Create necessary directories
const configDir = path.join(__dirname, 'config');
const logsDir = path.join(__dirname, 'logs');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Register route modules
app.use('/api/sensors', sensorsRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/visualizations', visualizationsRoutes);
app.use('/api/modbus', modbusRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/database', databaseRoutes);

// Start message
console.log('Climate Sensor Monitor Server initializing...');
console.log('Using Web Modbus implementation (no native dependencies required)');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Web interface available at http://localhost:${PORT === 3001 ? 3000 : PORT}`);
});

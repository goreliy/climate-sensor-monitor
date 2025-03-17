
import express from 'express';
import cors from 'cors';
import path from 'path';

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

// Register route modules
app.use('/api/sensors', sensorsRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/visualizations', visualizationsRoutes);
app.use('/api/modbus', modbusRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/database', databaseRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

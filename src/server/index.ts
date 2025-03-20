
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

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

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create necessary directories
const configDir = path.join(__dirname, 'config');
const logsDir = path.join(__dirname, 'logs');
const routesDir = path.join(__dirname, 'routes');
const dbDir = path.join(__dirname, 'db');

// Check and create all necessary directories
[configDir, logsDir, routesDir, dbDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`${colors.green}Created directory: ${dir}${colors.reset}`);
  }
});

// Add API request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${colors.blue}[${timestamp}] ${req.method} ${req.url}${colors.reset}`);
  next();
});

// Simple mock route generator
const createMockRoute = (name) => {
  const router = express.Router();
  
  router.get('/', (req, res) => {
    res.json({ success: true, message: `Mock ${name} data`, data: [] });
  });
  
  return router;
};

// Import routes or use mock routes if they don't exist
const routeModules = [
  'sensors', 'readings', 'visualizations', 'modbus', 'system', 'settings', 'database'
];

// Import or create mock routes
routeModules.forEach(routeName => {
  try {
    let routeModule;
    try {
      // Try to dynamically import the route module
      const modulePath = path.join(__dirname, 'routes', `${routeName}.ts`);
      if (fs.existsSync(modulePath)) {
        routeModule = require(`./routes/${routeName}`).default;
        console.log(`${colors.green}Loaded route module: ${routeName}${colors.reset}`);
      } else {
        throw new Error(`Route module not found: ${modulePath}`);
      }
    } catch (err) {
      console.log(`${colors.yellow}Creating mock route for: ${routeName}${colors.reset}`);
      routeModule = createMockRoute(routeName);
      
      // Create a basic route file if it doesn't exist
      const routeFilePath = path.join(routesDir, `${routeName}.ts`);
      if (!fs.existsSync(routeFilePath)) {
        const routeTemplate = `
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: '${routeName} data', data: [] });
});

export default router;
`;
        fs.writeFileSync(routeFilePath, routeTemplate);
        console.log(`${colors.green}Created route file: ${routeFilePath}${colors.reset}`);
      }
    }
    
    app.use(`/api/${routeName}`, routeModule);
  } catch (error) {
    console.error(`${colors.red}Error setting up route for ${routeName}:${colors.reset}`, error);
    // Use a basic mock route as fallback
    app.use(`/api/${routeName}`, createMockRoute(routeName));
  }
});

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

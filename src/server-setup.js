
/**
 * This file is used to compile and run the server
 * It compiles TypeScript to JavaScript and then runs the server
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create necessary directories
const configDir = path.join(__dirname, 'server', 'config');
const logsDir = path.join(__dirname, 'server', 'logs');
const routesDir = path.join(__dirname, 'server', 'routes');

// Check if directories exist and create them if they don't
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log(`Created config directory: ${configDir}`);
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log(`Created logs directory: ${logsDir}`);
}

if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir, { recursive: true });
  console.log(`Created routes directory: ${routesDir}`);
}

console.log('Attempting to start the server...');

// Create an in-memory server implementation as fallback
const createFallbackServer = () => {
  console.log('Creating fallback in-memory server implementation...');
  
  // Create a fallback implementation file
  const fallbackServerPath = path.join(__dirname, 'server', 'fallback-server.js');
  const fallbackServerContent = `
// Fallback server implementation
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Basic routes for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/system/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: 'fallback',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString() 
  });
});

// Mock data routes
const mockRoutes = [
  'sensors', 'readings', 'visualizations', 'modbus', 'settings', 'database'
];

mockRoutes.forEach(route => {
  app.get(\`/api/\${route}\`, (req, res) => {
    res.json({ 
      success: true, 
      message: \`\${route} data (fallback)\`, 
      data: [],
      timestamp: new Date().toISOString() 
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`Fallback server running on port \${PORT}\`);
  console.log(\`Web interface available at http://localhost:8080\`);
});
`;
  
  fs.writeFileSync(fallbackServerPath, fallbackServerContent);
  console.log(`Created fallback server at: ${fallbackServerPath}`);
  
  try {
    console.log('Starting fallback server...');
    // Use double quotes around file paths to handle spaces
    execSync(`node "${fallbackServerPath}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error starting fallback server: ${error.message}`);
    process.exit(1);
  }
};

try {
  // First ensure the dist directory exists
  const distDir = path.join(process.cwd(), 'dist', 'server');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log(`Created dist directory: ${distDir}`);
  }
  
  try {
    // Try to start with ts-node with fixed command syntax
    console.log('Attempting to start server using ts-node...');
    execSync('npx ts-node --transpile-only -P tsconfig.node.json src/server/index.ts', { stdio: 'inherit' });
  } catch (tsNodeError) {
    console.log(`ts-node failed: ${tsNodeError.message}`);
    console.log('Falling back to TypeScript compilation...');
    
    try {
      console.log('Compiling with TypeScript...');
      execSync('npx typescript --project tsconfig.node.json', { stdio: 'inherit' });
      
      const compiledFile = path.join(process.cwd(), 'dist', 'server', 'index.js');
      if (fs.existsSync(compiledFile)) {
        console.log('Compilation successful, running compiled JavaScript...');
        execSync(`node "${compiledFile}"`, { stdio: 'inherit' });
      } else {
        console.error('Compiled file not found, starting fallback server...');
        createFallbackServer();
      }
    } catch (tscError) {
      console.error(`TypeScript compilation failed: ${tscError.message}`);
      console.log('Starting fallback server...');
      createFallbackServer();
    }
  }
} catch (error) {
  console.error(`Error in server setup: ${error.message}`);
  console.log('Starting fallback server...');
  createFallbackServer();
}


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

try {
  // Use direct TypeScript compilation approach
  console.log('Compiling TypeScript...');
  
  // First ensure the dist directory exists
  const distDir = path.join(process.cwd(), 'dist', 'server');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log(`Created dist directory: ${distDir}`);
  }
  
  // Compile TypeScript files
  execSync('npx tsc --project tsconfig.node.json', { stdio: 'inherit' });
  
  // Run the compiled JavaScript
  console.log('Running compiled JavaScript...');
  execSync('node dist/server/index.js', { stdio: 'inherit' });
} catch (error) {
  console.error(`Error starting server: ${error.message}`);
  console.log('\nTo start the server, try this command:');
  console.log('npm install --save-dev typescript ts-node @types/node @types/express @types/cors');
  console.log('npx tsc --project tsconfig.node.json');
  console.log('node dist/server/index.js');
  
  process.exit(1);
}

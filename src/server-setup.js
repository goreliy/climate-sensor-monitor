
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
  // Use typescript package directly instead of tsc alias
  console.log('Compiling TypeScript...');
  
  // First ensure the dist directory exists
  const distDir = path.join(process.cwd(), 'dist', 'server');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log(`Created dist directory: ${distDir}`);
  }
  
  // Compile TypeScript files using the typescript package
  console.log('Compiling with typescript...');
  execSync('npx typescript --project tsconfig.node.json', { stdio: 'inherit' });
  
  // Check if the compiled file exists
  const compiledFile = path.join(process.cwd(), 'dist', 'server', 'index.js');
  if (!fs.existsSync(compiledFile)) {
    throw new Error(`Compiled file not found: ${compiledFile}`);
  }
  
  // Run the compiled JavaScript
  console.log('Running compiled JavaScript...');
  execSync('node dist/server/index.js', { stdio: 'inherit' });
} catch (error) {
  console.error(`Error starting server: ${error.message}`);
  console.log('\nTo start the server, try these steps:');
  console.log('1. Install development dependencies:');
  console.log('   npm install --save-dev typescript ts-node @types/node @types/express @types/cors');
  console.log('\n2. Compile TypeScript:');
  console.log('   npx typescript --project tsconfig.node.json');
  console.log('\n3. Run server:');
  console.log('   node dist/server/index.js');
  
  process.exit(1);
}

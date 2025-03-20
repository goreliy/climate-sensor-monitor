
/**
 * This file is used to compile and run the server
 * It compiles TypeScript to JavaScript and then runs the server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
  // Check if ts-node is available
  try {
    require.resolve('ts-node');
    console.log('Using ts-node to run the server');
    execSync('npx ts-node --transpile-only src/server/index.ts', { stdio: 'inherit' });
  } catch (e) {
    console.log('ts-node not found, compiling TypeScript to JavaScript first');
    
    console.log('Compiling TypeScript...');
    execSync('npx tsc src/server/index.ts --outDir dist --esModuleInterop', { stdio: 'inherit' });
    
    console.log('Running compiled JavaScript...');
    execSync('node dist/server/index.js', { stdio: 'inherit' });
  }
} catch (error) {
  console.error(`Error starting server: ${error.message}`);
  console.log('\nTo start the server, run one of these commands:');
  console.log('1. Using ts-node:');
  console.log('   npx ts-node --transpile-only src/server/index.ts');
  console.log('\n2. Compile and run:');
  console.log('   npx tsc src/server/index.ts --outDir dist --esModuleInterop');
  console.log('   node dist/server/index.js');
  
  process.exit(1);
}


import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Mock client state
let isConnected = false;
let currentPort = null;
let mockRegisters = new Map();

// Initialize some mock register values
for (let i = 0; i < 100; i++) {
  mockRegisters.set(i, Math.floor(Math.random() * 65535));
}

// Helper for logging
const logModbusEvent = (event: any) => {
  const logsDir = path.join(__dirname, '..', 'logs');
  const logFile = path.join(logsDir, 'modbus.log');

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logEntry = JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n';
  fs.appendFileSync(logFile, logEntry);
};

// Get available ports
router.get('/scan', (req, res) => {
  // Mock COM ports
  const mockPorts = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'].map(path => ({ path }));
  
  res.json({ 
    success: true, 
    ports: mockPorts
  });
});

// Connect to port
router.post('/connect', (req, res) => {
  const { port, baudRate = 9600 } = req.body;

  if (!port) {
    return res.status(400).json({
      success: false,
      message: 'Port is required'
    });
  }

  // Simulate connection
  isConnected = true;
  currentPort = port;

  logModbusEvent({
    type: 'connect',
    port,
    baudRate
  });

  res.json({
    success: true,
    message: `Connected to ${port}`,
    isOpen: true
  });
});

// Disconnect from port
router.post('/disconnect', (req, res) => {
  isConnected = false;
  currentPort = null;

  logModbusEvent({
    type: 'disconnect'
  });

  res.json({
    success: true,
    message: 'Disconnected',
    isOpen: false
  });
});

// Get connection status
router.get('/status', (req, res) => {
  res.json({
    isOpen: isConnected,
    port: currentPort
  });
});

// Read registers
router.post('/read', (req, res) => {
  const { address = 0, length = 1, slaveId = 1, functionCode = 3 } = req.body;

  if (!isConnected) {
    return res.status(400).json({
      success: false,
      message: 'Not connected'
    });
  }

  // Generate mock data
  const data = Array.from({ length }, (_, i) => {
    const registerAddr = address + i;
    let value = mockRegisters.get(registerAddr) || 0;
    
    // Simulate some changes
    value += Math.floor(Math.random() * 10) - 5;
    mockRegisters.set(registerAddr, value);
    
    return value;
  });

  logModbusEvent({
    type: 'read',
    slaveId,
    functionCode,
    address,
    length,
    data
  });

  res.json({
    success: true,
    data,
    address,
    functionCode
  });
});

export default router;

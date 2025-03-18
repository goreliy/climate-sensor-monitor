
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

// Mock Modbus packet log
const MAX_LOG_ENTRIES = 100;
let modbusPacketLog: any[] = [];

// Helper for logging
const logModbusEvent = (event: any) => {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    const logFile = path.join(logsDir, 'modbus.log');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logEntry = JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n';
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('Error writing to modbus log file:', error);
  }
};

// Helper to create a mock Modbus packet
const createModbusPacket = (type: 'request' | 'response', slaveId: number, functionCode: number, dataHex: string) => {
  // Calculate a valid CRC (simplified mock version)
  const crc = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
  const isValid = Math.random() > 0.05; // 5% chance of CRC error

  // Create raw packet
  const rawPacket = `${slaveId.toString(16).padStart(2, '0')}${functionCode.toString(16).padStart(2, '0')}${dataHex}${isValid ? crc : 'ffff'}`;
  
  // Add to log with ID
  const packet = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    type,
    deviceAddress: slaveId,
    functionCode,
    data: dataHex,
    crc,
    raw: rawPacket,
    isValid
  };

  modbusPacketLog.unshift(packet);
  if (modbusPacketLog.length > MAX_LOG_ENTRIES) {
    modbusPacketLog.pop();
  }

  return packet;
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

  // Create connect packet
  const connectData = `${baudRate.toString(16).padStart(4, '0')}`;
  createModbusPacket('request', 0, 0, connectData);

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

  // Create disconnect packet
  createModbusPacket('request', 0, 0, '0000');

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

  // Create simulated modbus request packet
  const requestDataHex = `${address.toString(16).padStart(4, '0')}${length.toString(16).padStart(4, '0')}`;
  createModbusPacket('request', slaveId, functionCode, requestDataHex);

  // Create simulated modbus response packet
  const byteCount = length * 2;
  const responseDataHex = `${byteCount.toString(16).padStart(2, '0')}${data.map(v => v.toString(16).padStart(4, '0')).join('')}`;
  createModbusPacket('response', slaveId, functionCode, responseDataHex);

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

// Get modbus logs
router.get('/logs', (req, res) => {
  res.json(modbusPacketLog);
});

// Clear modbus logs
router.post('/logs/clear', (req, res) => {
  modbusPacketLog = [];
  res.json({ success: true, message: 'Logs cleared' });
});

export default router;

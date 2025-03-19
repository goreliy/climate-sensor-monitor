
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { setTimeout } from 'timers/promises';

const router = Router();

// Variables for real or mocked state
let isUsingMockData = true; // Default to mock mode since we're not using native modules
let isConnected = false;
let currentPort = null;
let mockRegisters = new Map();

// Initialize test register values
for (let i = 0; i < 100; i++) {
  mockRegisters.set(i, Math.floor(Math.random() * 65535));
}

// Modbus packet log
const MAX_LOG_ENTRIES = 100;
let modbusPacketLog: any[] = [];

// Helper function for logging
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

// Helper function to create a Modbus packet
const createModbusPacket = (type: 'request' | 'response', slaveId: number, functionCode: number, dataHex: string, isValid = true) => {
  // Calculate CRC (simplified)
  const crc = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
  
  // Create raw packet
  const rawPacket = `${slaveId.toString(16).padStart(2, '0')}${functionCode.toString(16).padStart(2, '0')}${dataHex}${isValid ? crc : 'ffff'}`;
  
  // Add to log
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

// Web-based emulation of Modbus RTU
class WebModbusRTU {
  private isOpen = false;
  private deviceId = 1;
  private lastError: Error | null = null;
  private delay = 50; // ms, to simulate real communication delays
  private portName: string | null = null;
  private mockDevices: Map<number, Map<number, number>> = new Map();

  constructor() {
    // Initialize some mock devices with random data
    for (let deviceId = 1; deviceId <= 5; deviceId++) {
      const registers = new Map();
      for (let reg = 0; reg < 100; reg++) {
        registers.set(reg, Math.floor(Math.random() * 65535));
      }
      this.mockDevices.set(deviceId, registers);
    }
  }

  async connectRTUBuffered(port: string, options: any): Promise<void> {
    // Simulate connection delay
    await setTimeout(100);
    
    if (port === 'ERROR') {
      this.lastError = new Error('Connection error (simulated)');
      throw this.lastError;
    }
    
    this.isOpen = true;
    this.portName = port;
  }

  async close(): Promise<void> {
    // Simulate disconnection delay
    await setTimeout(50);
    this.isOpen = false;
    this.portName = null;
  }

  setID(id: number): void {
    this.deviceId = id;
  }

  setTimeout(timeout: number): void {
    // Just store this for reference
    this.delay = Math.min(timeout, 100); // Cap at 100ms to keep UI responsive
  }

  get isOpen(): boolean {
    return this.isOpen;
  }

  async readHoldingRegisters(address: number, length: number): Promise<{ data: number[] }> {
    // Simulate communication delay
    await setTimeout(this.delay);
    
    // Simulate communication errors occasionally
    if (Math.random() < 0.05) { // 5% chance of error
      throw new Error('Simulated communication error');
    }
    
    const data: number[] = [];
    const deviceRegisters = this.mockDevices.get(this.deviceId) || new Map();
    
    for (let i = 0; i < length; i++) {
      const registerAddr = address + i;
      let value = deviceRegisters.get(registerAddr) || 0;
      
      // Add some random variation to simulate changing values
      value += Math.floor(Math.random() * 10) - 5;
      if (value < 0) value = 0;
      if (value > 65535) value = 65535;
      
      deviceRegisters.set(registerAddr, value);
      data.push(value);
    }
    
    if (!this.mockDevices.has(this.deviceId)) {
      this.mockDevices.set(this.deviceId, deviceRegisters);
    }
    
    return { data };
  }

  async readInputRegisters(address: number, length: number): Promise<{ data: number[] }> {
    // For simplicity, we'll use the same implementation as readHoldingRegisters
    return this.readHoldingRegisters(address, length);
  }

  async writeRegister(address: number, value: number): Promise<void> {
    // Simulate communication delay
    await setTimeout(this.delay);
    
    // Simulate communication errors occasionally
    if (Math.random() < 0.05) { // 5% chance of error
      throw new Error('Simulated communication error');
    }
    
    let deviceRegisters = this.mockDevices.get(this.deviceId);
    if (!deviceRegisters) {
      deviceRegisters = new Map();
      this.mockDevices.set(this.deviceId, deviceRegisters);
    }
    
    deviceRegisters.set(address, value);
  }
}

// Create our Modbus RTU instance
const modbusClient = new WebModbusRTU();

// Scanning available ports
router.get('/scan', async (req, res) => {
  try {
    // Simulate scanning delay
    await setTimeout(500);
    
    // Generate mock port list based on OS
    let mockPorts: { path: string }[] = [];
    
    // Get OS info from the system route
    try {
      const osResponse = await fetch('http://localhost:3001/api/system/os');
      const osData = await osResponse.json();
      
      if (osData.platform.includes('win')) {
        mockPorts = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'].map(path => ({ path }));
      } else if (osData.platform.includes('linux')) {
        mockPorts = ['/dev/ttyS0', '/dev/ttyS1', '/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyACM0'].map(path => ({ path }));
      } else {
        mockPorts = ['/dev/tty.usbserial', '/dev/tty.usbmodem1', '/dev/tty.usbmodem2'].map(path => ({ path }));
      }
    } catch (error) {
      // Fallback to Windows-style ports if we can't detect OS
      mockPorts = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'].map(path => ({ path }));
    }
    
    res.json({ 
      success: true, 
      ports: mockPorts,
      isMock: true
    });
  } catch (error) {
    console.error('Error scanning ports:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Failed to scan ports'
    });
  }
});

// Connect to port
router.post('/connect', async (req, res) => {
  const { port, baudRate = 9600, dataBits = 8, parity = 'none', stopBits = 1 } = req.body;

  if (!port) {
    return res.status(400).json({
      success: false,
      message: 'Port is required'
    });
  }

  try {
    // Close previous connection if exists
    if (modbusClient.isOpen) {
      await modbusClient.close();
    }
    
    // Serial port parameters
    const serialOptions = {
      baudRate: parseInt(baudRate),
      dataBits: parseInt(dataBits),
      parity: parity,
      stopBits: parseInt(stopBits),
      autoOpen: false
    };
    
    // Open connection
    await modbusClient.connectRTUBuffered(port, serialOptions);
    modbusClient.setTimeout(2000); // 2 sec timeout
    
    isConnected = true;
    currentPort = port;
    
    // Create connection packet
    const connectData = `${baudRate.toString(16).padStart(4, '0')}`;
    createModbusPacket('request', 0, 0, connectData);
    
    logModbusEvent({
      type: 'connect',
      port,
      baudRate,
      dataBits,
      parity,
      stopBits,
      isMock: true
    });
    
    res.json({
      success: true,
      message: `Connected to ${port} with baud rate ${baudRate} (Web Modbus emulation)`,
      isOpen: true,
      isMock: true
    });
  } catch (error) {
    console.error('Error connecting to port:', error);
    
    isConnected = false;
    
    res.json({
      success: false,
      message: `Failed to connect: ${error}`,
      isOpen: false,
      isMock: true,
      error: String(error)
    });
  }
});

// Disconnect from port
router.post('/disconnect', async (req, res) => {
  try {
    if (modbusClient.isOpen) {
      await modbusClient.close();
    }
    
    isConnected = false;
    currentPort = null;
    
    // Create disconnect packet
    createModbusPacket('request', 0, 0, '0000');
    
    logModbusEvent({
      type: 'disconnect',
      isMock: true
    });
    
    res.json({
      success: true,
      message: 'Disconnected (Web Modbus emulation)',
      isOpen: false,
      isMock: true
    });
  } catch (error) {
    console.error('Error disconnecting from port:', error);
    
    // Consider disconnected even with errors
    isConnected = false;
    currentPort = null;
    
    res.json({
      success: true,
      message: `Disconnected with error: ${error}`,
      isOpen: false,
      isMock: true,
      error: String(error)
    });
  }
});

// Connection status
router.get('/status', (req, res) => {
  res.json({
    isOpen: isConnected,
    port: currentPort,
    isMock: true
  });
});

// Read registers
router.post('/read', async (req, res) => {
  const { address = 0, length = 1, slaveId = 1, functionCode = 3 } = req.body;

  if (!isConnected) {
    return res.status(400).json({
      success: false,
      message: 'Not connected'
    });
  }

  try {
    // Set slave ID
    modbusClient.setID(slaveId);
    
    // Create request packet
    const requestDataHex = `${address.toString(16).padStart(4, '0')}${length.toString(16).padStart(4, '0')}`;
    createModbusPacket('request', slaveId, functionCode, requestDataHex);
    
    let data: number[] = [];
    
    // Choose function based on function code
    if (functionCode === 3) {
      // Read holding registers (FC=03)
      const result = await modbusClient.readHoldingRegisters(address, length);
      data = result.data;
    } else if (functionCode === 4) {
      // Read input registers (FC=04)
      const result = await modbusClient.readInputRegisters(address, length);
      data = result.data;
    } else {
      throw new Error(`Unsupported function code: ${functionCode}`);
    }
    
    // Create response packet
    const byteCount = length * 2;
    const responseDataHex = `${byteCount.toString(16).padStart(2, '0')}${data.map(v => v.toString(16).padStart(4, '0')).join('')}`;
    createModbusPacket('response', slaveId, functionCode, responseDataHex);
    
    logModbusEvent({
      type: 'read',
      slaveId,
      functionCode,
      address,
      length,
      data,
      isMock: true
    });
    
    res.json({
      success: true,
      data,
      address,
      functionCode,
      isMock: true
    });
  } catch (error) {
    console.error('Error reading registers:', error);
    
    // Generate test data on error
    const data = Array.from({ length }, (_, i) => {
      const registerAddr = address + i;
      let value = mockRegisters.get(registerAddr) || 0;
      mockRegisters.set(registerAddr, value);
      return value;
    });
    
    // Create error response packet
    const errorCode = 0x83; // 0x80 + function code
    const exceptionCode = 0x04; // Server failure
    const responseDataHex = exceptionCode.toString(16).padStart(2, '0');
    createModbusPacket('response', slaveId, errorCode, responseDataHex, false);
    
    logModbusEvent({
      type: 'read_error',
      slaveId,
      functionCode,
      address,
      length,
      error: String(error),
      fallbackData: data,
      isMock: true
    });
    
    res.json({
      success: true,
      data,
      address,
      functionCode,
      isMock: true,
      error: String(error)
    });
  }
});

// Write to register
router.post('/write', async (req, res) => {
  const { address = 0, value = 0, slaveId = 1 } = req.body;

  if (!isConnected) {
    return res.status(400).json({
      success: false,
      message: 'Not connected'
    });
  }

  try {
    // Set slave ID
    modbusClient.setID(slaveId);
    
    // Create request packet (FC=06)
    const dataHex = `${address.toString(16).padStart(4, '0')}${value.toString(16).padStart(4, '0')}`;
    createModbusPacket('request', slaveId, 6, dataHex);
    
    // Write to register
    await modbusClient.writeRegister(address, value);
    
    // Create response packet
    createModbusPacket('response', slaveId, 6, dataHex);
    
    logModbusEvent({
      type: 'write',
      slaveId,
      address,
      value,
      isMock: true
    });
    
    res.json({
      success: true,
      address,
      value,
      isMock: true
    });
  } catch (error) {
    console.error('Error writing to register:', error);
    
    // Update mock register on error
    mockRegisters.set(address, value);
    
    // Create error response packet
    const errorCode = 0x86; // 0x80 + function code
    const exceptionCode = 0x04; // Server failure
    const responseDataHex = exceptionCode.toString(16).padStart(2, '0');
    createModbusPacket('response', slaveId, errorCode, responseDataHex, false);
    
    logModbusEvent({
      type: 'write_error',
      slaveId,
      address,
      value,
      error: String(error),
      isMock: true
    });
    
    res.json({
      success: true,
      address,
      value,
      isMock: true,
      error: String(error)
    });
  }
});

// Modbus log
router.get('/logs', (req, res) => {
  res.json(modbusPacketLog);
});

// Clear Modbus log
router.post('/logs/clear', (req, res) => {
  modbusPacketLog = [];
  res.json({ success: true, message: 'Logs cleared' });
});

export default router;

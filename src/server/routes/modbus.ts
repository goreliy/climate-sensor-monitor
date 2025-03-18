import { Router } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';

const router = Router();

// Mock implementation for Modbus client
class MockModbusClient {
  private connected = false;
  private slaveId = 1;
  private port = '';
  private mockData = [0, 0, 42, 128, 256, 512, 1024, 2048];
  
  setID(id: number) {
    this.slaveId = id;
    return this;
  }
  
  async connectRTU(port: string, options: any, callback?: (err?: Error) => void) {
    try {
      console.log(`[MOCK] Connecting to ${port} with options:`, options);
      // Simulate some delay for connection
      await new Promise(resolve => setTimeout(resolve, 500));
      this.connected = true;
      this.port = port;
      
      if (callback) callback();
      return true;
    } catch (error) {
      if (callback) callback(error as Error);
      throw error;
    }
  }
  
  async close() {
    console.log('[MOCK] Disconnecting from port');
    await new Promise(resolve => setTimeout(resolve, 300));
    this.connected = false;
    this.port = '';
    return true;
  }
  
  isConnected() {
    return this.connected;
  }
  
  getPort() {
    return this.port;
  }
  
  async readHoldingRegisters(address: number, length: number) {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    
    console.log(`[MOCK] Reading ${length} holding registers from address ${address} with slave ID ${this.slaveId}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    
    // Generate mock data based on address and slave ID
    const data = Array(length).fill(0).map((_, i) => {
      const value = this.mockData[(address + i) % this.mockData.length];
      return value * this.slaveId; // Multiply by slave ID to make it vary by device
    });
    
    return { data };
  }
  
  async readInputRegisters(address: number, length: number) {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    
    console.log(`[MOCK] Reading ${length} input registers from address ${address} with slave ID ${this.slaveId}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    
    // Generate different mock data for input registers
    const data = Array(length).fill(0).map((_, i) => {
      const value = this.mockData[(address + i + 3) % this.mockData.length];
      return value * this.slaveId;
    });
    
    return { data };
  }
  
  async readCoils(address: number, length: number) {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    
    console.log(`[MOCK] Reading ${length} coils from address ${address} with slave ID ${this.slaveId}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    
    // Generate boolean values for coils
    const data = Array(length).fill(false).map((_, i) => {
      return ((address + i) % 3 === 0); // Simple pattern for mock boolean values
    });
    
    return { data };
  }
  
  async readDiscreteInputs(address: number, length: number) {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    
    console.log(`[MOCK] Reading ${length} discrete inputs from address ${address} with slave ID ${this.slaveId}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
    
    // Generate boolean values for discrete inputs
    const data = Array(length).fill(false).map((_, i) => {
      return ((address + i) % 2 === 0); // Different pattern for discrete inputs
    });
    
    return { data };
  }
}

// This will be the fake data for ports
const mockPortsData = {
  'windows': ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'],
  'linux': ['/dev/ttyS0', '/dev/ttyS1', '/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyACM0'],
  'darwin': ['/dev/tty.usbserial', '/dev/tty.usbmodem1', '/dev/tty.usbmodem2']
};

let client: MockModbusClient | null = null;
let isConnected = false;
let currentPort: string | null = null;

// Store Modbus logs
const modbusLogsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(modbusLogsDir)) {
  fs.mkdirSync(modbusLogsDir, { recursive: true });
}
const modbusLogsPath = path.join(modbusLogsDir, 'modbus_logs.json');

// Store mock logs
const modbusLogs: any[] = [];
let logId = 0;

// Generate a random hex string of a given length
const randomHex = (length: number) => {
  return Array(length).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
};

// Scan for available ports
router.get('/scan', async (req, res) => {
  try {
    console.log('Scanning for available serial ports (MOCK)');
    
    // Determine platform
    const platform = os.platform();
    let ports: string[] = [];
    
    if (platform.startsWith('win')) {
      ports = mockPortsData.windows;
    } else if (platform === 'linux') {
      ports = mockPortsData.linux;
    } else if (platform === 'darwin') {
      ports = mockPortsData.darwin;
    } else {
      ports = [];
    }
    
    console.log('Detected ports:', ports);
    
    res.json({ 
      success: true, 
      ports, 
      platform
    });
  } catch (error) {
    console.error('Error scanning ports:', error);
    res.status(200).json({ 
      success: false, 
      ports: [], // Return empty array so UI can handle it
      error: 'Failed to scan ports', 
      message: 'Не удалось просканировать порты. Проверьте права доступа.'
    });
  }
});

// Connect to a Modbus device
router.post('/connect', async (req, res) => {
  try {
    const { port, baudRate, dataBits, parity, stopBits } = req.body;
    
    if (!port) {
      return res.status(400).json({
        success: false,
        message: 'Не указан COM-порт для подключе��ия',
        error: 'Port is required'
      });
    }
    
    // If already connected, disconnect first
    if (client && isConnected) {
      try {
        await client.close();
        isConnected = false;
        currentPort = null;
      } catch (err) {
        console.error('Error disconnecting from previous port:', err);
      }
    }
    
    // Create a new MockModbusClient
    client = new MockModbusClient();
    
    // Connect to the specified port with the given parameters
    await client.connectRTU(port, { 
      baudRate: baudRate || 9600, 
      dataBits: dataBits || 8, 
      parity: parity || 'none', 
      stopBits: stopBits || 1 
    });
    
    isConnected = true;
    currentPort = port;
    
    // Set default slave ID
    client.setID(1);
    
    // Log the connection
    logModbusPacket({
      timestamp: new Date().toISOString(),
      type: "request",
      deviceAddress: 1,
      functionCode: 0, // Connection request
      data: randomHex(4),
      crc: randomHex(4),
      raw: `${randomHex(2)}${randomHex(2)}${randomHex(4)}${randomHex(4)}`,
      isValid: true
    });
    
    res.json({
      success: true,
      message: `Успешно подключено к ${port}`,
      isOpen: true
    });
  } catch (error) {
    console.error('Error connecting to port:', error);
    res.status(200).json({
      success: false,
      message: 'Не удалось подключиться к порту. ' + (error instanceof Error ? error.message : String(error)),
      error: String(error)
    });
  }
});

// Disconnect from Modbus device
router.post('/disconnect', async (req, res) => {
  try {
    if (client && isConnected) {
      await client.close();
      isConnected = false;
      currentPort = null;
      
      // Log the disconnection
      logModbusPacket({
        timestamp: new Date().toISOString(),
        type: "request",
        deviceAddress: 1,
        functionCode: 0, // Disconnection request
        data: randomHex(4),
        crc: randomHex(4),
        raw: `${randomHex(2)}${randomHex(2)}${randomHex(4)}${randomHex(4)}`,
        isValid: true
      });
      
      res.json({
        success: true,
        message: 'Порт успешно закрыт',
        isOpen: false
      });
    } else {
      res.json({
        success: true,
        message: 'Соединение уже закрыто',
        isOpen: false
      });
    }
  } catch (error) {
    console.error('Error disconnecting from port:', error);
    res.status(200).json({
      success: false,
      message: 'Не удалось отключиться от порта',
      error: String(error)
    });
  }
});

// Check connection status
router.get('/status', (req, res) => {
  try {
    res.json({
      isOpen: isConnected,
      port: currentPort
    });
  } catch (error) {
    console.error('Error checking port status:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось проверить статус порта',
      error: String(error)
    });
  }
});

// Read Modbus register data
router.post('/read', async (req, res) => {
  try {
    const { address, length, slaveId, functionCode } = req.body;
    
    if (!client || !isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Не установлено соединение Modbus',
        error: 'No Modbus connection'
      });
    }
    
    // Set slave ID if provided
    if (slaveId) {
      client.setID(slaveId);
    }
    
    let data;
    const actualFunctionCode = functionCode || 3;
    
    // Read based on function code
    if (actualFunctionCode === 3 || !functionCode) {
      // Default is to read holding registers (function code 3)
      data = await client.readHoldingRegisters(address || 0, length || 1);
    } else if (actualFunctionCode === 4) {
      // Read input registers (function code 4)
      data = await client.readInputRegisters(address || 0, length || 1);
    } else if (actualFunctionCode === 1) {
      // Read coils (function code 1)
      data = await client.readCoils(address || 0, length || 1);
    } else if (actualFunctionCode === 2) {
      // Read discrete inputs (function code 2)
      data = await client.readDiscreteInputs(address || 0, length || 1);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Неизвестный код функции',
        error: 'Unknown function code'
      });
    }
    
    // Log the request and response
    const requestData = randomHex(6);
    logModbusPacket({
      timestamp: new Date().toISOString(),
      type: "request",
      deviceAddress: slaveId || 1,
      functionCode: actualFunctionCode,
      data: requestData,
      crc: randomHex(4),
      raw: `${(slaveId || 1).toString(16).padStart(2, '0')}${actualFunctionCode.toString(16).padStart(2, '0')}${requestData}${randomHex(4)}`,
      isValid: true
    });
    
    const responseData = data.data.map((val: number) => val.toString(16).padStart(4, '0')).join('');
    logModbusPacket({
      timestamp: new Date().toISOString(),
      type: "response",
      deviceAddress: slaveId || 1,
      functionCode: actualFunctionCode,
      data: responseData,
      crc: randomHex(4),
      raw: `${(slaveId || 1).toString(16).padStart(2, '0')}${actualFunctionCode.toString(16).padStart(2, '0')}${responseData}${randomHex(4)}`,
      isValid: Math.random() > 0.1 // Occasionally simulate CRC errors
    });
    
    res.json({
      success: true,
      data: data.data,
      address,
      functionCode: actualFunctionCode
    });
  } catch (error) {
    console.error('Error reading Modbus registers:', error);
    res.status(200).json({
      success: false,
      message: 'Ошибка при чтении регистров Modbus',
      error: String(error)
    });
  }
});

// Get Modbus logs
router.get('/logs', (req, res) => {
  try {
    res.json(modbusLogs);
  } catch (error) {
    console.error('Error getting Modbus logs:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось получить логи Modbus',
      error: String(error)
    });
  }
});

// Clear Modbus logs
router.post('/logs/clear', (req, res) => {
  try {
    modbusLogs.length = 0;
    logId = 0;
    
    // Clear the log file
    fs.writeFileSync(modbusLogsPath, JSON.stringify([], null, 2));
    
    res.json({
      success: true,
      message: 'Логи Modbus очищены'
    });
  } catch (error) {
    console.error('Error clearing Modbus logs:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось очистить логи Modbus',
      error: String(error)
    });
  }
});

// Helper function to log Modbus packets
function logModbusPacket(packet: any) {
  // Add ID to the packet
  const packetWithId = { id: ++logId, ...packet };
  
  // Add to in-memory logs (keep max 100 entries)
  modbusLogs.push(packetWithId);
  if (modbusLogs.length > 100) {
    modbusLogs.shift();
  }
  
  // Save to file (async)
  try {
    fs.writeFileSync(modbusLogsPath, JSON.stringify(modbusLogs, null, 2));
  } catch (error) {
    console.error('Error saving Modbus logs to file:', error);
  }
}

export default router;

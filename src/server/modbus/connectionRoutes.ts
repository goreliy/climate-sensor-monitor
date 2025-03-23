
import { Request, Response } from 'express';
import { WebModbusRTU } from './WebModbusRTU';
import { createModbusPacket, logModbusEvent } from './utils';

// Variables for real or mocked state
let isConnected = false;
let currentPort: string | null = null;
let mockRegisters = new Map();

// Initialize test register values
for (let i = 0; i < 100; i++) {
  mockRegisters.set(i, Math.floor(Math.random() * 65535));
}

// Create our Modbus RTU instance
const modbusClient = new WebModbusRTU();

/**
 * Scanning available ports
 */
export async function scanPorts(req: Request, res: Response): Promise<void> {
  try {
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
}

/**
 * Connect to port
 */
export async function connectToPort(req: Request, res: Response): Promise<void> {
  const { port, baudRate = 9600, dataBits = 8, parity = 'none', stopBits = 1 } = req.body;

  if (!port) {
    res.status(400).json({
      success: false,
      message: 'Port is required'
    });
    return;
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
}

/**
 * Disconnect from port
 */
export async function disconnectFromPort(req: Request, res: Response): Promise<void> {
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
}

/**
 * Connection status
 */
export function getConnectionStatus(req: Request, res: Response): void {
  res.json({
    isOpen: isConnected,
    port: currentPort,
    isMock: true
  });
}

/**
 * Export modbusClient for other routes to use
 */
export { modbusClient, isConnected, mockRegisters };

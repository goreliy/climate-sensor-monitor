
import { Router } from 'express';
import os from 'os';

const router = Router();

// Mock port scanning for development - returns appropriate ports based on OS
router.get('/scan', (req, res) => {
  try {
    const platform = os.platform();
    let ports = [];
    
    // Generate mock ports based on detected OS
    if (platform === 'win32') {
      ports = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'];
    } else if (platform === 'linux') {
      ports = ['/dev/ttyMCX1', '/dev/ttyMCX2', '/dev/ttyMCX3', '/dev/ttyACM0', '/dev/ttyUSB0'];
    } else if (platform === 'darwin') {
      ports = ['/dev/tty.usbserial', '/dev/tty.usbmodem1', '/dev/tty.usbmodem2'];
    } else {
      ports = ['PORT1', 'PORT2', 'PORT3']; // Generic fallback
    }
    
    res.json({ 
      ports, 
      platform,
      success: true
    });
  } catch (error) {
    console.error('Error scanning ports:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to scan ports', 
      message: 'There was an error scanning for available ports'
    });
  }
});

// Add connect endpoint for the frontend to use
router.post('/connect', (req, res) => {
  try {
    const { port, baudRate, dataBits, parity, stopBits } = req.body;
    
    // In a real app, we'd use serialport package to open the connection
    // For mock purposes, just return success
    
    res.json({
      success: true,
      message: `Successfully connected to ${port}`,
      isOpen: true
    });
  } catch (error) {
    console.error('Error connecting to port:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to port',
      error: String(error)
    });
  }
});

// Add disconnect endpoint
router.post('/disconnect', (req, res) => {
  try {
    // In a real app, we'd close the serialport connection
    // For mock purposes, just return success
    
    res.json({
      success: true,
      message: 'Port successfully closed',
      isOpen: false
    });
  } catch (error) {
    console.error('Error disconnecting from port:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect from port',
      error: String(error)
    });
  }
});

// Add status endpoint
router.get('/status', (req, res) => {
  try {
    // In a real app, we'd check if the serialport is open
    // For mock purposes, just return closed
    
    res.json({
      isOpen: false,
      port: null
    });
  } catch (error) {
    console.error('Error checking port status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check port status',
      error: String(error)
    });
  }
});

export default router;

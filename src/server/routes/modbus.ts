
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
    
    // In production environments with real hardware, this would use serialport.list()
    // to get actual available ports
    
    res.json({ 
      ports, 
      platform,
      success: true
    });
  } catch (error) {
    console.error('Error scanning ports:', error);
    res.status(500).json({ 
      success: false, 
      ports: [], // Return empty array so UI can handle it
      error: 'Failed to scan ports', 
      message: 'Не удалось просканировать порты. Проверьте права доступа.'
    });
  }
});

// Add connect endpoint for the frontend to use
router.post('/connect', (req, res) => {
  try {
    const { port, baudRate, dataBits, parity, stopBits } = req.body;
    
    if (!port) {
      return res.status(400).json({
        success: false,
        message: 'Не указан COM-порт для подключения',
        error: 'Port is required'
      });
    }
    
    // In a real app, we'd use serialport package to open the connection
    // For mock purposes, just return success
    
    res.json({
      success: true,
      message: `Успешно подключено к ${port}`,
      isOpen: true
    });
  } catch (error) {
    console.error('Error connecting to port:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось подключиться к порту',
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
      message: 'Порт успешно закрыт',
      isOpen: false
    });
  } catch (error) {
    console.error('Error disconnecting from port:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось отключиться от порта',
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
      message: 'Не удалось проверить статус порта',
      error: String(error)
    });
  }
});

export default router;

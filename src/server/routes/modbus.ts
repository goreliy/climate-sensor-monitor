
import { Router } from 'express';
import os from 'os';

const router = Router();

// Mock port scanning for development - returns appropriate ports based on OS
router.get('/scan', (req, res) => {
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
  
  res.json({ ports, platform });
});

export default router;

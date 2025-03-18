
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Mock settings for testing
let mockSettings = {
  modbusPort: "COM1",
  modbusBaudRate: 9600,
  modbusDataBits: 8,
  modbusParity: "none",
  modbusStopBits: 1,
  modbusAutoStart: false,
  dbPath: "./data/sensors.db",
  logLevel: "info",
  logPath: "./logs/app.log",
  logSizeLimit: 100, // size in MB
  modbusLogSize: 1,
  telegramToken: "",
  telegramChatId: "",
  enableNotifications: true,
  sendThresholdAlerts: true,
  sendPeriodicReports: false,
  reportFrequency: "daily", // daily, weekly, monthly
  allowCommandRequests: true,
  pollingInterval: 5000,
};

// Get settings
router.get('/', (req, res) => {
  res.json(mockSettings);
});

// Save settings
router.post('/', (req, res) => {
  mockSettings = { ...mockSettings, ...req.body };
  res.json({ success: true });
});

// Save settings to JSON file (for testing)
router.post('/save-json', (req, res) => {
  try {
    // In a real app, we'd save to a proper location
    // For mock purposes, we'll just return success
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings to JSON:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;


import { Router } from 'express';

const router = Router();

// Mock settings for testing
let mockSettings = {
  modbusPort: "COM1",
  modbusBaudRate: 9600,
  modbusDataBits: 8,
  modbusParity: "none",
  modbusStopBits: 1,
  dbPath: "./data/sensors.db",
  logLevel: "info",
  logPath: "./logs/app.log",
  logSizeLimit: 100, // size in MB
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

export default router;

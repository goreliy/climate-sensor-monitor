
import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Define path for settings storage
const settingsPath = path.join(__dirname, '..', 'settings.json');

// Load settings from file or use defaults
const loadSettings = () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  // Default settings
  return {
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
};

// Get current settings
let currentSettings = loadSettings();

// Get settings
router.get('/', (req, res) => {
  try {
    res.json(currentSettings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Не удалось получить настройки' 
    });
  }
});

// Save settings
router.post('/', (req, res) => {
  try {
    currentSettings = { ...currentSettings, ...req.body };
    
    // Save to file
    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2), 'utf8');
    
    res.json({ success: true, message: 'Настройки сохранены' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Не удалось сохранить настройки' 
    });
  }
});

// Save settings to JSON file
router.post('/save-json', (req, res) => {
  try {
    const data = req.body;
    
    // Create directory if it doesn't exist
    const configDir = path.join(__dirname, '..', 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Save to a timestamped file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(configDir, `settings-${timestamp}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');
    
    res.json({ 
      success: true, 
      message: 'Настройки сохранены в JSON файл',
      path: backupPath
    });
  } catch (error) {
    console.error('Error saving settings to JSON:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Не удалось сохранить настройки в JSON файл' 
    });
  }
});

export default router;

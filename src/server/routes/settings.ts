
import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Define paths for settings storage
const configDir = path.join(__dirname, '..', 'config');
const settingsPath = path.join(configDir, 'settings.json');
const visualizationSchemaPath = path.join(configDir, 'visualization.json');
const visualizationBackupDir = path.join(configDir, 'visualization_backups');
const settingsBackupDir = path.join(configDir, 'settings_backups');

// Ensure all config directories exist
const ensureConfigDirs = () => {
  [configDir, visualizationBackupDir, settingsBackupDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Load settings from file or use defaults
const loadSettings = () => {
  try {
    ensureConfigDirs();
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

// Create a timestamped backup file name
const getTimestampedFileName = (prefix: string, extension: string = 'json') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.${extension}`;
};

// Save file with backup
const saveWithBackup = (filePath: string, backupDir: string, data: any): string => {
  ensureConfigDirs();
  
  // Create backup first if the file exists
  if (fs.existsSync(filePath)) {
    const backupFileName = getTimestampedFileName(path.basename(filePath, '.json'));
    const backupPath = path.join(backupDir, backupFileName);
    fs.copyFileSync(filePath, backupPath);
  }
  
  // Save new data
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return filePath;
};

// Get settings
router.get('/', (req: Request, res: Response): void => {
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
router.post('/', (req: Request, res: Response): void => {
  try {
    currentSettings = { ...currentSettings, ...req.body };
    
    // Save to file with backup
    saveWithBackup(settingsPath, settingsBackupDir, currentSettings);
    
    res.json({ 
      success: true, 
      message: 'Настройки сохранены',
      path: settingsPath
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Не удалось сохранить настройки' 
    });
  }
});

// Save settings to JSON file (with timestamp for backup)
router.post('/save-json', (req: Request, res: Response): void => {
  try {
    const data = req.body;
    
    // Create a timestamped backup file
    const backupFileName = getTimestampedFileName('settings');
    const backupPath = path.join(settingsBackupDir, backupFileName);
    
    ensureConfigDirs();
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

// Save visualization schema
router.post('/visualization', (req: Request, res: Response): void => {
  try {
    const schema = req.body;
    
    // Save with backup
    saveWithBackup(visualizationSchemaPath, visualizationBackupDir, schema);
    
    res.json({
      success: true,
      message: 'Схема визуализации успешно сохранена',
      path: visualizationSchemaPath
    });
  } catch (error) {
    console.error('Error saving visualization schema:', error);
    res.status(500).json({
      success: false,
      error: String(error),
      message: 'Не удалось сохранить схему визуализации'
    });
  }
});

// Get visualization schema
router.get('/visualization', (req: Request, res: Response): void => {
  try {
    ensureConfigDirs();
    if (fs.existsSync(visualizationSchemaPath)) {
      const data = fs.readFileSync(visualizationSchemaPath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      // Return empty schema if no file exists
      res.json({
        elements: [],
        connections: []
      });
    }
  } catch (error) {
    console.error('Error loading visualization schema:', error);
    res.status(500).json({
      success: false,
      error: String(error),
      message: 'Не удалось загрузить схему визуализации'
    });
  }
});

// Get backup files list
router.get('/backups', (req: Request, res: Response): void => {
  try {
    ensureConfigDirs();
    
    // Get list of backup files
    const settingsBackups = fs.readdirSync(settingsBackupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(settingsBackupDir, file),
        type: 'settings',
        date: new Date(fs.statSync(path.join(settingsBackupDir, file)).mtime).toISOString()
      }));
    
    const visualizationBackups = fs.readdirSync(visualizationBackupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(visualizationBackupDir, file),
        type: 'visualization',
        date: new Date(fs.statSync(path.join(visualizationBackupDir, file)).mtime).toISOString()
      }));
    
    res.json({
      settings: settingsBackups,
      visualizations: visualizationBackups
    });
  } catch (error) {
    console.error('Error getting backup files:', error);
    res.status(500).json({
      success: false,
      error: String(error),
      message: 'Не удалось получить список резервных копий'
    });
  }
});

// Get a specific backup file
router.get('/backups/:type/:filename', (req: Request, res: Response): void => {
  try {
    const { type, filename } = req.params;
    const backupDir = type === 'settings' ? settingsBackupDir : visualizationBackupDir;
    
    const filePath = path.join(backupDir, filename);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({
        success: false,
        message: 'Файл не найден'
      });
    }
  } catch (error) {
    console.error('Error reading backup file:', error);
    res.status(500).json({
      success: false,
      error: String(error),
      message: 'Не удалось прочитать файл резервной копии'
    });
  }
});

// Restore from backup
router.post('/restore/:type/:filename', (req: Request, res: Response): void => {
  try {
    const { type, filename } = req.params;
    const backupDir = type === 'settings' ? settingsBackupDir : visualizationBackupDir;
    const targetPath = type === 'settings' ? settingsPath : visualizationSchemaPath;
    
    const backupPath = path.join(backupDir, filename);
    
    if (fs.existsSync(backupPath)) {
      // Read backup data
      const backupData = fs.readFileSync(backupPath, 'utf8');
      
      // Create a backup of current file before restoring
      if (fs.existsSync(targetPath)) {
        const currentBackupFileName = getTimestampedFileName(`${type}-before-restore`);
        const currentBackupPath = path.join(backupDir, currentBackupFileName);
        fs.copyFileSync(targetPath, currentBackupPath);
      }
      
      // Restore from backup
      fs.writeFileSync(targetPath, backupData, 'utf8');
      
      // Update current settings if restoring settings
      if (type === 'settings') {
        currentSettings = JSON.parse(backupData);
      }
      
      res.json({
        success: true,
        message: `Восстановлено из резервной копии ${filename}`
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Файл резервной копии не найден'
      });
    }
  } catch (error) {
    console.error('Error restoring from backup:', error);
    res.status(500).json({
      success: false,
      error: String(error),
      message: 'Не удалось восстановить из резервной копии'
    });
  }
});

export default router;

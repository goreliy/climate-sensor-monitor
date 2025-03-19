
import { Router } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

// Get system status
router.get('/status', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({
      success: true,
      status: {
        uptime: uptime,
        uptimeFormatted: formatUptime(uptime),
        memory: {
          rss: bytesToSize(memUsage.rss),
          heapTotal: bytesToSize(memUsage.heapTotal),
          heapUsed: bytesToSize(memUsage.heapUsed),
          external: bytesToSize(memUsage.external),
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      }
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Failed to get system status' 
    });
  }
});

// Get operating system information
router.get('/os', (req, res) => {
  try {
    const info = {
      os: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalMem: bytesToSize(os.totalmem()),
      freeMem: bytesToSize(os.freemem()),
      cpus: os.cpus(),
      networkInterfaces: os.networkInterfaces(),
    };
    
    res.json({
      success: true,
      os: info.os,
      platform: info.platform,
      info
    });
  } catch (error) {
    console.error('Error getting OS info:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Failed to get OS information' 
    });
  }
});

// Helper function to format byte sizes
function bytesToSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Get real disk space info (works on Windows and Unix)
router.get('/diskspace', async (req, res) => {
  try {
    // Get the current directory
    const currentDir = path.resolve('.');
    
    // On Windows, get the drive letter
    const rootDir = process.platform === 'win32' 
      ? currentDir.split(path.sep)[0] + path.sep
      : '/';
    
    // Use platform-specific commands to get disk info
    let diskData;
    
    if (process.platform === 'win32') {
      // Windows command
      const { stdout } = await execAsync(`wmic logicaldisk where "DeviceID='${rootDir.charAt(0)}:'" get Size,FreeSpace /format:csv`);
      const lines = stdout.trim().split('\n');
      
      if (lines.length >= 2) {
        const parts = lines[1].split(',');
        if (parts.length >= 3) {
          const freeSpace = parseInt(parts[1]);
          const totalSize = parseInt(parts[2]);
          const usedSpace = totalSize - freeSpace;
          const percentUsed = Math.round((usedSpace / totalSize) * 100);
          
          diskData = {
            filesystem: rootDir,
            size: bytesToSize(totalSize),
            used: bytesToSize(usedSpace),
            available: bytesToSize(freeSpace),
            use: `${percentUsed}%`,
            mountedOn: rootDir
          };
        }
      }
    } else {
      // Unix command
      const { stdout } = await execAsync(`df -h ${rootDir} | tail -1`);
      const parts = stdout.trim().split(/\s+/);
      
      if (parts.length >= 6) {
        diskData = {
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          use: parts[4],
          mountedOn: parts[5]
        };
      }
    }
    
    // Fallback if commands fail
    if (!diskData) {
      diskData = {
        filesystem: rootDir,
        size: 'Unknown',
        used: 'Unknown',
        available: 'Unknown',
        use: 'Unknown',
        mountedOn: rootDir
      };
    }
    
    res.json({
      success: true,
      disk: diskData
    });
  } catch (error) {
    console.error('Error getting disk space:', error);
    // Return basic info if command fails
    res.json({
      success: true,
      disk: {
        filesystem: process.platform === 'win32' ? 'C:\\' : '/',
        size: 'Unknown',
        used: 'Unknown',
        available: 'Unknown',
        use: 'Unknown',
        mountedOn: process.platform === 'win32' ? 'C:\\' : '/'
      },
      error: String(error)
    });
  }
});

// Check if a module is installed and get its version
router.get('/check-module/:moduleName', async (req, res) => {
  const { moduleName } = req.params;
  
  try {
    // Try to load the module
    const moduleInfo = require.resolve(moduleName);
    let version = 'Unknown';
    
    // Try to get version from package.json
    try {
      const packageDir = moduleInfo.substring(0, moduleInfo.lastIndexOf('node_modules') + 12 + moduleName.length);
      const packageJsonPath = path.join(packageDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        version = packageData.version || 'Unknown';
      }
    } catch (versionError) {
      console.error(`Error getting version for ${moduleName}:`, versionError);
    }
    
    res.json({
      success: true,
      installed: true,
      moduleName,
      version,
      path: moduleInfo
    });
  } catch (error) {
    res.json({
      success: true,
      installed: false,
      moduleName,
      error: String(error)
    });
  }
});

// List available serial ports (API stub for compatibility)
router.get('/serial-ports', async (req, res) => {
  try {
    let ports = [];
    let serialportAvailable = false;
    
    // Check if serialport is available
    try {
      require.resolve('serialport');
      serialportAvailable = true;
    } catch (e) {
      serialportAvailable = false;
    }
    
    // Try to list ports if available
    if (serialportAvailable) {
      try {
        const { SerialPort } = require('serialport');
        ports = await SerialPort.list();
      } catch (portError) {
        console.error('Error listing serial ports:', portError);
      }
    }
    
    res.json({
      success: true,
      serialportAvailable,
      ports: ports.length > 0 ? ports : [
        { path: 'COM1', manufacturer: 'Mock', serialNumber: '12345', vendorId: '0000', productId: '0000' },
        { path: 'COM3', manufacturer: 'Mock', serialNumber: '67890', vendorId: '0000', productId: '0000' }
      ]
    });
  } catch (error) {
    console.error('Error getting serial ports:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Failed to get serial ports information' 
    });
  }
});

// Get installed libraries and versions
router.get('/libraries', (req, res) => {
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    let libraries = [];
    
    if (fs.existsSync(nodeModulesPath)) {
      // Read directories (but not all subdirectories to avoid infinite recursion)
      const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden directories and @types
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== '@types') {
          // For scoped packages (@something)
          if (entry.name.startsWith('@')) {
            const scopePath = path.join(nodeModulesPath, entry.name);
            const scopedEntries = fs.readdirSync(scopePath, { withFileTypes: true });
            
            for (const scopedEntry of scopedEntries) {
              if (scopedEntry.isDirectory()) {
                const packageJsonPath = path.join(scopePath, scopedEntry.name, 'package.json');
                
                if (fs.existsSync(packageJsonPath)) {
                  try {
                    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    libraries.push({
                      name: `${entry.name}/${scopedEntry.name}`,
                      version: packageData.version || 'Unknown'
                    });
                  } catch (e) {
                    // Skip if can't read package.json
                  }
                }
              }
            }
          } else {
            // Regular packages
            const packageJsonPath = path.join(nodeModulesPath, entry.name, 'package.json');
            
            if (fs.existsSync(packageJsonPath)) {
              try {
                const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                libraries.push({
                  name: entry.name,
                  version: packageData.version || 'Unknown'
                });
              } catch (e) {
                // Skip if can't read package.json
              }
            }
          }
        }
      }
    }
    
    res.json({
      success: true,
      libraries: libraries.sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('Error getting libraries:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Failed to get libraries information' 
    });
  }
});

export default router;

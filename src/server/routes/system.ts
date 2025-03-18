
import { Router } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';

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

// Get disk space
router.get('/diskspace', (req, res) => {
  try {
    // Get the current directory
    const currentDir = path.resolve('.');
    
    // On Windows, get the drive letter
    const rootDir = process.platform === 'win32' 
      ? currentDir.split(path.sep)[0] + path.sep
      : '/';
    
    // Use df command on Unix or dir on Windows (mocked for now)
    if (process.platform === 'win32') {
      res.json({
        success: true,
        disk: {
          filesystem: rootDir,
          size: '500GB',
          used: '250GB',
          available: '250GB',
          use: '50%',
          mountedOn: rootDir
        }
      });
    } else {
      res.json({
        success: true,
        disk: {
          filesystem: '/',
          size: '120GB',
          used: '80GB',
          available: '40GB',
          use: '66%',
          mountedOn: '/'
        }
      });
    }
  } catch (error) {
    console.error('Error getting disk space:', error);
    res.status(500).json({ 
      success: false, 
      error: String(error),
      message: 'Failed to get disk space information' 
    });
  }
});

// Check if a module is installed
router.get('/check-module/:moduleName', (req, res) => {
  const { moduleName } = req.params;
  
  try {
    // Simple way to check if a module is installed
    require.resolve(moduleName);
    res.json({
      success: true,
      installed: true,
      moduleName
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

export default router;

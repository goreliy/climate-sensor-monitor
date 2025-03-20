
import { Router } from 'express';
import os from 'os';

const router = Router();

// Get system status
router.get('/status', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    
    res.json({
      success: true,
      status: {
        uptime: process.uptime(),
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
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
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
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

export default router;

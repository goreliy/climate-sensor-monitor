
import { Router, Request, Response } from 'express';
import { scanPorts, connectToPort, disconnectFromPort, getConnectionStatus } from '../modbus/connectionRoutes';
import { readRegisters, writeRegister } from '../modbus/dataRoutes';
import { getLogs, clearLogs } from '../modbus/logRoutes';

const router = Router();

// Connection routes
router.get('/scan', scanPorts);
router.post('/connect', connectToPort);
router.post('/disconnect', disconnectFromPort);
router.get('/status', getConnectionStatus);

// Data operation routes
router.post('/read', readRegisters);
router.post('/write', writeRegister);

// Log management routes
router.get('/logs', getLogs);
router.post('/logs/clear', clearLogs);

export default router;

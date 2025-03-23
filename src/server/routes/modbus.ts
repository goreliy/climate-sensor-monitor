
import { Router } from 'express';
import { scanPorts, connectToPort, disconnectFromPort, getConnectionStatus } from '../modbus/connectionRoutes';
import { readRegisters, writeRegister } from '../modbus/dataRoutes';
import { getLogs, clearLogs } from '../modbus/logRoutes';

const router = Router();

// Connection routes
router.route('/scan').get(scanPorts);
router.route('/connect').post(connectToPort);
router.route('/disconnect').post(disconnectFromPort);
router.route('/status').get(getConnectionStatus);

// Data operation routes
router.route('/read').post(readRegisters);
router.route('/write').post(writeRegister);

// Log management routes
router.route('/logs').get(getLogs);
router.route('/logs/clear').post(clearLogs);

export default router;

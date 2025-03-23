
import { Router, Request, Response } from 'express';
import { scanPorts, connectToPort, disconnectFromPort, getConnectionStatus } from '../modbus/connectionRoutes';
import { readRegisters, writeRegister } from '../modbus/dataRoutes';
import { getLogs, clearLogs } from '../modbus/logRoutes';

const router = Router();

// Connection routes
router.get('/scan', (req: Request, res: Response) => scanPorts(req, res));
router.post('/connect', (req: Request, res: Response) => connectToPort(req, res));
router.post('/disconnect', (req: Request, res: Response) => disconnectFromPort(req, res));
router.get('/status', (req: Request, res: Response) => getConnectionStatus(req, res));

// Data operation routes
router.post('/read', (req: Request, res: Response) => readRegisters(req, res));
router.post('/write', (req: Request, res: Response) => writeRegister(req, res));

// Log management routes
router.get('/logs', (req: Request, res: Response) => getLogs(req, res));
router.post('/logs/clear', (req: Request, res: Response) => clearLogs(req, res));

export default router;

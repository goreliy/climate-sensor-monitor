
import { Request, Response } from 'express';
import { getModbusPacketLog, clearModbusPacketLog } from './utils';

/**
 * Get Modbus logs
 */
export function getLogs(req: Request, res: Response): void {
  res.json(getModbusPacketLog());
}

/**
 * Clear Modbus logs
 */
export function clearLogs(req: Request, res: Response): void {
  clearModbusPacketLog();
  res.json({ success: true, message: 'Logs cleared' });
}

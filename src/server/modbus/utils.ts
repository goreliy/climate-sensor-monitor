
import fs from 'fs';
import path from 'path';

// Modbus packet log
const MAX_LOG_ENTRIES = 100;
let modbusPacketLog: any[] = [];

/**
 * Helper function for logging Modbus events to file
 */
export const logModbusEvent = (event: any) => {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    const logFile = path.join(logsDir, 'modbus.log');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logEntry = JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + '\n';
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('Error writing to modbus log file:', error);
  }
};

/**
 * Helper function to create a Modbus packet and log it
 */
export const createModbusPacket = (type: 'request' | 'response', slaveId: number, functionCode: number, dataHex: string, isValid = true) => {
  // Calculate CRC (simplified)
  const crc = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
  
  // Create raw packet
  const rawPacket = `${slaveId.toString(16).padStart(2, '0')}${functionCode.toString(16).padStart(2, '0')}${dataHex}${isValid ? crc : 'ffff'}`;
  
  // Add to log
  const packet = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    type,
    deviceAddress: slaveId,
    functionCode,
    data: dataHex,
    crc,
    raw: rawPacket,
    isValid
  };

  modbusPacketLog.unshift(packet);
  if (modbusPacketLog.length > MAX_LOG_ENTRIES) {
    modbusPacketLog.pop();
  }

  return packet;
};

/**
 * Get the current modbus packet log
 */
export const getModbusPacketLog = () => modbusPacketLog;

/**
 * Clear the modbus packet log
 */
export const clearModbusPacketLog = () => {
  modbusPacketLog = [];
};

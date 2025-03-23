
import { Request, Response } from 'express';
import { createModbusPacket, logModbusEvent } from './utils';
import { modbusClient, isConnected, mockRegisters } from './connectionRoutes';

/**
 * Read registers
 */
export async function readRegisters(req: Request, res: Response): Promise<void> {
  const { address = 0, length = 1, slaveId = 1, functionCode = 3 } = req.body;

  if (!isConnected) {
    res.status(400).json({
      success: false,
      message: 'Not connected'
    });
    return;
  }

  try {
    // Set slave ID
    modbusClient.setID(slaveId);
    
    // Create request packet
    const requestDataHex = `${address.toString(16).padStart(4, '0')}${length.toString(16).padStart(4, '0')}`;
    createModbusPacket('request', slaveId, functionCode, requestDataHex);
    
    let data: number[] = [];
    
    // Choose function based on function code
    if (functionCode === 3) {
      // Read holding registers (FC=03)
      const result = await modbusClient.readHoldingRegisters(address, length);
      data = result.data;
    } else if (functionCode === 4) {
      // Read input registers (FC=04)
      const result = await modbusClient.readInputRegisters(address, length);
      data = result.data;
    } else {
      throw new Error(`Unsupported function code: ${functionCode}`);
    }
    
    // Create response packet
    const byteCount = length * 2;
    const responseDataHex = `${byteCount.toString(16).padStart(2, '0')}${data.map(v => v.toString(16).padStart(4, '0')).join('')}`;
    createModbusPacket('response', slaveId, functionCode, responseDataHex);
    
    logModbusEvent({
      type: 'read',
      slaveId,
      functionCode,
      address,
      length,
      data,
      isMock: true
    });
    
    res.json({
      success: true,
      data,
      address,
      functionCode,
      isMock: true
    });
  } catch (error) {
    console.error('Error reading registers:', error);
    
    // Generate test data on error
    const data = Array.from({ length }, (_, i) => {
      const registerAddr = address + i;
      let value = mockRegisters.get(registerAddr) || 0;
      mockRegisters.set(registerAddr, value);
      return value;
    });
    
    // Create error response packet
    const errorCode = 0x83; // 0x80 + function code
    const exceptionCode = 0x04; // Server failure
    const responseDataHex = exceptionCode.toString(16).padStart(2, '0');
    createModbusPacket('response', slaveId, errorCode, responseDataHex, false);
    
    logModbusEvent({
      type: 'read_error',
      slaveId,
      functionCode,
      address,
      length,
      error: String(error),
      fallbackData: data,
      isMock: true
    });
    
    res.json({
      success: true,
      data,
      address,
      functionCode,
      isMock: true,
      error: String(error)
    });
  }
}

/**
 * Write to register
 */
export async function writeRegister(req: Request, res: Response): Promise<void> {
  const { address = 0, value = 0, slaveId = 1 } = req.body;

  if (!isConnected) {
    res.status(400).json({
      success: false,
      message: 'Not connected'
    });
    return;
  }

  try {
    // Set slave ID
    modbusClient.setID(slaveId);
    
    // Create request packet (FC=06)
    const dataHex = `${address.toString(16).padStart(4, '0')}${value.toString(16).padStart(4, '0')}`;
    createModbusPacket('request', slaveId, 6, dataHex);
    
    // Write to register
    await modbusClient.writeRegister(address, value);
    
    // Create response packet
    createModbusPacket('response', slaveId, 6, dataHex);
    
    logModbusEvent({
      type: 'write',
      slaveId,
      address,
      value,
      isMock: true
    });
    
    res.json({
      success: true,
      address,
      value,
      isMock: true
    });
  } catch (error) {
    console.error('Error writing to register:', error);
    
    // Update mock register on error
    mockRegisters.set(address, value);
    
    // Create error response packet
    const errorCode = 0x86; // 0x80 + function code
    const exceptionCode = 0x04; // Server failure
    const responseDataHex = exceptionCode.toString(16).padStart(2, '0');
    createModbusPacket('response', slaveId, errorCode, responseDataHex, false);
    
    logModbusEvent({
      type: 'write_error',
      slaveId,
      address,
      value,
      error: String(error),
      isMock: true
    });
    
    res.json({
      success: true,
      address,
      value,
      isMock: true,
      error: String(error)
    });
  }
}


import { Router } from 'express';
import os from 'os';
// Import SerialPort and ModbusRTU
import SerialPort from 'serialport';
import ModbusRTU from 'modbus-serial';

const router = Router();
let client: ModbusRTU | null = null;
let isConnected = false;
let currentPort: string | null = null;

// Scan for available ports
router.get('/scan', async (req, res) => {
  try {
    // In a real environment, use serialport.list()
    const ports = await SerialPort.list();
    
    if (!ports || ports.length === 0) {
      console.log('No COM ports detected in system');
      return res.json({ 
        success: true, 
        ports: [], 
        platform: os.platform(),
        message: 'Порты не обнаружены. Проверьте подключение устройств.'
      });
    }

    const portPaths = ports.map(port => port.path);
    console.log('Detected ports:', portPaths);
    
    res.json({ 
      success: true, 
      ports: portPaths, 
      platform: os.platform()
    });
  } catch (error) {
    console.error('Error scanning ports:', error);
    res.status(200).json({ 
      success: false, 
      ports: [], // Return empty array so UI can handle it
      error: 'Failed to scan ports', 
      message: 'Не удалось просканировать порты. Проверьте права доступа.'
    });
  }
});

// Connect to a Modbus device
router.post('/connect', async (req, res) => {
  try {
    const { port, baudRate, dataBits, parity, stopBits } = req.body;
    
    if (!port) {
      return res.status(400).json({
        success: false,
        message: 'Не указан COM-порт для подключения',
        error: 'Port is required'
      });
    }
    
    // If already connected, disconnect first
    if (client && isConnected) {
      try {
        await client.close();
        isConnected = false;
        currentPort = null;
      } catch (err) {
        console.error('Error disconnecting from previous port:', err);
      }
    }
    
    // Create a new ModbusRTU client
    client = new ModbusRTU();
    
    // Connect to the specified port with the given parameters
    await new Promise<void>((resolve, reject) => {
      client!.connectRTU(port, { 
        baudRate: baudRate || 9600, 
        dataBits: dataBits || 8, 
        parity: parity || 'none', 
        stopBits: stopBits || 1 
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    isConnected = true;
    currentPort = port;
    
    // Set default slave ID
    client.setID(1);
    
    res.json({
      success: true,
      message: `Успешно подключено к ${port}`,
      isOpen: true
    });
  } catch (error) {
    console.error('Error connecting to port:', error);
    res.status(200).json({
      success: false,
      message: 'Не удалось подключиться к порту. ' + (error instanceof Error ? error.message : String(error)),
      error: String(error)
    });
  }
});

// Disconnect from Modbus device
router.post('/disconnect', async (req, res) => {
  try {
    if (client && isConnected) {
      await client.close();
      isConnected = false;
      currentPort = null;
      
      res.json({
        success: true,
        message: 'Порт успешно закрыт',
        isOpen: false
      });
    } else {
      res.json({
        success: true,
        message: 'Соединение уже закрыто',
        isOpen: false
      });
    }
  } catch (error) {
    console.error('Error disconnecting from port:', error);
    res.status(200).json({
      success: false,
      message: 'Не удалось отключиться от порта',
      error: String(error)
    });
  }
});

// Check connection status
router.get('/status', (req, res) => {
  try {
    res.json({
      isOpen: isConnected,
      port: currentPort
    });
  } catch (error) {
    console.error('Error checking port status:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось проверить статус порта',
      error: String(error)
    });
  }
});

// Read Modbus register data
router.post('/read', async (req, res) => {
  try {
    const { address, length, slaveId, functionCode } = req.body;
    
    if (!client || !isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Не установлено соединение Modbus',
        error: 'No Modbus connection'
      });
    }
    
    // Set slave ID if provided
    if (slaveId) {
      client.setID(slaveId);
    }
    
    let data;
    // Read based on function code
    if (functionCode === 3 || !functionCode) {
      // Default is to read holding registers (function code 3)
      data = await client.readHoldingRegisters(address || 0, length || 1);
    } else if (functionCode === 4) {
      // Read input registers (function code 4)
      data = await client.readInputRegisters(address || 0, length || 1);
    } else if (functionCode === 1) {
      // Read coils (function code 1)
      data = await client.readCoils(address || 0, length || 1);
    } else if (functionCode === 2) {
      // Read discrete inputs (function code 2)
      data = await client.readDiscreteInputs(address || 0, length || 1);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Неизвестный код функции',
        error: 'Unknown function code'
      });
    }
    
    res.json({
      success: true,
      data: data.data,
      address,
      functionCode: functionCode || 3
    });
  } catch (error) {
    console.error('Error reading Modbus registers:', error);
    res.status(200).json({
      success: false,
      message: 'Ошибка при чтении регистров Modbus',
      error: String(error)
    });
  }
});

export default router;

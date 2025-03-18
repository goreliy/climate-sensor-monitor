
import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// В Node.js среде, мы можем динамически загружать модули
let ModbusRTU: any;
let serialPortList: any;

// Переменные для реального или имитируемого состояния
let isUsingMockData = false;
let isConnected = false;
let currentPort = null;
let modbusClient: any = null;
let mockRegisters = new Map();

// Инициализируем некоторые тестовые значения регистров
for (let i = 0; i < 100; i++) {
  mockRegisters.set(i, Math.floor(Math.random() * 65535));
}

// Журнал пакетов Modbus
const MAX_LOG_ENTRIES = 100;
let modbusPacketLog: any[] = [];

// Вспомогательная функция для ведения журнала
const logModbusEvent = (event: any) => {
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

// Вспомогательная функция для создания пакета Modbus
const createModbusPacket = (type: 'request' | 'response', slaveId: number, functionCode: number, dataHex: string, isValid = true) => {
  // Расчет CRC (упрощенно)
  const crc = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
  
  // Создаем необработанный пакет
  const rawPacket = `${slaveId.toString(16).padStart(2, '0')}${functionCode.toString(16).padStart(2, '0')}${dataHex}${isValid ? crc : 'ffff'}`;
  
  // Добавляем в журнал
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

// Функция для инициализации работы с реальным оборудованием
const initializeRealModbus = () => {
  try {
    // Пробуем загрузить необходимые модули
    if (!ModbusRTU) {
      try {
        ModbusRTU = require('modbus-serial');
        serialPortList = require('serialport');
        isUsingMockData = false;
        console.log('Successfully loaded modbus-serial and serialport modules');
      } catch (error) {
        console.warn('Failed to load modbus-serial or serialport modules, using mock data:', error);
        isUsingMockData = true;
      }
    }
    
    if (!isUsingMockData && !modbusClient) {
      modbusClient = new ModbusRTU.ModbusRTU();
    }
    
    return !isUsingMockData;
  } catch (error) {
    console.error('Error initializing real Modbus:', error);
    isUsingMockData = true;
    return false;
  }
};

// Сканирование доступных портов
router.get('/scan', async (req, res) => {
  // Пытаемся инициализировать реальное оборудование
  const isRealModbus = initializeRealModbus();
  
  if (isRealModbus) {
    try {
      const ports = await serialPortList.SerialPort.list();
      res.json({ 
        success: true, 
        ports: ports.map((port: any) => ({ path: port.path })),
        isMock: false
      });
    } catch (error) {
      console.error('Error scanning ports:', error);
      
      // Если произошла ошибка при сканировании, возвращаемся к имитации
      const mockPorts = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'].map(path => ({ path }));
      
      res.json({ 
        success: true, 
        ports: mockPorts,
        isMock: true,
        error: String(error)
      });
    }
  } else {
    // Возвращаем имитированные порты
    const mockPorts = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'].map(path => ({ path }));
    
    res.json({ 
      success: true, 
      ports: mockPorts,
      isMock: true
    });
  }
});

// Подключение к порту
router.post('/connect', async (req, res) => {
  const { port, baudRate = 9600, dataBits = 8, parity = 'none', stopBits = 1 } = req.body;

  if (!port) {
    return res.status(400).json({
      success: false,
      message: 'Port is required'
    });
  }

  // Пытаемся инициализировать реальное оборудование
  const isRealModbus = initializeRealModbus();
  
  if (isRealModbus) {
    try {
      // Закрываем предыдущее соединение, если оно есть
      if (modbusClient.isOpen) {
        await modbusClient.close();
      }
      
      // Параметры последовательного порта
      const serialOptions = {
        baudRate: parseInt(baudRate),
        dataBits: parseInt(dataBits),
        parity: parity,
        stopBits: parseInt(stopBits),
        autoOpen: false
      };
      
      // Открываем соединение
      await modbusClient.connectRTUBuffered(port, serialOptions);
      modbusClient.setTimeout(2000); // 2 сек тайм-аут
      
      isConnected = true;
      currentPort = port;
      
      // Создаем пакет подключения
      const connectData = `${baudRate.toString(16).padStart(4, '0')}`;
      createModbusPacket('request', 0, 0, connectData);
      
      logModbusEvent({
        type: 'connect',
        port,
        baudRate,
        dataBits,
        parity,
        stopBits,
        isMock: false
      });
      
      res.json({
        success: true,
        message: `Connected to ${port} with baud rate ${baudRate}`,
        isOpen: true,
        isMock: false
      });
    } catch (error) {
      console.error('Error connecting to port:', error);
      
      // Если произошла ошибка подключения, переходим в режим имитации
      isUsingMockData = true;
      isConnected = true; // В режиме имитации считаем, что подключены
      currentPort = port;
      
      // Создаем пакет подключения (имитация)
      const connectData = `${baudRate.toString(16).padStart(4, '0')}`;
      createModbusPacket('request', 0, 0, connectData);
      
      logModbusEvent({
        type: 'connect',
        port,
        baudRate,
        isMock: true,
        error: String(error)
      });
      
      res.json({
        success: true,
        message: `Connected to ${port} in mock mode due to error: ${error}`,
        isOpen: true,
        isMock: true,
        error: String(error)
      });
    }
  } else {
    // Имитация подключения
    isConnected = true;
    currentPort = port;
    
    // Создаем пакет подключения
    const connectData = `${baudRate.toString(16).padStart(4, '0')}`;
    createModbusPacket('request', 0, 0, connectData);
    
    logModbusEvent({
      type: 'connect',
      port,
      baudRate,
      dataBits,
      parity,
      stopBits,
      isMock: true
    });
    
    res.json({
      success: true,
      message: `Connected to ${port} (mock mode)`,
      isOpen: true,
      isMock: true
    });
  }
});

// Отключение от порта
router.post('/disconnect', async (req, res) => {
  if (isUsingMockData || !modbusClient) {
    isConnected = false;
    currentPort = null;
    
    // Создаем пакет отключения
    createModbusPacket('request', 0, 0, '0000');
    
    logModbusEvent({
      type: 'disconnect',
      isMock: true
    });
    
    res.json({
      success: true,
      message: 'Disconnected (mock mode)',
      isOpen: false,
      isMock: true
    });
  } else {
    try {
      // Закрываем соединение
      if (modbusClient.isOpen) {
        await modbusClient.close();
      }
      
      isConnected = false;
      currentPort = null;
      
      // Создаем пакет отключения
      createModbusPacket('request', 0, 0, '0000');
      
      logModbusEvent({
        type: 'disconnect',
        isMock: false
      });
      
      res.json({
        success: true,
        message: 'Disconnected',
        isOpen: false,
        isMock: false
      });
    } catch (error) {
      console.error('Error disconnecting from port:', error);
      
      // При ошибке отключения все равно считаем, что отключились
      isConnected = false;
      currentPort = null;
      
      res.json({
        success: true,
        message: `Disconnected with error: ${error}`,
        isOpen: false,
        isMock: false,
        error: String(error)
      });
    }
  }
});

// Статус соединения
router.get('/status', (req, res) => {
  if (isUsingMockData) {
    res.json({
      isOpen: isConnected,
      port: currentPort,
      isMock: true
    });
  } else if (modbusClient) {
    res.json({
      isOpen: modbusClient.isOpen,
      port: currentPort,
      isMock: false
    });
  } else {
    res.json({
      isOpen: false,
      port: null,
      isMock: true
    });
  }
});

// Чтение регистров
router.post('/read', async (req, res) => {
  const { address = 0, length = 1, slaveId = 1, functionCode = 3 } = req.body;

  if (!isConnected) {
    return res.status(400).json({
      success: false,
      message: 'Not connected'
    });
  }

  if (isUsingMockData || !modbusClient) {
    // Генерируем тестовые данные
    const data = Array.from({ length }, (_, i) => {
      const registerAddr = address + i;
      let value = mockRegisters.get(registerAddr) || 0;
      
      // Симулируем изменения
      value += Math.floor(Math.random() * 10) - 5;
      mockRegisters.set(registerAddr, value);
      
      return value;
    });
    
    // Создаем пакеты запроса и ответа
    const requestDataHex = `${address.toString(16).padStart(4, '0')}${length.toString(16).padStart(4, '0')}`;
    createModbusPacket('request', slaveId, functionCode, requestDataHex);
    
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
  } else {
    try {
      // Установка ID подчиненного устройства
      modbusClient.setID(slaveId);
      
      // Создаем пакет запроса
      const requestDataHex = `${address.toString(16).padStart(4, '0')}${length.toString(16).padStart(4, '0')}`;
      createModbusPacket('request', slaveId, functionCode, requestDataHex);
      
      let data: number[] = [];
      
      // Выбор функции в зависимости от кода функции
      if (functionCode === 3) {
        // Чтение holding registers (FC=03)
        const result = await modbusClient.readHoldingRegisters(address, length);
        data = result.data;
      } else if (functionCode === 4) {
        // Чтение input registers (FC=04)
        const result = await modbusClient.readInputRegisters(address, length);
        data = result.data;
      } else {
        throw new Error(`Unsupported function code: ${functionCode}`);
      }
      
      // Создаем пакет ответа
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
        isMock: false
      });
      
      res.json({
        success: true,
        data,
        address,
        functionCode,
        isMock: false
      });
    } catch (error) {
      console.error('Error reading registers:', error);
      
      // При ошибке чтения возвращаем имитированные данные
      const data = Array.from({ length }, (_, i) => {
        const registerAddr = address + i;
        let value = mockRegisters.get(registerAddr) || 0;
        mockRegisters.set(registerAddr, value);
        return value;
      });
      
      // Создаем пакет ответа с ошибкой
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
});

// Запись в регистр
router.post('/write', async (req, res) => {
  const { address = 0, value = 0, slaveId = 1 } = req.body;

  if (!isConnected) {
    return res.status(400).json({
      success: false,
      message: 'Not connected'
    });
  }

  if (isUsingMockData || !modbusClient) {
    // Записываем значение в имитированный регистр
    mockRegisters.set(address, value);
    
    // Создаем пакеты запроса и ответа (FC=06)
    const dataHex = `${address.toString(16).padStart(4, '0')}${value.toString(16).padStart(4, '0')}`;
    createModbusPacket('request', slaveId, 6, dataHex);
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
  } else {
    try {
      // Установка ID подчиненного устройства
      modbusClient.setID(slaveId);
      
      // Создаем пакет запроса (FC=06)
      const dataHex = `${address.toString(16).padStart(4, '0')}${value.toString(16).padStart(4, '0')}`;
      createModbusPacket('request', slaveId, 6, dataHex);
      
      // Запись в один регистр
      await modbusClient.writeRegister(address, value);
      
      // Создаем пакет ответа
      createModbusPacket('response', slaveId, 6, dataHex);
      
      logModbusEvent({
        type: 'write',
        slaveId,
        address,
        value,
        isMock: false
      });
      
      res.json({
        success: true,
        address,
        value,
        isMock: false
      });
    } catch (error) {
      console.error('Error writing to register:', error);
      
      // При ошибке записи, все равно обновляем имитированный регистр
      mockRegisters.set(address, value);
      
      // Создаем пакет ответа с ошибкой
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
});

// Журнал Modbus
router.get('/logs', (req, res) => {
  res.json(modbusPacketLog);
});

// Очистка журнала Modbus
router.post('/logs/clear', (req, res) => {
  modbusPacketLog = [];
  res.json({ success: true, message: 'Logs cleared' });
});

export default router;

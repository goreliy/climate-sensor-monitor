
export interface SettingsFormData {
  modbusPort: string;
  modbusBaudRate: number;
  modbusDataBits: number;
  modbusParity: string;
  modbusStopBits: number;
  modbusAutoStart: boolean; // New field for auto-start
  dbPath: string;
  logLevel: string;
  logPath: string;
  logSizeLimit: number; // Размер лога в МБ
  modbusLogSize: number; // Новое поле для размера логов Modbus в МБ
  telegramToken: string;
  telegramChatId: string;
  enableNotifications: boolean;
  sendThresholdAlerts: boolean; // Поле для уведомлений о превышении порога
  sendPeriodicReports: boolean; // Поле для периодических отчётов
  reportFrequency: "daily" | "weekly" | "monthly"; // Частота отчётов
  allowCommandRequests: boolean; // Поле для запросов команд
  pollingInterval: number;
}

export interface SensorConfig {
  id?: number;
  name: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
}

export interface VisualizationMap {
  id?: number;
  name: string;
  imagePath: string;
  sensorPlacements: SensorPlacement[];
}

export interface SensorPlacement {
  sensorId: number;
  x: number;
  y: number;
}

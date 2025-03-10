
export interface SettingsFormData {
  modbusPort: string;
  modbusBaudRate: number;
  modbusDataBits: number;
  modbusParity: string;
  modbusStopBits: number;
  dbPath: string;
  logLevel: string;
  logPath: string;
  logSizeLimit: number; // New field for log size limit in MB
  telegramToken: string;
  telegramChatId: string;
  enableNotifications: boolean;
  sendThresholdAlerts: boolean; // New field for threshold alerts
  sendPeriodicReports: boolean; // New field for periodic reports
  reportFrequency: "daily" | "weekly" | "monthly"; // New field for report frequency
  allowCommandRequests: boolean; // New field for command requests
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


export interface SettingsFormData {
  modbusPort: string;
  modbusBaudRate: number;
  modbusDataBits: number;
  modbusParity: string;
  modbusStopBits: number;
  dbPath: string;
  logLevel: string;
  logPath: string;
  telegramToken: string;
  telegramChatId: string;
  enableNotifications: boolean;
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

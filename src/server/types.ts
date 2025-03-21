
// Types used by the server routes

export interface SensorPlacement {
  sensorId: number;
  x: number;
  y: number;
  label?: string;
}

export interface VisualizationMap {
  id: number;
  name: string;
  imagePath: string;
  sensorPlacements: SensorPlacement[];
}

export interface SensorReading {
  id: number;
  sensor_id: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

export interface Sensor {
  id: number;
  name: string;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
}

export interface SystemStatus {
  status: string;
  mode: string;
  uptime: number;
  memory: any;
  timestamp: string;
}

export interface ModbusSettings {
  port: string;
  baudRate: number;
  dataBits: number;
  parity: string;
  stopBits: number;
}

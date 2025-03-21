
import { setTimeout } from 'timers/promises';

/**
 * Web-based emulation of Modbus RTU
 * This class provides a simulated Modbus RTU implementation for web development
 */
export class WebModbusRTU {
  private _isOpen = false;
  private deviceId = 1;
  private lastError: Error | null = null;
  private delay = 50; // ms, to simulate real communication delays
  private portName: string | null = null;
  private mockDevices: Map<number, Map<number, number>> = new Map();

  constructor() {
    // Initialize some mock devices with random data
    for (let deviceId = 1; deviceId <= 5; deviceId++) {
      const registers = new Map();
      for (let reg = 0; reg < 100; reg++) {
        registers.set(reg, Math.floor(Math.random() * 65535));
      }
      this.mockDevices.set(deviceId, registers);
    }
  }

  async connectRTUBuffered(port: string, options: any): Promise<void> {
    // Simulate connection delay
    await setTimeout(100);
    
    if (port === 'ERROR') {
      this.lastError = new Error('Connection error (simulated)');
      throw this.lastError;
    }
    
    this._isOpen = true;
    this.portName = port;
  }

  async close(): Promise<void> {
    // Simulate disconnection delay
    await setTimeout(50);
    this._isOpen = false;
    this.portName = null;
  }

  setID(id: number): void {
    this.deviceId = id;
  }

  setTimeout(timeout: number): void {
    // Just store this for reference
    this.delay = Math.min(timeout, 100); // Cap at 100ms to keep UI responsive
  }

  // Public getter for the isOpen property
  get isOpen(): boolean {
    return this._isOpen;
  }

  async readHoldingRegisters(address: number, length: number): Promise<{ data: number[] }> {
    // Simulate communication delay
    await setTimeout(this.delay);
    
    // Simulate communication errors occasionally
    if (Math.random() < 0.05) { // 5% chance of error
      throw new Error('Simulated communication error');
    }
    
    const data: number[] = [];
    const deviceRegisters = this.mockDevices.get(this.deviceId) || new Map();
    
    for (let i = 0; i < length; i++) {
      const registerAddr = address + i;
      let value = deviceRegisters.get(registerAddr) || 0;
      
      // Add some random variation to simulate changing values
      value += Math.floor(Math.random() * 10) - 5;
      if (value < 0) value = 0;
      if (value > 65535) value = 65535;
      
      deviceRegisters.set(registerAddr, value);
      data.push(value);
    }
    
    if (!this.mockDevices.has(this.deviceId)) {
      this.mockDevices.set(this.deviceId, deviceRegisters);
    }
    
    return { data };
  }

  async readInputRegisters(address: number, length: number): Promise<{ data: number[] }> {
    // For simplicity, we'll use the same implementation as readHoldingRegisters
    return this.readHoldingRegisters(address, length);
  }

  async writeRegister(address: number, value: number): Promise<void> {
    // Simulate communication delay
    await setTimeout(this.delay);
    
    // Simulate communication errors occasionally
    if (Math.random() < 0.05) { // 5% chance of error
      throw new Error('Simulated communication error');
    }
    
    let deviceRegisters = this.mockDevices.get(this.deviceId);
    if (!deviceRegisters) {
      deviceRegisters = new Map();
      this.mockDevices.set(this.deviceId, deviceRegisters);
    }
    
    deviceRegisters.set(address, value);
  }
}

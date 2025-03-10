
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsFormData } from "./types";
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ModbusVisualizer } from "../ModbusVisualizer";
import { Button } from "@/components/ui/button";
import { RefreshCw, Power, PlugZap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ModbusSettingsProps {
  form: UseFormReturn<SettingsFormData>;
  useMockData?: boolean;
}

export function ModbusSettings({ form, useMockData = true }: ModbusSettingsProps) {
  const [comPortStatus, setComPortStatus] = useState<'open' | 'closed' | 'error'>('closed');
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toast } = useToast();

  // Watch the autostart field to get its current value
  const autoStartEnabled = form.watch("modbusAutoStart");

  const scanPorts = async () => {
    if (useMockData) {
      setIsScanning(true);
      // Simulate port scanning in mock mode
      setTimeout(() => {
        setAvailablePorts(['COM1', 'COM2', 'COM3', 'COM4']);
        setIsScanning(false);
        toast({
          title: "Сканирование завершено",
          description: "Найдено 4 доступных порта",
        });
      }, 1000);
      return;
    }

    try {
      setIsScanning(true);
      const response = await fetch('http://localhost:3001/api/modbus/scan');
      if (response.ok) {
        const data = await response.json();
        setAvailablePorts(data.ports);
        toast({
          title: "Сканирование завершено",
          description: `Найдено ${data.ports.length} доступных портов`,
        });
      } else {
        throw new Error('Failed to scan ports');
      }
    } catch (error) {
      console.error('Error scanning ports:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось просканировать порты",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const connectToPort = async () => {
    const portName = form.getValues("modbusPort");
    if (!portName) {
      toast({
        title: "Ошибка",
        description: "Укажите COM порт для подключения",
        variant: "destructive",
      });
      return;
    }

    if (useMockData) {
      setIsConnecting(true);
      // Simulate connection in mock mode
      setTimeout(() => {
        setComPortStatus('open');
        setIsConnecting(false);
        toast({
          title: "Подключено",
          description: `Порт ${portName} успешно открыт`,
        });
      }, 1000);
      return;
    }

    try {
      setIsConnecting(true);
      const response = await fetch('http://localhost:3001/api/modbus/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          port: portName,
          baudRate: form.getValues("modbusBaudRate"),
          dataBits: form.getValues("modbusDataBits"),
          parity: form.getValues("modbusParity"),
          stopBits: form.getValues("modbusStopBits"),
        }),
      });

      if (response.ok) {
        setComPortStatus('open');
        toast({
          title: "Подключено",
          description: `Порт ${portName} успешно открыт`,
        });
      } else {
        throw new Error('Failed to connect to port');
      }
    } catch (error) {
      console.error('Error connecting to port:', error);
      setComPortStatus('error');
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к порту",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromPort = async () => {
    if (useMockData) {
      setIsDisconnecting(true);
      // Simulate disconnection in mock mode
      setTimeout(() => {
        setComPortStatus('closed');
        setIsDisconnecting(false);
        toast({
          title: "Отключено",
          description: "Порт успешно закрыт",
        });
      }, 1000);
      return;
    }

    try {
      setIsDisconnecting(true);
      const response = await fetch('http://localhost:3001/api/modbus/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setComPortStatus('closed');
        toast({
          title: "Отключено",
          description: "Порт успешно закрыт",
        });
      } else {
        throw new Error('Failed to disconnect from port');
      }
    } catch (error) {
      console.error('Error disconnecting from port:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось закрыть порт",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  useEffect(() => {
    const checkComPortStatus = async () => {
      if (useMockData) {
        // In mock mode, simulate the port being closed initially
        setComPortStatus('closed');
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/modbus/status');
        if (response.ok) {
          const data = await response.json();
          setComPortStatus(data.isOpen ? 'open' : 'closed');
        } else {
          setComPortStatus('error');
        }
      } catch (error) {
        console.error('Failed to check COM port status:', error);
        setComPortStatus('error');
      }
    };

    checkComPortStatus();

    // Scan ports on component mount
    scanPorts();

    // Poll the status every 5 seconds
    const interval = setInterval(checkComPortStatus, 5000);
    return () => clearInterval(interval);
  }, [useMockData]);

  const getStatusBadge = () => {
    switch (comPortStatus) {
      case 'open':
        return <Badge className="bg-green-500">Открыт</Badge>;
      case 'closed':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Закрыт</Badge>;
      case 'error':
        return <Badge variant="destructive">Ошибка</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Настройки Modbus RTU</CardTitle>
            <div className="flex items-center space-x-2">
              <Label>Статус COM-порта:</Label>
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <FormField
                control={form.control}
                name="modbusPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>COM порт</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите COM порт" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePorts.map((port) => (
                          <SelectItem key={port} value={port}>{port}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={scanPorts}
                disabled={isScanning}
              >
                <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={connectToPort}
                disabled={isConnecting || comPortStatus === 'open'}
                className={comPortStatus === 'open' ? 'bg-green-100 dark:bg-green-900' : ''}
              >
                <PlugZap className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={disconnectFromPort}
                disabled={isDisconnecting || comPortStatus !== 'open'}
              >
                <Power className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="modbusAutoStart"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Автоподключение при запуске
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="modbusBaudRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Скорость передачи</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите скорость" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4800">4800</SelectItem>
                      <SelectItem value="9600">9600</SelectItem>
                      <SelectItem value="19200">19200</SelectItem>
                      <SelectItem value="38400">38400</SelectItem>
                      <SelectItem value="57600">57600</SelectItem>
                      <SelectItem value="115200">115200</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modbusDataBits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Биты данных</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите биты данных" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modbusParity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Четность</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите четность" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Нет</SelectItem>
                      <SelectItem value="even">Четный</SelectItem>
                      <SelectItem value="odd">Нечетный</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modbusStopBits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Стоп-биты</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите стоп-биты" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pollingInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Интервал опроса (мс)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={100}
                      max={60000}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Частота опроса устройств (100 мс - 60 сек)
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="modbusLogSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Размер лога Modbus (МБ)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    max={1000}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Максимальный размер журнала запросов Modbus
                </FormDescription>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      
      <ModbusVisualizer />
    </div>
  );
}

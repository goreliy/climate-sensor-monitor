
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

interface ModbusSettingsProps {
  form: UseFormReturn<SettingsFormData>;
  useMockData?: boolean;
}

export function ModbusSettings({ form, useMockData = true }: ModbusSettingsProps) {
  const [comPortStatus, setComPortStatus] = useState<'open' | 'closed' | 'error'>('closed');

  useEffect(() => {
    const checkComPortStatus = async () => {
      if (useMockData) {
        // In mock mode, simulate the port being closed
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

    // Poll the status every 5 seconds
    const interval = setInterval(checkComPortStatus, 5000);
    return () => clearInterval(interval);
  }, [useMockData]);

  const getStatusBadge = () => {
    switch (comPortStatus) {
      case 'open':
        return <Badge variant="success" className="bg-green-500">Открыт</Badge>;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="modbusPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>COM порт</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="COM1" />
                  </FormControl>
                </FormItem>
              )}
            />
            
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


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormData } from "./types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Activity, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModbusSettingsProps {
  form: UseFormReturn<SettingsFormData>;
  useMockData?: boolean;
}

export function ModbusSettings({ form, useMockData = true }: ModbusSettingsProps) {
  const { toast } = useToast();
  const [isPortOpen, setIsPortOpen] = useState(false);
  const [modbusLogs, setModbusLogs] = useState<string[]>([]);
  const [modbusLogSize, setModbusLogSize] = useState(1); // Default 1MB

  // Simulate port status checking
  useEffect(() => {
    if (!useMockData) {
      // В реальном приложении здесь был бы API-запрос для проверки статуса порта
      const checkPortStatus = async () => {
        try {
          const response = await fetch('http://localhost:3001/api/modbus/status');
          const data = await response.json();
          setIsPortOpen(data.isOpen);
        } catch (error) {
          console.error('Failed to check port status:', error);
          setIsPortOpen(false);
        }
      };
      
      checkPortStatus();
      const interval = setInterval(checkPortStatus, 5000);
      return () => clearInterval(interval);
    } else {
      // В режиме мок-данных симулируем открытый порт
      setIsPortOpen(true);
    }
  }, [useMockData]);

  // Simulate modbus data communication
  useEffect(() => {
    if (!useMockData && isPortOpen) {
      // Симуляция логов Modbus
      const modbusTypes = ['03 (Read Holding Registers)', '04 (Read Input Registers)', '06 (Write Single Register)'];
      const addresses = ['01', '02', '03', '04', '05'];
      
      const generateModbusLog = () => {
        const timestamp = new Date().toLocaleTimeString();
        const type = modbusTypes[Math.floor(Math.random() * modbusTypes.length)];
        const address = addresses[Math.floor(Math.random() * addresses.length)];
        const dataLength = Math.floor(Math.random() * 10) + 1;
        const reqHex = Array.from({length: dataLength}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(' ');
        const respHex = Array.from({length: dataLength + 2}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(' ');
        const crc = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
        
        return `[${timestamp}] TX > ${address} ${type} ${reqHex} CRC:${crc}\n[${timestamp}] RX < ${address} ${type} ${respHex} CRC:${crc}`;
      };
      
      const interval = setInterval(() => {
        const newLog = generateModbusLog();
        setModbusLogs(prev => [...prev.slice(-99), newLog]);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [useMockData, isPortOpen]);

  const saveSettingsAsJson = () => {
    const settingsData = form.getValues();
    const jsonData = JSON.stringify(settingsData, null, 2);
    
    // Создаем блоб и скачиваем его
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modbus_settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Настройки сохранены",
      description: "Файл modbus_settings.json успешно создан",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Настройки Modbus RTU</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isPortOpen ? "default" : "destructive"} className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {isPortOpen ? "Порт открыт" : "Порт закрыт"}
              </Badge>
              <Button variant="outline" size="sm" onClick={saveSettingsAsJson}>
                <Save className="h-4 w-4 mr-2" />
                Сохранить в JSON
              </Button>
            </div>
          </div>
          <CardDescription>
            Настройки соединения Modbus RTU для взаимодействия с датчиками
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="modbusPort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>COM порт</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modbusBaudRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Скорость передачи (бод)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modbusDataBits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Биты данных</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modbusParity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Четность</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modbusLogSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Размер лога Modbus (МБ)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        setModbusLogSize(Number(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Максимальный размер файла лога Modbus в мегабайтах
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Визуализация Modbus</CardTitle>
          <CardDescription>
            Обмен данными в режиме реального времени
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full border rounded-md p-4 bg-muted font-mono text-sm whitespace-pre">
            {modbusLogs.length > 0 ? (
              modbusLogs.map((log, index) => (
                <div key={index} className="mb-2">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {useMockData 
                  ? "В режиме мок-данных визуализация Modbus недоступна" 
                  : isPortOpen 
                    ? "Ожидание данных Modbus..." 
                    : "COM порт закрыт. Откройте порт для просмотра данных"}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

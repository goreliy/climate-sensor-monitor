
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ModbusPacket {
  id: number;
  timestamp: string;
  type: "request" | "response";
  deviceAddress: number;
  functionCode: number;
  data: string;
  crc: string;
  raw: string;
  isValid: boolean;
}

export function ModbusVisualizer() {
  const [packets, setPackets] = useState<ModbusPacket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const fetchModbusData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/modbus/logs');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Modbus logs: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setPackets(data);
        setError(null);
        
        if (autoScroll && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } catch (error) {
        console.error('Error fetching Modbus logs:', error);
        setError(error instanceof Error ? error.message : 'Неизвестная ошибка при получении логов Modbus');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchModbusData();

    // Set up polling
    const interval = setInterval(fetchModbusData, 1000);
    
    return () => clearInterval(interval);
  }, [autoScroll]);

  const clearLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/modbus/logs/clear', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear logs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPackets([]);
        toast({
          title: "Успешно",
          description: "Логи Modbus очищены",
        });
      } else {
        throw new Error(data.message || 'Не удалось очистить логи');
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка при очистке логов',
        variant: "destructive",
      });
    }
  };

  // Format hex data with spaces for better readability
  const formatHexData = (hex: string) => {
    return hex.match(/.{1,2}/g)?.join(' ') || hex;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Визуализация Modbus</CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? "Отключить автопрокрутку" : "Включить автопрокрутку"}
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={clearLogs}
          >
            <Trash className="h-4 w-4 mr-1" /> Очистить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-4" ref={scrollRef}>
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
              <AlertTriangle size={24} />
              <p>{error}</p>
            </div>
          ) : loading && packets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Загрузка данных Modbus...
            </div>
          ) : packets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Нет данных Modbus
            </div>
          ) : (
            <div className="space-y-3">
              {packets.map((packet) => (
                <div 
                  key={packet.id} 
                  className={`p-3 rounded-md border ${
                    packet.type === "request" 
                      ? "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800" 
                      : "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={packet.type === "request" ? "default" : "outline"}>
                        {packet.type === "request" ? "Запрос" : "Ответ"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(packet.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <Badge variant={packet.isValid ? "default" : "destructive"}>
                      {packet.isValid ? "CRC OK" : "CRC ERROR"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="font-medium">Адрес устройства:</span> 0x{packet.deviceAddress.toString(16).padStart(2, '0')}
                    </div>
                    <div>
                      <span className="font-medium">Функция:</span> 0x{packet.functionCode.toString(16).padStart(2, '0')}
                      {packet.functionCode === 3 ? " (Чтение регистров)" : 
                       packet.functionCode === 6 ? " (Запись регистра)" : 
                       packet.functionCode === 16 ? " (Запись регистров)" : ""}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Данные:</span> {formatHexData(packet.data)}
                    </div>
                    <div>
                      <span className="font-medium">CRC:</span> {formatHexData(packet.crc)}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">RAW:</span> <code className="text-xs">{formatHexData(packet.raw)}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

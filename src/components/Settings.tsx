
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { SensorManagement } from "./settings/SensorManagement";
import { ModbusSettings } from "./settings/ModbusSettings";
import { LoggingSettings } from "./settings/LoggingSettings";
import { TelegramSettings } from "./settings/TelegramSettings";
import { SettingsFormData, SensorConfig } from "./settings/types";
import { Form } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Visualization } from "./settings/Visualization";
import { SettingsHeader } from "./settings/SettingsHeader";
import { SettingsActions } from "./settings/SettingsActions";

interface SettingsProps {
  useMockData?: boolean;
}

export function Settings({ useMockData = true }: SettingsProps) {
  const { toast } = useToast();
  const [sensors, setSensors] = useState<SensorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormData>({
    defaultValues: {
      modbusPort: "COM1",
      modbusBaudRate: 9600,
      modbusDataBits: 8,
      modbusParity: "none",
      modbusStopBits: 1,
      modbusAutoStart: false,
      dbPath: "./data/sensors.db",
      logLevel: "info",
      logPath: "./logs/app.log",
      logSizeLimit: 100,
      modbusLogSize: 1,
      telegramToken: "",
      telegramChatId: "",
      enableNotifications: true,
      sendThresholdAlerts: true,
      sendPeriodicReports: false,
      reportFrequency: "daily",
      allowCommandRequests: true,
      pollingInterval: 5000,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        console.log("Начинаем загрузку настроек...");
        
        // Используем AbortController для тайм-аута запросов
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд тайм-аут
        
        const baseUrl = useMockData ? 'http://localhost:3001' : window.location.origin;
        console.log(`Базовый URL для запросов: ${baseUrl}`);
        
        try {
          const settingsResponse = await fetch(`${baseUrl}/api/settings`, {
            signal: controller.signal
          });
          
          console.log(`Статус ответа настроек: ${settingsResponse.status}`);
          
          if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            console.log("Загружены настройки:", settings);
            form.reset(settings);
          } else {
            console.error(`Ошибка загрузки настроек: ${settingsResponse.status} ${settingsResponse.statusText}`);
            throw new Error(`Не удалось загрузить настройки: ${settingsResponse.status}`);
          }
        } catch (settingsError) {
          console.error('Ошибка при загрузке настроек:', settingsError);
          throw settingsError;
        }
        
        try {
          const sensorsResponse = await fetch(`${baseUrl}/api/sensors`, {
            signal: controller.signal
          });
          
          console.log(`Статус ответа датчиков: ${sensorsResponse.status}`);
          
          if (sensorsResponse.ok) {
            const sensorsData = await sensorsResponse.json();
            console.log("Загружены данные датчиков:", sensorsData);
            
            const mappedSensors = sensorsData.map((sensor: any) => ({
              id: sensor.id,
              name: sensor.name,
              tempMin: sensor.temp_min,
              tempMax: sensor.temp_max,
              humidityMin: sensor.humidity_min,
              humidityMax: sensor.humidity_max,
            }));
            
            setSensors(mappedSensors);
          } else {
            console.error(`Ошибка загрузки датчиков: ${sensorsResponse.status} ${sensorsResponse.statusText}`);
            throw new Error(`Не удалось загрузить датчики: ${sensorsResponse.status}`);
          }
        } catch (sensorsError) {
          console.error('Ошибка при загрузке датчиков:', sensorsError);
          throw sensorsError;
        }
        
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('Ошибка загрузки настроек или датчиков:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить настройки. Используются значения по умолчанию.",
          variant: "destructive",
        });
        
        if (useMockData || window.location.hostname === 'localhost') {
          console.log("Создаем моковые датчики, так как используется режим мок-данных или localhost");
          const mockSensors = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `Датчик #${i + 1}`,
            tempMin: 18,
            tempMax: 26,
            humidityMin: 30,
            humidityMax: 60,
          }));
          setSensors(mockSensors);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [form, toast, useMockData]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setIsSaving(true);
      console.log("Начинаем сохранение настроек...");
      
      const baseUrl = useMockData ? 'http://localhost:3001' : window.location.origin;
      
      try {
        const settingsResponse = await fetch(`${baseUrl}/api/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            // Override with web emulation friendly settings
            useWebEmulation: true
          }),
        });
        
        console.log(`Статус сохранения настроек: ${settingsResponse.status}`);
        
        if (!settingsResponse.ok) {
          console.error(`Ошибка сохранения настроек: ${settingsResponse.status}`);
          throw new Error('Не удалось сохранить настройки');
        }
      } catch (settingsError) {
        console.error('Ошибка при сохранении настроек:', settingsError);
        throw settingsError;
      }
      
      try {
        const sensorsResponse = await fetch(`${baseUrl}/api/sensors/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sensors),
        });
        
        console.log(`Статус сохранения датчиков: ${sensorsResponse.status}`);
        
        if (!sensorsResponse.ok) {
          console.error(`Ошибка сохранения датчиков: ${sensorsResponse.status}`);
          throw new Error('Не удалось сохранить настройки датчиков');
        }
      } catch (sensorsError) {
        console.error('Ошибка при сохранении датчиков:', sensorsError);
        throw sensorsError;
      }

      try {
        const jsonResponse = await fetch(`${baseUrl}/api/settings/save-json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            settings: {
              ...data,
              useWebEmulation: true
            }, 
            sensors,
            timestamp: new Date().toISOString()
          }),
        });
        
        console.log(`Статус сохранения JSON: ${jsonResponse.status}`);
        
        if (!jsonResponse.ok) {
          console.error(`Ошибка сохранения JSON: ${jsonResponse.status}`);
          throw new Error('Не удалось сохранить настройки в JSON файл');
        }
      } catch (jsonError) {
        console.error('Ошибка при сохранении JSON:', jsonError);
        throw jsonError;
      }

      toast({
        title: "Успех",
        description: "Настройки успешно сохранены",
      });
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки. Проверьте соединение с сервером.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const generateMockSensors = async () => {
    try {
      console.log("Начинаем генерацию моковых датчиков...");
      const baseUrl = useMockData ? 'http://localhost:3001' : window.location.origin;
      
      // Fixed path to use the correct endpoint
      const response = await fetch(`${baseUrl}/api/sensors/generate-mock`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`Статус генерации моковых датчиков: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Успех",
            description: "Моковые датчики успешно созданы",
          });
          
          const sensorsResponse = await fetch(`${baseUrl}/api/sensors`);
          if (sensorsResponse.ok) {
            const sensorsData = await sensorsResponse.json();
            setSensors(sensorsData.map((sensor: any) => ({
              id: sensor.id,
              name: sensor.name,
              tempMin: sensor.temp_min,
              tempMax: sensor.temp_max,
              humidityMin: sensor.humidity_min,
              humidityMax: sensor.humidity_max,
            })));
          }
        } else {
          throw new Error('Failed to create mock sensors');
        }
      } else {
        throw new Error('Failed to create mock sensors');
      }
    } catch (error) {
      console.error('Failed to create mock sensors:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать моковые датчики",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[200px]">
          Загрузка настроек...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <SettingsHeader 
        generateMockSensors={generateMockSensors} 
      />
      
      <Tabs defaultValue="sensors">
        <TabsList className="mb-4">
          <TabsTrigger value="sensors">Датчики</TabsTrigger>
          <TabsTrigger value="modbus">Modbus</TabsTrigger>
          <TabsTrigger value="logging">Логирование</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="visualization">Визуализация</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <TabsContent value="sensors">
              <SensorManagement
                sensors={sensors}
                onSensorsChange={setSensors}
              />
            </TabsContent>
            
            <TabsContent value="modbus">
              <ModbusSettings form={form} useMockData={useMockData} />
            </TabsContent>
            
            <TabsContent value="logging">
              <LoggingSettings form={form} />
            </TabsContent>
            
            <TabsContent value="telegram">
              <TelegramSettings form={form} />
            </TabsContent>
            
            <TabsContent value="visualization">
              <Visualization />
            </TabsContent>

            <SettingsActions isSaving={isSaving} />
          </form>
        </Form>
      </Tabs>
    </div>
  );
}

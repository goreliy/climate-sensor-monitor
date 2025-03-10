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

interface SettingsProps {
  useMockData?: boolean;
}

export function Settings({ useMockData = true }: SettingsProps) {
  const { toast } = useToast();
  const [sensors, setSensors] = useState<SensorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<SettingsFormData>({
    defaultValues: {
      modbusPort: "COM1",
      modbusBaudRate: 9600,
      modbusDataBits: 8,
      modbusParity: "none",
      modbusStopBits: 1,
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
        const [settingsResponse, sensorsResponse] = await Promise.all([
          fetch('http://localhost:3001/api/settings'),
          fetch('http://localhost:3001/api/sensors')
        ]);

        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          form.reset(settings);
        }

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
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить настройки",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [form, toast]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const settingsResponse = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const sensorsResponse = await fetch('http://localhost:3001/api/sensors/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sensors),
      });

      if (!settingsResponse.ok || !sensorsResponse.ok) {
        throw new Error('Failed to save settings');
      }

      await fetch('http://localhost:3001/api/settings/save-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: data, sensors }),
      });

      toast({
        title: "Успех",
        description: "Настройки успешно сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    }
  };

  const generateMockSensors = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/generate-mock-sensors');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Успех",
            description: "Моковые датчики успешно созданы",
          });
          const sensorsResponse = await fetch('http://localhost:3001/api/sensors');
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
        }
      }
    } catch (error) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Настройки системы</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateMockSensors}>
            Создать моковые датчики
          </Button>
        </div>
      </div>
      
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

            <Button 
              type="submit" 
              className="w-full md:w-auto"
            >
              Сохранить настройки
            </Button>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}


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
import { Database } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
        
        // Using Promise.all to make parallel requests
        const [settingsResponse, sensorsResponse] = await Promise.all([
          fetch('http://localhost:3001/api/settings'),
          fetch('http://localhost:3001/api/sensors')
        ]);

        // Handle settings response
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          form.reset(settings);
        } else {
          throw new Error('Failed to load settings');
        }

        // Handle sensors response
        if (sensorsResponse.ok) {
          const sensorsData = await sensorsResponse.json();
          
          // Map the sensor data to our SensorConfig format
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
          throw new Error('Failed to load sensors');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить настройки. Используются значения по умолчанию.",
          variant: "destructive",
        });
        
        // If we're using mock data and failed to load, create 10 mock sensors
        if (useMockData) {
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
      
      // Using Promise.all to make parallel requests
      const [settingsResponse, sensorsResponse] = await Promise.all([
        fetch('http://localhost:3001/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }),
        
        fetch('http://localhost:3001/api/sensors/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sensors),
        })
      ]);

      // Check if both requests were successful
      if (!settingsResponse.ok || !sensorsResponse.ok) {
        throw new Error(
          `Failed to save: ${!settingsResponse.ok ? 'Settings' : ''} ${!sensorsResponse.ok ? 'Sensors' : ''}`
        );
      }

      // Save to JSON file
      const jsonResponse = await fetch('http://localhost:3001/api/settings/save-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          settings: data, 
          sensors,
          timestamp: new Date().toISOString()
        }),
      });

      if (!jsonResponse.ok) {
        throw new Error('Failed to save settings to JSON file');
      }

      toast({
        title: "Успех",
        description: "Настройки успешно сохранены",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
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
      const response = await fetch('http://localhost:3001/api/generate-mock-sensors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 10 }), // Generate 10 mock sensors
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Успех",
            description: "Моковые датчики успешно созданы",
          });
          
          // Refresh sensor list
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

  const clearDatabase = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/database/clear', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "База данных очищена",
          description: "История измерений успешно удалена из базы данных",
        });
      } else {
        throw new Error('Failed to clear database');
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось очистить базу данных",
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
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Database className="h-4 w-4 mr-2" />
                Очистить базу данных
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Очистить базу данных?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие удалит всю историю измерений. Данное действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={clearDatabase}>Очистить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              disabled={isSaving}
            >
              {isSaving ? "Сохранение..." : "Сохранить настройки"}
            </Button>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}

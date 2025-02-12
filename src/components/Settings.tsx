
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

export function Settings() {
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
      telegramToken: "",
      telegramChatId: "",
      enableNotifications: true,
      pollingInterval: 5000,
    },
  });

  // Загрузка существующих настроек при монтировании компонента
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
      <h1 className="text-2xl font-bold mb-6">Настройки системы</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <SensorManagement
            sensors={sensors}
            onSensorsChange={setSensors}
          />
          <ModbusSettings form={form} />
          <LoggingSettings form={form} />
          <TelegramSettings form={form} />

          <Button 
            type="submit" 
            className="w-full md:w-auto"
          >
            Сохранить настройки
          </Button>
        </form>
      </Form>
    </div>
  );
}

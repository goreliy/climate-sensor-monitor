
import { useEffect, useState } from "react";
import { SensorPanel } from "./SensorPanel";
import { SensorChart } from "./SensorChart";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SensorStatus = "normal" | "warning" | "error";

interface Sensor {
  id: number;
  name: string;
  temperature: number;
  humidity: number;
  status: SensorStatus;
  thresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
  };
}

// Моковые данные для демонстрации
const mockSensors: Sensor[] = [
  {
    id: 1,
    name: "Датчик 1",
    temperature: 23.5,
    humidity: 45,
    status: "normal",
    thresholds: {
      temperature: { min: 18, max: 26 },
      humidity: { min: 30, max: 60 }
    }
  },
  {
    id: 2,
    name: "Датчик 2",
    temperature: 27.8,
    humidity: 65,
    status: "warning",
    thresholds: {
      temperature: { min: 18, max: 26 },
      humidity: { min: 30, max: 60 }
    }
  },
  {
    id: 3,
    name: "Датчик 3",
    temperature: 31.2,
    humidity: 75,
    status: "error",
    thresholds: {
      temperature: { min: 18, max: 26 },
      humidity: { min: 30, max: 60 }
    }
  }
];

const fetchSensorData = async (): Promise<Sensor[]> => {
  // В демо-режиме возвращаем моковые данные
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSensors.map(sensor => ({
        ...sensor,
        temperature: sensor.temperature + (Math.random() * 2 - 1),
        humidity: Math.max(0, Math.min(100, sensor.humidity + (Math.random() * 4 - 2)))
      })));
    }, 500);
  });
};

export function Dashboard() {
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSensorSettings, setShowSensorSettings] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: sensors = [], error, isLoading } = useQuery({
    queryKey: ['sensors'],
    queryFn: fetchSensorData,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось получить данные с сенсоров",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return <div className="container mx-auto p-4">Загрузка данных...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мониторинг температуры и влажности</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(true)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sensors.map((sensor: Sensor) => (
          <div key={sensor.id} onClick={() => setSelectedSensor(sensor)}>
            <SensorPanel 
              {...sensor} 
              onSettingsClick={() => setShowSensorSettings(sensor.id)}
            />
          </div>
        ))}
      </div>

      {selectedSensor && (
        <div className="mt-8">
          <SensorChart
            sensorId={selectedSensor.id}
            sensorName={selectedSensor.name}
            currentTemp={selectedSensor.temperature}
            currentHumidity={selectedSensor.humidity}
            thresholds={selectedSensor.thresholds}
          />
        </div>
      )}

      {/* Диалог общих настроек */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Настройки системы</DialogTitle>
          </DialogHeader>
          <div className="h-[80vh] overflow-y-auto">
            <iframe 
              src="/settings" 
              className="w-full h-full border-none"
              title="Настройки системы"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог настроек конкретного датчика */}
      <Dialog open={showSensorSettings !== null} onOpenChange={() => setShowSensorSettings(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Настройки датчика {sensors.find(s => s.id === showSensorSettings)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[60vh] overflow-y-auto">
            <iframe 
              src={`/settings?sensor=${showSensorSettings}`} 
              className="w-full h-full border-none"
              title="Настройки датчика"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

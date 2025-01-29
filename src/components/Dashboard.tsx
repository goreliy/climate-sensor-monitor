import { useEffect, useState } from "react";
import { SensorPanel } from "./SensorPanel";
import { useToast } from "@/hooks/use-toast";

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

// Mock data for initial display with thresholds
const mockSensors: Sensor[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Датчик ${i + 1}`,
  temperature: 20 + Math.random() * 10,
  humidity: 40 + Math.random() * 20,
  status: "normal",
  thresholds: {
    temperature: { min: 18, max: 25 },
    humidity: { min: 30, max: 60 }
  }
}));

export function Dashboard() {
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors);
  const { toast } = useToast();

  // Simulate real-time updates and check for threshold violations
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev =>
        prev.map(sensor => {
          const newTemp = 20 + Math.random() * 10;
          const newHumidity = 40 + Math.random() * 20;
          
          // Check for threshold violations
          const isTemperatureViolation = 
            newTemp < sensor.thresholds.temperature.min ||
            newTemp > sensor.thresholds.temperature.max;
          const isHumidityViolation = 
            newHumidity < sensor.thresholds.humidity.min ||
            newHumidity > sensor.thresholds.humidity.max;

          if (isTemperatureViolation || isHumidityViolation) {
            toast({
              title: `Предупреждение: ${sensor.name}`,
              description: `Нарушение пороговых значений: Температура: ${newTemp.toFixed(2)}°C, Влажность: ${newHumidity.toFixed(2)}%`,
              variant: "destructive",
            });
          }

          return {
            ...sensor,
            temperature: newTemp,
            humidity: newHumidity,
            status: isTemperatureViolation || isHumidityViolation ? "warning" : "normal"
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [toast]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Мониторинг температуры и влажности</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sensors.map(sensor => (
          <SensorPanel key={sensor.id} {...sensor} />
        ))}
      </div>
    </div>
  );
}
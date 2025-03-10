
import React, { useEffect, useState } from "react";
import { SensorPanel } from "./SensorPanel";
import { SensorChart } from "./SensorChart";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  useMockData?: boolean;
}

// Mock data for sensors - 10 sensors as requested
const mockSensorsData = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Датчик #${i + 1}`,
  temperature: 20 + Math.random() * 10,
  humidity: 40 + Math.random() * 20,
  status: "normal" as const,
  thresholds: {
    temperature: { min: 18, max: 25 },
    humidity: { min: 30, max: 60 }
  }
}));

export function Dashboard({ useMockData = true }: DashboardProps) {
  const [sensorsData, setSensorsData] = useState(mockSensorsData);
  const [selectedSensorId, setSelectedSensorId] = useState(1);
  const { toast } = useToast();

  // Get the selected sensor
  const selectedSensor = sensorsData.find(sensor => sensor.id === selectedSensorId) || sensorsData[0];

  useEffect(() => {
    const fetchSensors = async () => {
      if (!useMockData) {
        try {
          // In a real application, we would fetch actual data from an API
          const response = await fetch('http://localhost:3001/api/sensors/data');
          if (response.ok) {
            const data = await response.json();
            setSensorsData(data);
          } else {
            throw new Error('Failed to fetch sensor data');
          }
        } catch (error) {
          console.error('Error fetching sensor data:', error);
          // Fallback to mock data
          setSensorsData(mockSensorsData);
          toast({
            title: "Ошибка получения данных",
            description: "Не удалось получить данные с датчиков. Используются моковые данные.",
            variant: "destructive",
          });
        }
      } else {
        setSensorsData(mockSensorsData);
      }
    };

    fetchSensors();
    
    // Poll for updates if using real data
    let interval: NodeJS.Timeout;
    if (!useMockData) {
      interval = setInterval(fetchSensors, 10000); // Poll every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [useMockData, toast]);

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

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Мониторинг датчиков</h1>
        {!useMockData && (
          <Button 
            variant="destructive" 
            onClick={clearDatabase}
          >
            <Trash className="h-4 w-4 mr-2" />
            Очистить базу данных
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Сетка датчиков</TabsTrigger>
          <TabsTrigger value="detail">Детальный вид</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sensorsData.map(sensor => (
              <Card 
                key={sensor.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedSensorId(sensor.id)}
              >
                <CardContent className="p-4">
                  <SensorPanel 
                    id={sensor.id}
                    name={sensor.name}
                    temperature={sensor.temperature}
                    humidity={sensor.humidity}
                    status={sensor.status}
                    thresholds={sensor.thresholds}
                    onSettingsClick={() => console.log("Settings clicked for sensor", sensor.id)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="detail">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <div className="space-y-2">
                {sensorsData.map(sensor => (
                  <Card 
                    key={sensor.id} 
                    className={`cursor-pointer hover:border-primary transition-colors ${
                      selectedSensorId === sensor.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedSensorId(sensor.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{sensor.name}</span>
                        <div className="flex space-x-2">
                          <span className={`text-sm ${
                            sensor.temperature > sensor.thresholds.temperature.max || 
                            sensor.temperature < sensor.thresholds.temperature.min 
                              ? 'text-red-500' 
                              : 'text-blue-500'
                          }`}>
                            {sensor.temperature.toFixed(1)}°C
                          </span>
                          <span className={`text-sm ${
                            sensor.humidity > sensor.thresholds.humidity.max || 
                            sensor.humidity < sensor.thresholds.humidity.min 
                              ? 'text-red-500' 
                              : 'text-cyan-500'
                          }`}>
                            {sensor.humidity.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <SensorChart 
                sensorId={selectedSensor.id}
                sensorName={selectedSensor.name}
                currentTemp={selectedSensor.temperature}
                currentHumidity={selectedSensor.humidity}
                thresholds={selectedSensor.thresholds}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

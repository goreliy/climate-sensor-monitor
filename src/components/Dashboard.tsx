
import React, { useEffect, useState } from "react";
import { SensorPanel } from "./SensorPanel";
import { SensorChart } from "./SensorChart";

interface DashboardProps {
  useMockData?: boolean;
}

// Mock data for the sensor
const mockSensorData = {
  id: 1,
  name: "Датчик #1",
  temperature: 22.5,
  humidity: 45.2,
  status: "normal" as const,
  thresholds: {
    temperature: { min: 18, max: 25 },
    humidity: { min: 30, max: 60 }
  }
};

export function Dashboard({ useMockData = true }: DashboardProps) {
  const [sensorData, setSensorData] = useState(mockSensorData);

  useEffect(() => {
    if (!useMockData) {
      // In a real application, we would fetch actual data from an API
      // For now, we'll just simulate it with slightly different values
      setSensorData({
        ...mockSensorData,
        temperature: 23.1,
        humidity: 48.7,
        status: "normal" as const,
      });
    } else {
      setSensorData(mockSensorData);
    }
  }, [useMockData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <SensorPanel 
        id={sensorData.id}
        name={sensorData.name}
        temperature={sensorData.temperature}
        humidity={sensorData.humidity}
        status={sensorData.status}
        thresholds={sensorData.thresholds}
        onSettingsClick={() => console.log("Settings clicked for sensor", sensorData.id)}
      />
      <SensorChart 
        sensorId={sensorData.id}
        sensorName={sensorData.name}
        currentTemp={sensorData.temperature}
        currentHumidity={sensorData.humidity}
        thresholds={sensorData.thresholds}
      />
    </div>
  );
}

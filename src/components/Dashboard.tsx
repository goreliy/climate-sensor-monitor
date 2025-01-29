import { useEffect, useState } from "react";
import { SensorPanel } from "./SensorPanel";

// Mock data for initial display
const mockSensors = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Sensor ${i + 1}`,
  temperature: 20 + Math.random() * 10,
  humidity: 40 + Math.random() * 20,
  status: "normal" as const,
}));

export function Dashboard() {
  const [sensors, setSensors] = useState(mockSensors);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev =>
        prev.map(sensor => ({
          ...sensor,
          temperature: 20 + Math.random() * 10,
          humidity: 40 + Math.random() * 20,
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Temperature & Humidity Monitoring</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sensors.map(sensor => (
          <SensorPanel key={sensor.id} {...sensor} />
        ))}
      </div>
    </div>
  );
}
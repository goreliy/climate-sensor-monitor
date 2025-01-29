import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
}

interface SensorChartProps {
  sensorId: number;
  sensorName: string;
  currentTemp: number;
  currentHumidity: number;
}

export function SensorChart({ sensorId, sensorName, currentTemp, currentHumidity }: SensorChartProps) {
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);

  // Simulate historical data for now
  useEffect(() => {
    const generateHistoricalData = () => {
      const data: DataPoint[] = [];
      const now = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000); // Last 30 minutes, 1-minute intervals
        data.push({
          timestamp: timestamp.toLocaleTimeString(),
          temperature: currentTemp + (Math.random() - 0.5) * 2,
          humidity: currentHumidity + (Math.random() - 0.5) * 4,
        });
      }
      
      setHistoricalData(data);
    };

    generateHistoricalData();
    const interval = setInterval(generateHistoricalData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [currentTemp, currentHumidity]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">История показаний: {sensorName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis yAxisId="temp" orientation="left" stroke="#2563eb" domain={['auto', 'auto']} />
              <YAxis yAxisId="humidity" orientation="right" stroke="#0891b2" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                stroke="#2563eb"
                name="Температура (°C)"
                dot={false}
              />
              <Line
                yAxisId="humidity"
                type="monotone"
                dataKey="humidity"
                stroke="#0891b2"
                name="Влажность (%)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
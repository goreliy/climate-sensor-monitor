import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

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
  thresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: DataPoint;
  }>;
  label?: string;
}

export function SensorChart({ sensorId, sensorName, currentTemp, currentHumidity, thresholds }: SensorChartProps) {
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const generateHistoricalData = () => {
      const data: DataPoint[] = [];
      const now = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000);
        data.push({
          timestamp: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temperature: Number((currentTemp + (Math.random() - 0.5) * 2).toFixed(2)),
          humidity: Number((currentHumidity + (Math.random() - 0.5) * 4).toFixed(2)),
        });
      }
      
      setHistoricalData(data);
    };

    generateHistoricalData();
    const interval = setInterval(generateHistoricalData, 60000);

    return () => clearInterval(interval);
  }, [currentTemp, currentHumidity]);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const temperatureValue = payload[0]?.value;
    const humidityValue = payload[1]?.value;

    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow">
        <p className="text-sm font-medium">{`Время: ${label}`}</p>
        {temperatureValue !== undefined && (
          <p className="text-sm text-blue-600">{`Температура: ${temperatureValue.toFixed(2)}°C`}</p>
        )}
        {humidityValue !== undefined && (
          <p className="text-sm text-cyan-600">{`Влажность: ${humidityValue.toFixed(2)}%`}</p>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">История показаний: {sensorName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[
                    Math.floor(Math.min(thresholds.temperature.min - 2, Math.min(...historicalData.map(d => d.temperature)))),
                    Math.ceil(Math.max(thresholds.temperature.max + 2, Math.max(...historicalData.map(d => d.temperature))))
                  ]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine 
                  y={thresholds.temperature.min} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: `Мин: ${thresholds.temperature.min.toFixed(2)}°C`, position: 'left' }}
                />
                <ReferenceLine 
                  y={thresholds.temperature.max} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: `Макс: ${thresholds.temperature.max.toFixed(2)}°C`, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#2563eb"
                  name="Температура (°C)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[
                    Math.floor(Math.min(thresholds.humidity.min - 5, Math.min(...historicalData.map(d => d.humidity)))),
                    Math.ceil(Math.max(thresholds.humidity.max + 5, Math.max(...historicalData.map(d => d.humidity))))
                  ]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine 
                  y={thresholds.humidity.min} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: `Мин: ${thresholds.humidity.min.toFixed(2)}%`, position: 'left' }}
                />
                <ReferenceLine 
                  y={thresholds.humidity.max} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: `Макс: ${thresholds.humidity.max.toFixed(2)}%`, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#0891b2"
                  name="Влажность (%)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
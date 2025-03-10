
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, Brush
} from "recharts";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, subDays } from "date-fns";
import { CalendarIcon, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 1),
    to: new Date()
  });
  
  // Zoom state
  const [temperatureZoom, setTemperatureZoom] = useState<{ left: number; right: number } | null>(null);
  const [humidityZoom, setHumidityZoom] = useState<{ left: number; right: number } | null>(null);
  
  // Предопределенные диапазоны дат
  const predefinedRanges = [
    { label: "24 часа", days: 1 },
    { label: "7 дней", days: 7 },
    { label: "30 дней", days: 30 }
  ];

  useEffect(() => {
    const fetchHistoricalData = async () => {
      // В реальном сценарии здесь будет API запрос с параметрами dateRange
      
      // Моковые данные для демонстрации
      const data: DataPoint[] = [];
      const now = new Date();
      
      // Если выбран диапазон дат
      if (dateRange?.from) {
        const startDate = dateRange.from;
        const endDate = dateRange.to || now;
        
        // Количество точек в зависимости от диапазона
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const pointsCount = Math.min(100, daysDiff * 24); // максимум 100 точек для производительности
        
        const timeInterval = (endDate.getTime() - startDate.getTime()) / pointsCount;
        
        for (let i = 0; i <= pointsCount; i++) {
          const timestamp = new Date(startDate.getTime() + i * timeInterval);
          data.push({
            timestamp: timestamp.toISOString(),
            temperature: Number((currentTemp + (Math.random() - 0.5) * 5).toFixed(2)),
            humidity: Number((currentHumidity + (Math.random() - 0.5) * 10).toFixed(2)),
          });
        }
      } else {
        // Если диапазон не выбран - показываем данные за последние 30 минут
        for (let i = 30; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - i * 60000);
          data.push({
            timestamp: timestamp.toISOString(),
            temperature: Number((currentTemp + (Math.random() - 0.5) * 2).toFixed(2)),
            humidity: Number((currentHumidity + (Math.random() - 0.5) * 4).toFixed(2)),
          });
        }
      }
      
      setHistoricalData(data);
    };

    fetchHistoricalData();
  }, [dateRange, currentTemp, currentHumidity, sensorId]);

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const temperatureValue = payload[0]?.value;
    const humidityValue = payload[1]?.value;
    const timestamp = new Date(label || "");

    return (
      <div className="bg-background border border-border rounded shadow p-2">
        <p className="text-sm font-medium">{`Время: ${format(timestamp, "dd.MM.yyyy HH:mm")}`}</p>
        {temperatureValue !== undefined && (
          <p className="text-sm text-blue-600">{`Температура: ${temperatureValue.toFixed(2)}°C`}</p>
        )}
        {humidityValue !== undefined && (
          <p className="text-sm text-cyan-600">{`Влажность: ${humidityValue.toFixed(2)}%`}</p>
        )}
      </div>
    );
  };

  // Функция для форматирования меток времени на оси X
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    
    // Если диапазон больше 2 дней, показываем только дату
    if (dateRange?.from && dateRange.to) {
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 2) {
        return format(date, "dd.MM");
      }
    }
    
    return format(date, "HH:mm");
  };

  // Функция для выбора предустановленного диапазона
  const selectPredefinedRange = (days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    setDateRange({ from, to });
  };
  
  // Reset zoom function
  const resetZoom = (chartType: 'temperature' | 'humidity') => {
    if (chartType === 'temperature') {
      setTemperatureZoom(null);
    } else {
      setHumidityZoom(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2">
          <CardTitle className="text-lg font-medium">История показаний: {sensorName}</CardTitle>
          
          <div className="flex flex-wrap gap-2">
            {predefinedRanges.map((range) => (
              <Button 
                key={range.days}
                variant="outline" 
                size="sm"
                onClick={() => selectPredefinedRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd.MM.yyyy")} - {format(dateRange.to, "dd.MM.yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd.MM.yyyy")
                    )
                  ) : (
                    "Выберите период"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[300px]">
            <div className="flex justify-end mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => resetZoom('temperature')}
                disabled={!temperatureZoom}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Сбросить масштаб
              </Button>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={historicalData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxis}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={temperatureZoom ? 
                    [temperatureZoom.left, temperatureZoom.right] : 
                    [
                      Math.floor(Math.min(thresholds.temperature.min - 2, Math.min(...historicalData.map(d => d.temperature)))),
                      Math.ceil(Math.max(thresholds.temperature.max + 2, Math.max(...historicalData.map(d => d.temperature))))
                    ]
                  }
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine 
                  y={thresholds.temperature.min} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: `Мин: ${thresholds.temperature.min.toFixed(1)}°C`, position: 'left' }}
                />
                <ReferenceLine 
                  y={thresholds.temperature.max} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: `Макс: ${thresholds.temperature.max.toFixed(1)}°C`, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#2563eb"
                  name="Температура (°C)"
                  dot={false}
                  strokeWidth={2}
                />
                <Brush 
                  dataKey="timestamp" 
                  height={30} 
                  stroke="#8884d8"
                  tickFormatter={formatXAxis}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[300px]">
            <div className="flex justify-end mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => resetZoom('humidity')}
                disabled={!humidityZoom}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Сбросить масштаб
              </Button>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={historicalData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxis}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={humidityZoom ? 
                    [humidityZoom.left, humidityZoom.right] : 
                    [
                      Math.floor(Math.min(thresholds.humidity.min - 5, Math.min(...historicalData.map(d => d.humidity)))),
                      Math.ceil(Math.max(thresholds.humidity.max + 5, Math.max(...historicalData.map(d => d.humidity))))
                    ]
                  }
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine 
                  y={thresholds.humidity.min} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: `Мин: ${thresholds.humidity.min.toFixed(1)}%`, position: 'left' }}
                />
                <ReferenceLine 
                  y={thresholds.humidity.max} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: `Макс: ${thresholds.humidity.max.toFixed(1)}%`, position: 'right' }}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#0891b2"
                  name="Влажность (%)"
                  dot={false}
                  strokeWidth={2}
                />
                <Brush 
                  dataKey="timestamp" 
                  height={30} 
                  stroke="#8884d8"
                  tickFormatter={formatXAxis}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

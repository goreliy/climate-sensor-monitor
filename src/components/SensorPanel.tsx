
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThermometerIcon, Droplets, AlertTriangle, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SensorStatus = "normal" | "warning" | "error";

interface SensorPanelProps {
  id: number;
  name: string;
  temperature: number;
  humidity: number;
  status: SensorStatus;
  thresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
  };
  onSettingsClick?: () => void;
}

export function SensorPanel({ 
  id, 
  name, 
  temperature, 
  humidity, 
  status,
  thresholds,
  onSettingsClick 
}: SensorPanelProps) {
  const isTemperatureAlert = temperature < thresholds.temperature.min || temperature > thresholds.temperature.max;
  const isHumidityAlert = humidity < thresholds.humidity.min || humidity > thresholds.humidity.max;

  const getStatusColor = (status: SensorStatus) => {
    switch (status) {
      case "normal":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          <span>{name}</span>
          <div className="flex items-center gap-2">
            {(isTemperatureAlert || isHumidityAlert) && (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
            <span className={cn("h-3 w-3 rounded-full", getStatusColor(status))} />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onSettingsClick?.();
              }}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ThermometerIcon className={cn(
                "h-5 w-5",
                isTemperatureAlert ? "text-yellow-500" : "text-blue-500"
              )} />
              <span className="text-xl font-semibold">{temperature.toFixed(2)}°C</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {thresholds.temperature.min}°C - {thresholds.temperature.max}°C
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Droplets className={cn(
                "h-5 w-5",
                isHumidityAlert ? "text-yellow-500" : "text-blue-400"
              )} />
              <span className="text-xl font-semibold">{humidity.toFixed(2)}%</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {thresholds.humidity.min}% - {thresholds.humidity.max}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

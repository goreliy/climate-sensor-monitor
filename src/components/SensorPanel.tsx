import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThermometerIcon, Droplets } from "lucide-react";

interface SensorPanelProps {
  id: number;
  name: string;
  temperature: number;
  humidity: number;
  status: "normal" | "warning" | "error";
}

export function SensorPanel({ id, name, temperature, humidity, status }: SensorPanelProps) {
  const getStatusColor = (status: string) => {
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
        <CardTitle className="text-lg font-medium">
          {name}
          <span className={`ml-2 text-sm ${getStatusColor(status)}`}>●</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ThermometerIcon className="h-5 w-5 text-blue-500" />
            <span className="text-xl font-semibold">{temperature}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-400" />
            <span className="text-xl font-semibold">{humidity}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
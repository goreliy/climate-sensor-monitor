
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, Droplets } from "lucide-react";

interface SensorVisualizationProps {
  sensorsData: Array<{
    id: number;
    name: string;
    temperature: number;
    humidity: number;
    status: string;
    thresholds: {
      temperature: { min: number; max: number };
      humidity: { min: number; max: number };
    };
  }>;
  selectedSensorId: number;
  setSelectedSensorId: (id: number) => void;
}

export function SensorVisualization({
  sensorsData,
  selectedSensorId,
  setSelectedSensorId,
}: SensorVisualizationProps) {
  const [selectedMap, setSelectedMap] = useState<{
    id?: number;
    name: string;
    imagePath: string;
    sensorPlacements: { sensorId: number; x: number; y: number }[];
  } | null>(null);

  // Default map with uploaded background image
  const defaultMap = {
    name: "Основная схема",
    imagePath: "/lovable-uploads/22a1785b-bb83-4edf-9674-e94b3b4bb1bf.png",
    sensorPlacements: sensorsData.map((sensor, index) => {
      // Position sensors in a circular pattern
      const angle = (index / sensorsData.length) * 2 * Math.PI;
      const radius = 200;
      const centerX = 400;
      const centerY = 200;
      
      return {
        sensorId: sensor.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    }),
  };

  useEffect(() => {
    // Try to load maps from API (this would be connected to the actual API in a real app)
    const fetchMaps = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/visualizations");
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setSelectedMap(data[0]);
          } else {
            setSelectedMap(defaultMap);
          }
        } else {
          throw new Error("Failed to fetch maps");
        }
      } catch (error) {
        console.error("Error fetching visualization maps:", error);
        setSelectedMap(defaultMap);
      }
    };

    fetchMaps();
  }, []);

  // Determine if a sensor is in alert state
  const isSensorInAlert = (sensor: typeof sensorsData[0]) => {
    return (
      sensor.temperature > sensor.thresholds.temperature.max ||
      sensor.temperature < sensor.thresholds.temperature.min ||
      sensor.humidity > sensor.thresholds.humidity.max ||
      sensor.humidity < sensor.thresholds.humidity.min
    );
  };

  if (!selectedMap) {
    return <div className="flex justify-center items-center h-64">Загрузка схемы...</div>;
  }

  return (
    <div className="relative w-full h-[70vh] overflow-hidden rounded-lg">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${selectedMap.imagePath})` }}
      >
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Map Content */}
      <div className="relative z-10 w-full h-full p-4">
        <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
          {selectedMap.name}
        </h2>

        {/* Sensor Indicators */}
        {selectedMap.sensorPlacements.map((placement) => {
          const sensor = sensorsData.find((s) => s.id === placement.sensorId);
          if (!sensor) return null;

          const isAlert = isSensorInAlert(sensor);
          const isSelected = sensor.id === selectedSensorId;

          return (
            <div
              key={sensor.id}
              className={`absolute transition-all duration-300 cursor-pointer ${
                isSelected ? "scale-110 z-20" : "z-10"
              }`}
              style={{
                left: `${placement.x}px`,
                top: `${placement.y}px`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => setSelectedSensorId(sensor.id)}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isAlert
                    ? "bg-red-500/80 animate-pulse"
                    : "bg-blue-500/60"
                } ${
                  isSelected ? "ring-4 ring-white" : ""
                } backdrop-blur-sm transition-all duration-300 hover:scale-110`}
              >
                <span className="text-white font-bold drop-shadow-md">
                  {sensor.id}
                </span>
              </div>

              {isSelected && (
                <Card className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white/90 backdrop-blur-md shadow-lg z-30">
                  <CardContent className="p-3">
                    <h4 className="font-bold text-sm">{sensor.name}</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className={`flex items-center ${
                        sensor.temperature > sensor.thresholds.temperature.max ||
                        sensor.temperature < sensor.thresholds.temperature.min
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}>
                        <Thermometer className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">{sensor.temperature.toFixed(1)}°C</span>
                      </div>
                      <div className={`flex items-center ${
                        sensor.humidity > sensor.thresholds.humidity.max ||
                        sensor.humidity < sensor.thresholds.humidity.min
                          ? "text-red-600"
                          : "text-cyan-600"
                      }`}>
                        <Droplets className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">{sensor.humidity.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

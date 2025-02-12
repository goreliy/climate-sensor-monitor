
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SensorConfig {
  id?: number;
  name: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
}

interface SensorManagementProps {
  sensors: SensorConfig[];
  onSensorsChange: (sensors: SensorConfig[]) => void;
}

export function SensorManagement({ sensors, onSensorsChange }: SensorManagementProps) {
  const { toast } = useToast();
  const [newSensor, setNewSensor] = useState<SensorConfig>({
    name: "",
    tempMin: 18,
    tempMax: 26,
    humidityMin: 30,
    humidityMax: 60,
  });

  const addSensor = () => {
    if (sensors.length >= 60) {
      toast({
        title: "Ошибка",
        description: "Достигнуто максимальное количество датчиков (60)",
        variant: "destructive",
      });
      return;
    }

    if (!newSensor.name) {
      toast({
        title: "Ошибка",
        description: "Введите название датчика",
        variant: "destructive",
      });
      return;
    }

    onSensorsChange([...sensors, { ...newSensor, id: Date.now() }]);
    setNewSensor({
      name: "",
      tempMin: 18,
      tempMax: 26,
      humidityMin: 30,
      humidityMax: 60,
    });
  };

  const removeSensor = (id: number) => {
    onSensorsChange(sensors.filter(sensor => sensor.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление датчиками</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <Label>Название датчика</Label>
              <Input
                value={newSensor.name}
                onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                placeholder="Введите название"
              />
            </div>
            <div>
              <Label>Мин. темп.</Label>
              <Input
                type="number"
                value={newSensor.tempMin}
                onChange={(e) => setNewSensor({ ...newSensor, tempMin: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Макс. темп.</Label>
              <Input
                type="number"
                value={newSensor.tempMax}
                onChange={(e) => setNewSensor({ ...newSensor, tempMax: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Мин. влаж.</Label>
              <Input
                type="number"
                value={newSensor.humidityMin}
                onChange={(e) => setNewSensor({ ...newSensor, humidityMin: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Макс. влаж.</Label>
              <Input
                type="number"
                value={newSensor.humidityMax}
                onChange={(e) => setNewSensor({ ...newSensor, humidityMax: Number(e.target.value) })}
              />
            </div>
            <Button onClick={addSensor} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>

          <div className="space-y-2">
            {sensors.map((sensor) => (
              <div key={sensor.id} className="flex items-center justify-between p-4 border rounded">
                <div className="grid grid-cols-6 gap-4 flex-1">
                  <div className="col-span-2">
                    <span className="font-medium">{sensor.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">
                      Темп: {sensor.tempMin}°C - {sensor.tempMax}°C
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">
                      Влажность: {sensor.humidityMin}% - {sensor.humidityMax}%
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSensor(sensor.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {sensors.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              Нет добавленных датчиков
            </div>
          )}
          {sensors.length >= 60 && (
            <div className="text-center text-orange-500">
              Достигнуто максимальное количество датчиков (60)
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

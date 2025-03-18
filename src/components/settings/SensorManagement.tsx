
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
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
  const [editingSensor, setEditingSensor] = useState<SensorConfig | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const startEditing = (sensor: SensorConfig) => {
    setEditingSensor({ ...sensor });
    setEditingId(sensor.id!);
  };

  const cancelEditing = () => {
    setEditingSensor(null);
    setEditingId(null);
  };

  const saveEditing = () => {
    if (!editingSensor || !editingId) return;

    if (!editingSensor.name) {
      toast({
        title: "Ошибка",
        description: "Название датчика не может быть пустым",
        variant: "destructive",
      });
      return;
    }

    const updatedSensors = sensors.map(sensor => 
      sensor.id === editingId ? { ...editingSensor, id: editingId } : sensor
    );
    
    onSensorsChange(updatedSensors);
    setEditingSensor(null);
    setEditingId(null);
    
    toast({
      title: "Успех",
      description: "Датчик успешно обновлен",
    });
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
            {sensors.map((sensor) => {
              const isEditing = editingId === sensor.id;
              
              return (
                <div key={sensor.id} className="flex items-center justify-between p-4 border rounded">
                  {isEditing ? (
                    <div className="grid grid-cols-6 gap-4 flex-1">
                      <div className="col-span-2">
                        <Input
                          value={editingSensor?.name}
                          onChange={(e) => setEditingSensor({ ...editingSensor!, name: e.target.value })}
                          placeholder="Название датчика"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={editingSensor?.tempMin}
                          onChange={(e) => setEditingSensor({ ...editingSensor!, tempMin: Number(e.target.value) })}
                          placeholder="Мин. темп."
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={editingSensor?.tempMax}
                          onChange={(e) => setEditingSensor({ ...editingSensor!, tempMax: Number(e.target.value) })}
                          placeholder="Макс. темп."
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={editingSensor?.humidityMin}
                          onChange={(e) => setEditingSensor({ ...editingSensor!, humidityMin: Number(e.target.value) })}
                          placeholder="Мин. влаж."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editingSensor?.humidityMax}
                          onChange={(e) => setEditingSensor({ ...editingSensor!, humidityMax: Number(e.target.value) })}
                          placeholder="Макс. влаж."
                        />
                        <Button variant="outline" size="icon" onClick={saveEditing}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={cancelEditing}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => startEditing(sensor)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeSensor(sensor.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

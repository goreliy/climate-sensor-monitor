import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

interface SensorConfig {
  id?: number;
  name: string;
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
}

interface SettingsFormData {
  modbusPort: string;
  modbusBaudRate: number;
  modbusDataBits: number;
  modbusParity: string;
  modbusStopBits: number;
  dbPath: string;
  logLevel: string;
  logPath: string;
  telegramToken: string;
  telegramChatId: string;
  enableNotifications: boolean;
  pollingInterval: number;
}

export function Settings() {
  const { toast } = useToast();
  const [sensors, setSensors] = useState<SensorConfig[]>([]);
  const [newSensor, setNewSensor] = useState<SensorConfig>({
    name: "",
    tempMin: 18,
    tempMax: 26,
    humidityMin: 30,
    humidityMax: 60,
  });

  const form = useForm<SettingsFormData>({
    defaultValues: {
      modbusPort: "COM1",
      modbusBaudRate: 9600,
      modbusDataBits: 8,
      modbusParity: "none",
      modbusStopBits: 1,
      dbPath: "./data/sensors.db",
      logLevel: "info",
      logPath: "./logs/app.log",
      telegramToken: "",
      telegramChatId: "",
      enableNotifications: true,
      pollingInterval: 5000,
    },
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

    setSensors([...sensors, { ...newSensor, id: Date.now() }]);
    setNewSensor({
      name: "",
      tempMin: 18,
      tempMax: 26,
      humidityMin: 30,
      humidityMax: 60,
    });
  };

  const removeSensor = (id: number) => {
    setSensors(sensors.filter(sensor => sensor.id !== id));
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const settingsResponse = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const sensorsResponse = await fetch('http://localhost:3001/api/sensors/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sensors),
      });

      if (!settingsResponse.ok || !sensorsResponse.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: "Успех",
        description: "Настройки успешно сохранены",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Настройки системы</h1>
      
      <div className="grid gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Настройки Modbus RTU</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="modbusPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COM порт</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modbusBaudRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Скорость передачи (бод)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modbusDataBits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Биты данных</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modbusParity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Четность</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Настройки базы данных и логирования</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dbPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Путь к базе данных</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Путь к файлу логов</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Уровень логирования</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pollingInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Интервал опроса (мс)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Настройки уведомлений Telegram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Включить уведомления</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telegramToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Токен бота</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telegramChatId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID чата</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          onClick={form.handleSubmit(onSubmit)}
          className="w-full md:w-auto"
        >
          Сохранить настройки
        </Button>
      </div>
    </div>
  );
}

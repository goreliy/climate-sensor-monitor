import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";

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

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormData } from "./types";

interface TelegramSettingsProps {
  form: UseFormReturn<SettingsFormData>;
}

export function TelegramSettings({ form }: TelegramSettingsProps) {
  return (
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
  );
}

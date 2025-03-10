
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormData } from "./types";

interface LoggingSettingsProps {
  form: UseFormReturn<SettingsFormData>;
}

export function LoggingSettings({ form }: LoggingSettingsProps) {
  return (
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
            name="logSizeLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Максимальный размер лог-файла (МБ)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>
                  Максимальный размер файла лога в мегабайтах, после которого он будет архивирован
                </FormDescription>
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
  );
}

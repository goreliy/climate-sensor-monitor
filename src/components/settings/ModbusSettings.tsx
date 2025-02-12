
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { SettingsFormData } from "./types";

interface ModbusSettingsProps {
  form: UseFormReturn<SettingsFormData>;
}

export function ModbusSettings({ form }: ModbusSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки Modbus RTU</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}


import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsHeaderProps {
  generateMockSensors: () => Promise<void>;
}

export function SettingsHeader({ generateMockSensors }: SettingsHeaderProps) {
  const { toast } = useToast();

  const clearDatabase = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/database/clear', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "База данных очищена",
          description: "История измерений успешно удалена из базы данных",
        });
      } else {
        throw new Error('Failed to clear database');
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось очистить базу данных",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Настройки системы</h1>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={generateMockSensors}>
          Создать моковые датчики
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Database className="h-4 w-4 mr-2" />
              Очистить базу данных
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Очистить базу данных?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие удалит всю историю измерений. Данное действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={clearDatabase}>Очистить</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

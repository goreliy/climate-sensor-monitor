
import { Dashboard } from "@/components/Dashboard";
import { Settings } from "@/components/Settings";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings2, Activity, Database } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [useMockData, setUseMockData] = useState(true);
  const { toast } = useToast();

  const toggleMockData = () => {
    setUseMockData(!useMockData);
    toast({
      title: !useMockData ? "Режим мок-данных активирован" : "Режим реальных данных активирован",
      description: !useMockData 
        ? "Система использует симулированные данные" 
        : "Система подключена к реальным устройствам",
    });

    // В реальном приложении здесь был бы API-запрос для переключения режима
    fetch(`http://localhost:3001/api/mode/${!useMockData ? 'mock' : 'real'}`, {
      method: 'POST',
    }).catch(err => console.error('Failed to switch mode:', err));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch 
              id="mock-mode" 
              checked={useMockData} 
              onCheckedChange={toggleMockData} 
            />
            <Label htmlFor="mock-mode" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              {useMockData ? "Мок данные" : "Реальные данные"}
            </Label>
          </div>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {showSettings ? <Settings useMockData={useMockData} /> : <Dashboard />}
    </div>
  );
}

export default Index;

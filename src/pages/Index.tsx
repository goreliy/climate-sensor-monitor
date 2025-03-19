
import { Dashboard } from "@/components/Dashboard";
import { Settings } from "@/components/Settings";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings2, Activity, Database, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [useMockData, setUseMockData] = useState(true);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const { toast } = useToast();

  // Проверка соединения с сервером при загрузке
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const baseUrl = useMockData ? 'http://localhost:3001' : window.location.origin;
        console.log(`Проверка соединения с сервером: ${baseUrl}/api/system/status`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${baseUrl}/api/system/status`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log("Соединение с сервером установлено");
          setServerStatus('connected');
        } else {
          console.error(`Ошибка соединения с сервером: ${response.status}`);
          setServerStatus('disconnected');
        }
      } catch (error) {
        console.error("Ошибка при проверке соединения с сервером:", error);
        setServerStatus('disconnected');
      }
    };
    
    checkServerConnection();
    
    // Периодическая проверка соединения
    const interval = setInterval(checkServerConnection, 10000);
    return () => clearInterval(interval);
  }, [useMockData]);

  const toggleMockData = () => {
    setUseMockData(!useMockData);
    toast({
      title: !useMockData ? "Режим мок-данных активирован" : "Режим реальных данных активирован",
      description: !useMockData 
        ? "Система использует симулированные данные" 
        : "Система подключена к реальным устройствам",
    });

    // В реальном приложении здесь был бы API-запрос для переключения режима
    const baseUrl = useMockData ? 'http://localhost:3001' : window.location.origin;
    fetch(`${baseUrl}/api/mode/${!useMockData ? 'mock' : 'real'}`, {
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
      
      {serverStatus === 'disconnected' && !useMockData && (
        <Alert variant="destructive" className="mb-4 mx-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Предупреждение</AlertTitle>
          <AlertDescription>
            Нет соединения с сервером. Возможно, серверное приложение не запущено или недоступно. Переключитесь в режим мок-данных или проверьте соединение.
          </AlertDescription>
        </Alert>
      )}
      
      {showSettings ? <Settings useMockData={useMockData} /> : <Dashboard useMockData={useMockData} />}
    </div>
  );
}

export default Index;

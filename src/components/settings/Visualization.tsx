
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { VisualizationMap } from "./types";
import { Trash, Plus, Save } from "lucide-react";

export function Visualization() {
  const { toast } = useToast();
  const [maps, setMaps] = useState<VisualizationMap[]>([]);
  const [currentMap, setCurrentMap] = useState<VisualizationMap | null>(null);
  const [mapName, setMapName] = useState("");
  const [sensors, setSensors] = useState<{ id: number; name: string }[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");

  // Загрузка датчиков
  const loadSensors = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sensors');
      if (response.ok) {
        const data = await response.json();
        setSensors(data.map((sensor: any) => ({
          id: sensor.id,
          name: sensor.name
        })));
      }
    } catch (error) {
      console.error("Failed to load sensors:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить датчики",
        variant: "destructive",
      });
    }
  };

  // Загрузка схем визуализации
  const loadMaps = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/visualizations');
      if (response.ok) {
        const data = await response.json();
        setMaps(data);
      }
    } catch (error) {
      console.error("Failed to load visualization maps:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить схемы визуализации",
        variant: "destructive",
      });
    }
  };

  // Выбор файла изображения
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
        
        // Создаем новый объект Image для получения размеров
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          
          // Обновляем размеры canvas под изображение
          if (canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            
            // Рисуем изображение на canvas
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              ctx.drawImage(img, 0, 0);
            }
          }
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Обработка клика по canvas для размещения датчика
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedSensor || !canvasRef.current || !currentMap) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Добавляем датчик на схему
    const newPlacement = {
      sensorId: selectedSensor,
      x,
      y
    };
    
    // Обновляем текущую схему
    const updatedMap = {
      ...currentMap,
      sensorPlacements: [...(currentMap.sensorPlacements || []), newPlacement]
    };
    
    setCurrentMap(updatedMap);
    redrawCanvas(updatedMap);
    
    toast({
      title: "Датчик добавлен",
      description: `Датчик ${sensors.find(s => s.id === selectedSensor)?.name} добавлен на схему`,
    });
  };

  // Перерисовка canvas с учетом размещенных датчиков
  const redrawCanvas = (map: VisualizationMap) => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Очищаем canvas и рисуем изображение
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imageRef.current, 0, 0);
    
    // Рисуем маркеры датчиков
    map.sensorPlacements?.forEach(placement => {
      ctx.beginPath();
      ctx.arc(placement.x, placement.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.fill();
      
      // Рисуем ID датчика
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(placement.sensorId.toString(), placement.x, placement.y);
    });
  };

  // Создание новой схемы
  const createNewMap = () => {
    if (!mapName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название схемы",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentMap({
      name: mapName,
      imagePath: "",
      sensorPlacements: []
    });
    
    // Сбрасываем canvas и изображение
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    setImageUrl("");
    imageRef.current = null;
    
    // Автоматически открываем диалог выбора файла
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Сохранение схемы
  const saveMap = async () => {
    if (!currentMap) return;
    
    if (!currentMap.name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название схемы",
        variant: "destructive",
      });
      return;
    }
    
    if (!imageUrl) {
      toast({
        title: "Ошибка",
        description: "Загрузите изображение схемы",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/visualizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentMap.name,
          imagePath: imageUrl,
          sensorPlacements: currentMap.sensorPlacements
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Успех",
            description: "Схема визуализации успешно сохранена",
          });
          
          // Обновляем список схем
          loadMaps();
        }
      }
    } catch (error) {
      console.error("Failed to save visualization map:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить схему визуализации",
        variant: "destructive",
      });
    }
  };

  // Загрузка датчиков при монтировании компонента
  useState(() => {
    loadSensors();
    loadMaps();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Визуализация датчиков на плане</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="map-name">Название схемы</Label>
              <Input
                id="map-name"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="Введите название схемы"
              />
            </div>
            <Button onClick={createNewMap}>
              <Plus className="w-4 h-4 mr-2" />
              Создать новую схему
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 border rounded-md p-4">
              <div className="flex flex-col items-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {!imageUrl ? (
                  <Button 
                    variant="outline" 
                    className="h-40 w-full border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Загрузить изображение схемы
                  </Button>
                ) : (
                  <div className="w-full overflow-auto max-h-[500px]">
                    <canvas
                      ref={canvasRef}
                      onClick={handleCanvasClick}
                      className="border cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Выберите датчик для размещения</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={selectedSensor || ""}
                  onChange={(e) => setSelectedSensor(Number(e.target.value))}
                >
                  <option value="">Выберите датчик</option>
                  {sensors.map((sensor) => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Размещенные датчики</Label>
                <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                  {currentMap?.sensorPlacements?.length ? (
                    <ul className="space-y-1">
                      {currentMap.sensorPlacements.map((placement, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                          <span>
                            {sensors.find(s => s.id === placement.sensorId)?.name || `Датчик ${placement.sensorId}`}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (!currentMap) return;
                              
                              // Удаляем датчик из размещений
                              const updatedPlacements = currentMap.sensorPlacements.filter(
                                (_, i) => i !== index
                              );
                              
                              const updatedMap = {
                                ...currentMap,
                                sensorPlacements: updatedPlacements
                              };
                              
                              setCurrentMap(updatedMap);
                              redrawCanvas(updatedMap);
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Нет размещенных датчиков
                    </p>
                  )}
                </div>
              </div>

              <Button className="w-full" onClick={saveMap} disabled={!currentMap || !imageUrl}>
                <Save className="w-4 h-4 mr-2" />
                Сохранить схему
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Сохраненные схемы</h3>
            {maps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {maps.map((map) => (
                  <Card key={map.id} className="overflow-hidden">
                    <div className="h-40 bg-gray-100 relative">
                      <img
                        src={map.imagePath}
                        alt={map.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium">{map.name}</h4>
                      <p className="text-sm text-gray-500">
                        {map.sensorPlacements.length} датчиков
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                Нет сохраненных схем визуализации
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

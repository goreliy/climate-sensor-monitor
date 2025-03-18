
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { VisualizationMap, SensorPlacement } from "./types";
import { Trash, Plus, Save, Image } from "lucide-react";

export function Visualization() {
  const { toast } = useToast();
  const [maps, setMaps] = useState<VisualizationMap[]>([]);
  const [currentMap, setCurrentMap] = useState<VisualizationMap | null>(null);
  const [mapName, setMapName] = useState("");
  const [sensors, setSensors] = useState<{ id: number; name: string }[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");

  // Load sensors
  const loadSensors = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/sensors');
      if (response.ok) {
        const data = await response.json();
        setSensors(data.map((sensor: any) => ({
          id: sensor.id,
          name: sensor.name
        })));
      } else {
        throw new Error('Failed to load sensors');
      }
    } catch (error) {
      console.error("Failed to load sensors:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить датчики",
        variant: "destructive",
      });
      // Set mock data for testing
      const mockSensors = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `Тестовый датчик ${i + 1}`
      }));
      setSensors(mockSensors);
    } finally {
      setIsLoading(false);
    }
  };

  // Load visualization maps
  const loadMaps = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/visualizations');
      if (response.ok) {
        const data = await response.json();
        setMaps(data);
        console.log("Loaded maps:", data);
      } else {
        throw new Error('Failed to load visualization maps');
      }
    } catch (error) {
      console.error("Failed to load visualization maps:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить схемы визуализации",
        variant: "destructive",
      });
      // Set empty maps array
      setMaps([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadSensors();
    loadMaps();
  }, []);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageUrl(e.target.result as string);
        
        // Create a new Image object to get dimensions
        const img = new window.Image();
        img.onload = () => {
          imageRef.current = img;
          
          // Update canvas dimensions to match the image
          if (canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            
            // Draw the image on canvas
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

  // Handle canvas click to place a sensor
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedSensor || !canvasRef.current || !currentMap) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Add sensor to the map
    const newPlacement: SensorPlacement = {
      sensorId: selectedSensor,
      x,
      y
    };
    
    // Update current map
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

  // Redraw canvas with placed sensors
  const redrawCanvas = (map: VisualizationMap) => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(imageRef.current, 0, 0);
    
    // Draw sensor markers
    map.sensorPlacements?.forEach(placement => {
      ctx.beginPath();
      ctx.arc(placement.x, placement.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
      ctx.fill();
      
      // Draw sensor ID
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(placement.sensorId.toString(), placement.x, placement.y);
    });
  };

  // Create a new map
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
    
    // Reset canvas and image
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    setImageUrl("");
    imageRef.current = null;
    
    // Automatically open file dialog
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Save the current map
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
      setIsSaving(true);
      
      const mapData = {
        name: currentMap.name,
        imagePath: imageUrl,
        sensorPlacements: currentMap.sensorPlacements || []
      };
      
      console.log("Saving map data:", mapData);
      
      const response = await fetch('http://localhost:3001/api/visualizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Успех",
          description: "Схема визуализации успешно сохранена",
        });
        
        // Update the maps list
        loadMaps();
        
        // Reset form
        setMapName("");
        setCurrentMap(null);
        setImageUrl("");
        imageRef.current = null;
        
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      } else {
        throw new Error(result.error || 'Не удалось сохранить схему');
      }
    } catch (error) {
      console.error("Failed to save visualization map:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить схему визуализации",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load a map for editing
  const loadMapForEdit = (map: VisualizationMap) => {
    setMapName(map.name);
    setCurrentMap(map);
    setImageUrl(map.imagePath);
    
    // Load the image
    const img = new window.Image();
    img.onload = () => {
      imageRef.current = img;
      
      if (canvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0);
          
          // Draw sensor placements
          map.sensorPlacements?.forEach(placement => {
            ctx.beginPath();
            ctx.arc(placement.x, placement.y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(placement.sensorId.toString(), placement.x, placement.y);
          });
        }
      }
    };
    img.src = map.imagePath;
  };

  // Delete a map
  const deleteMap = async (mapId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/visualizations/${mapId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Успех",
          description: "Схема визуализации удалена",
        });
        
        // Update the maps list
        loadMaps();
      } else {
        throw new Error(result.error || 'Не удалось удалить схему');
      }
    } catch (error) {
      console.error("Failed to delete visualization map:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить схему визуализации",
        variant: "destructive",
      });
    }
  };

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
                    <Image className="w-6 h-6 mr-2" />
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
                              
                              // Remove sensor from placements
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

              <Button 
                className="w-full" 
                onClick={saveMap} 
                disabled={!currentMap || !imageUrl || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Сохранение..." : "Сохранить схему"}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Сохраненные схемы</h3>
            {isLoading ? (
              <p>Загрузка схем...</p>
            ) : maps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {maps.map((map) => (
                  <Card key={map.id} className="overflow-hidden">
                    <div className="h-40 bg-gray-100 relative">
                      <img
                        src={map.imagePath}
                        alt={map.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="w-8 h-8 bg-white bg-opacity-80"
                          onClick={() => loadMapForEdit(map)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="w-8 h-8 bg-white bg-opacity-80"
                          onClick={() => {
                            if (window.confirm(`Удалить схему "${map.name}"?`)) {
                              deleteMap(map.id!);
                            }
                          }}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium">{map.name}</h4>
                      <p className="text-sm text-gray-500">
                        {map.sensorPlacements?.length || 0} датчиков
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

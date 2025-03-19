
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash, AlertTriangle, RefreshCcw, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ModbusPacket {
  id: number;
  timestamp: string;
  type: "request" | "response";
  deviceAddress: number;
  functionCode: number;
  data: string;
  crc: string;
  raw: string;
  isValid: boolean;
  isMock?: boolean;
}

export function ModbusVisualizer() {
  const [packets, setPackets] = useState<ModbusPacket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMockMode, setIsMockMode] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1000);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchModbusData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/modbus/logs');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Modbus logs: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setPackets(data);
        
        // Determine operating mode from the first packet
        if (data.length > 0 && data[0].hasOwnProperty('isMock')) {
          setIsMockMode(data[0].isMock);
        }
        
        setError(null);
        
        if (autoScroll && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } catch (error) {
        console.error('Error fetching Modbus logs:', error);
        setError(error instanceof Error ? error.message : 'Unknown error getting Modbus logs');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchModbusData();

    // Set up polling if autoRefresh is enabled
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(fetchModbusData, refreshInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoScroll, refreshInterval, autoRefresh]);

  const clearLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/modbus/logs/clear', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear logs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPackets([]);
        toast({
          title: "Success",
          description: "Modbus logs cleared",
        });
      } else {
        throw new Error(data.message || 'Failed to clear logs');
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Unknown error clearing logs',
        variant: "destructive",
      });
    }
  };

  const refreshLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/modbus/logs');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Modbus logs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setPackets(data);
      setError(null);
      
      if (autoScroll && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      
      toast({
        title: "Updated",
        description: "Modbus logs refreshed",
      });
    } catch (error) {
      console.error('Error fetching Modbus logs:', error);
      setError(error instanceof Error ? error.message : 'Unknown error getting Modbus logs');
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to refresh logs',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format hex data with spaces for better readability
  const formatHexData = (hex: string) => {
    return hex.match(/.{1,2}/g)?.join(' ') || hex;
  };

  // Get function name from function code
  const getFunctionName = (code: number) => {
    switch (code) {
      case 1: return "Read Coil Status";
      case 2: return "Read Input Status";
      case 3: return "Read Holding Registers";
      case 4: return "Read Input Registers";
      case 5: return "Write Single Coil";
      case 6: return "Write Single Register";
      case 15: return "Write Multiple Coils";
      case 16: return "Write Multiple Registers";
      default: 
        // Error codes (0x80 + function code)
        if (code >= 0x80 && code <= 0x8F) {
          return `Error (${code - 0x80})`;
        }
        return `Unknown Function (${code})`;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg font-medium">Modbus Visualization</CardTitle>
          <div className="flex items-center">
            <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950">
              Web Modbus Emulation
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Using web-based Modbus emulation that doesn't require native dependencies. 
                    This provides a fully functional Modbus simulation without requiring hardware or native modules.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? "Disable Auto-scroll" : "Enable Auto-scroll"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Disable Auto-refresh" : "Enable Auto-refresh"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshLogs}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} mr-1`} />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={clearLogs}
          >
            <Trash className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-4" ref={scrollRef}>
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
              <AlertTriangle size={24} />
              <p>{error}</p>
            </div>
          ) : loading && packets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading Modbus data...
            </div>
          ) : packets.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No Modbus data available
            </div>
          ) : (
            <div className="space-y-3">
              {packets.map((packet) => (
                <div 
                  key={packet.id} 
                  className={`p-3 rounded-md border ${
                    packet.type === "request" 
                      ? "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800" 
                      : "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={packet.type === "request" ? "default" : "outline"}>
                        {packet.type === "request" ? "Request" : "Response"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(packet.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        Web Emulation
                      </Badge>
                    </div>
                    <Badge variant={packet.isValid ? "default" : "destructive"}>
                      {packet.isValid ? "CRC OK" : "CRC ERROR"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="font-medium">Device Address:</span> 0x{packet.deviceAddress.toString(16).padStart(2, '0')}
                    </div>
                    <div>
                      <span className="font-medium">Function:</span> 0x{packet.functionCode.toString(16).padStart(2, '0')}
                      {" "}({getFunctionName(packet.functionCode)})
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Data:</span> {formatHexData(packet.data)}
                    </div>
                    <div>
                      <span className="font-medium">CRC:</span> {formatHexData(packet.crc)}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">RAW:</span> <code className="text-xs">{formatHexData(packet.raw)}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

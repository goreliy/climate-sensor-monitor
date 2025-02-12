
import { Dashboard } from "@/components/Dashboard";
import { Settings } from "@/components/Settings";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-end p-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
      {showSettings ? <Settings /> : <Dashboard />}
    </div>
  );
}

export default Index;

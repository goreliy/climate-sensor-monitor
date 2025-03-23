
import { Button } from "@/components/ui/button";
import { Save, Archive } from "lucide-react";

interface SettingsActionsProps {
  isSaving: boolean;
  onBackup?: () => void;
}

export function SettingsActions({ isSaving, onBackup }: SettingsActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button 
        type="submit" 
        className="w-full sm:w-auto"
        disabled={isSaving}
      >
        <Save className="h-4 w-4 mr-2" />
        {isSaving ? "Сохранение..." : "Сохранить настройки"}
      </Button>
      
      {onBackup && (
        <Button 
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onBackup}
          disabled={isSaving}
        >
          <Archive className="h-4 w-4 mr-2" />
          Сделать резервную копию
        </Button>
      )}
    </div>
  );
}

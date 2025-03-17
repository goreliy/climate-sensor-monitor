
import { Button } from "@/components/ui/button";

interface SettingsActionsProps {
  isSaving: boolean;
}

export function SettingsActions({ isSaving }: SettingsActionsProps) {
  return (
    <Button 
      type="submit" 
      className="w-full md:w-auto"
      disabled={isSaving}
    >
      {isSaving ? "Сохранение..." : "Сохранить настройки"}
    </Button>
  );
}

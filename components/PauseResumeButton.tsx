import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

interface PauseResumeButtonProps {
  isPaused: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  togglePause: () => void;
}

export const PauseResumeButton: React.FC<PauseResumeButtonProps> = ({ isPaused, gameStarted, gameOver, togglePause }) => {
  return (
    gameStarted && !gameOver && (
      <Button variant="outline" size="icon" onClick={togglePause} className="flex items-center" style={{ backgroundColor: isPaused ? "var(--accent)" : "transparent" }}>{isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} <span className="sr-only">{isPaused ? "Resume" : "Pause"}</span></Button>
    )
  );
};

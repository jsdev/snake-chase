import { Button } from "@/components/ui/button";

interface GamePausedOverlayProps {
  isPaused: boolean;
  togglePause: () => void;
}

export const GamePausedOverlay: React.FC<GamePausedOverlayProps> = ({ isPaused, togglePause }) => {
  return (
    isPaused && (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
        <Button onClick={togglePause} className="text-lg font-bold">
          Resume (P)
        </Button>
      </div>
    )
  );
};
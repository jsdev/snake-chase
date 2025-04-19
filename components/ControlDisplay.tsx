import type { GameSettings as GameSettingsType } from "@/lib/types";

interface ControlDisplayProps {
  settings: GameSettingsType;
}

export const ControlDisplay: React.FC<ControlDisplayProps> = ({ settings }) => {
  return (
    <div style={{ color: "var(--text)" }}>
      <p className="mb-2 text-sm">Controls:</p>
      {settings.isMultiplayer ? (
        <div className="text-sm">
          <p>
            Player 1: <span className="font-bold">WASD</span>
          </p>
          <p>
            Player 2: <span className="font-bold">Arrow Keys</span>
          </p>
          <p>
            Pause: <span className="font-bold">P / Esc</span>
          </p>
        </div>
      ) : (
        <div className="text-sm">
          <p>
            Movement: <span className="font-bold">Arrow Keys</span>
          </p>
          <p>
            Pause: <span className="font-bold">P / Esc</span>
          </p>
        </div>
      )}
    </div>
  );
};

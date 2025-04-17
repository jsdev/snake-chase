import React from 'react';
import { cva } from 'class-variance-authority';

interface PlayerData {
  color: string;
  lives: number;
  score: number;
}

interface ScoreLifeDisplayProps {
  player1: PlayerData;
  player2?: PlayerData; // Optional for single-player
}

const snakeHead = cva("relative flex flex-col justify-center items-center", {
  variants: {
    isDead: {
      true: "opacity-50",
      false: "opacity-100"
    }
  }
})

const ScoreLifeDisplay: React.FC<ScoreLifeDisplayProps> = ({ player1, player2 }) => {
  const renderPlayer = (player: PlayerData) => (
    <div className="text-center mx-5">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, index) => {
          const isDead = index >= player.lives;
          return (
            <div
              key={index}
              className={snakeHead({ isDead })}
            >
              <svg width="40" height="30" viewBox="0 0 100 75">
                <rect x="20" y="0" width="60" height="50" fill={player.color} rx="10" />
                <rect x="38" y="15" width="5" height="5" fill="black" />
                <rect x="57" y="15" width="5" height="5" fill="black" />
                {isDead && (
                  <>
                    <line x1="35" y1="10" x2="45" y2="25" stroke="black" strokeWidth="3" />
                    <line x1="45" y1="10" x2="35" y2="25" stroke="black" strokeWidth="3" />
                    <line x1="55" y1="10" x2="65" y2="25" stroke="black" strokeWidth="3" />
                    <line x1="65" y1="10" x2="55" y2="25" stroke="black" strokeWidth="3" />
                  </>
                )}
              </svg>
            </div>
          )
        })}
      </div>
      <p className="text-blue-500 font-bold text-xl mt-1">{player.score}</p>
    </div>
  );

  return (
    <div className="flex justify-between items-center w-full px-4">
      {renderPlayer(player1)}
      {player2 && renderPlayer(player2)}
    </div>
  );
};

export default ScoreLifeDisplay;
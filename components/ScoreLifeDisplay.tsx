import React from 'react';
import { cva } from 'class-variance-authority';

interface PlayerData {
  color: string;
  lives: number;
  score: number;
}

interface ScoreLifeDisplayProps {
  player1: PlayerData;
  startingLives?: number;
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

const ScoreLifeDisplay: React.FC<ScoreLifeDisplayProps> = ({ player1, player2, startingLives = 3 }) => {
  const renderPlayer = (player: PlayerData) => (
    <div className="text-center mx-5">
      <div className="flex gap-2">
        {Array.from({ length: startingLives }).map((_, index) => {
          const isDead = index >= player?.lives;
          return (
            <div
              key={index}
              className={snakeHead({ isDead })}
            >
              <svg width="40" height="25" viewBox="0 0 40 40">
                <rect x="0" y="0" width="40" height="40" fill={player?.color || 'transparent'}  rx="0"></rect>
                <rect x="10" y="15" width="5" height="5" fill="black"></rect>
                <rect x="25" y="15" width="5" height="5" fill="black"></rect>
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
      <p className="text-blue-500 font-bold text-xl mt-1">{player?.score || ''}</p>
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
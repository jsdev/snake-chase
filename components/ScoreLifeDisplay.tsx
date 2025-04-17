import React from 'react';

interface PlayerData {
  color: string;
  lives: number;
  score: number;
}

interface ScoreLifeDisplayProps {
  player1: PlayerData;
  player2?: PlayerData; // Optional for single-player
}

const ScoreLifeDisplay: React.FC<ScoreLifeDisplayProps> = ({ player1, player2 }) => {
  const renderPlayer = (player: PlayerData, playerNum: 1 | 2) => (
    <div style={{ textAlign: 'center', margin: '0 20px' }}>
      {player.lives > 0 ? (
        <svg width="40" height="30" viewBox="0 0 100 75">
          <rect x="20" y="0" width="60" height="50" fill={player.color} rx="10" />
          <circle cx="40" cy="25" r="5" fill="white" />
          <circle cx="60" cy="25" r="5" fill="white" />
          <text x="40" y="28" fontSize="10px" textAnchor="middle" fill="black" >x</text>
          <text x="60" y="28" fontSize="10px" textAnchor="middle" fill="black">x</text>
        </svg>
      ) : (
        <svg width="40" height="30" viewBox="0 0 100 75">
          <rect x="20" y="0" width="60" height="50" fill={player.color} fillOpacity=".5" rx="10" />
          <text x="35" y="35" fontSize="15px" fill="black">X</text>
          <text x="65" y="35" fontSize="15px" fill="black">X</text>
        </svg>
      )}
      <p style={{ color: player.color, fontWeight: 'bold' }}>Score: {player.score}</p>
      <p style={{ color: player.color, fontWeight: 'bold' }}>Lives: {player.lives}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {renderPlayer(player1, 1)}
      {player2 && renderPlayer(player2, 2)}
    </div>
  );
};

export default ScoreLifeDisplay;
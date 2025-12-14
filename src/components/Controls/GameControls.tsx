import React from 'react';
import { ACTION_TYPES, type GameAction } from '../../engine/GameEngine';
import type { GameState } from '../../types';
import styles from './GameControls.module.css';

interface GameControlsProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const GameControls: React.FC<GameControlsProps> = ({ gameState, dispatch }) => {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  if (!currentPlayer) return null;

  return (
    <div className={styles.controlsContainer}>
      <div className={styles.playerInfo} style={{ borderLeft: `4px solid ${currentPlayer.color}` }}>
        <h2 className={styles.playerName}>{currentPlayer.name}</h2>
        <div className={styles.money}>${currentPlayer.money}</div>
        <div className={styles.status}>
           {gameState.turnPhase === 'roll' ? 'Waiting to Roll' : 'Action Phase'}
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.button}
          disabled={gameState.turnPhase !== 'roll'}
          onClick={() => dispatch({ type: ACTION_TYPES.ROLL_DICE })}
        >
          Roll Dice
        </button>
        
        <button 
          className={styles.button}
          disabled={gameState.turnPhase === 'roll'}
          onClick={() => dispatch({ type: ACTION_TYPES.END_TURN })}
        >
          End Turn
        </button>
      </div>

      <div className={styles.log}>
         <div className={styles.logEntry}>{gameState.lastAction}</div>
      </div>
    </div>
  );
};

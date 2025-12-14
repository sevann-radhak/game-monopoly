import React from 'react'; // React import needed
import { ACTION_TYPES, type GameAction } from '../../engine/GameEngine'; // Removed ActionDispatch import if not exported
import type { GameState } from '../../types';
// Dice removed from here based on user request
import styles from './GameControls.module.css';

interface GameControlsProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  toggleTheme: () => void;
  currentTheme: 'dark' | 'light';
  isRolling: boolean;
  setIsRolling: (rolling: boolean) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ 
  gameState, 
  dispatch, 
  toggleTheme, 
  currentTheme,
  isRolling,
  setIsRolling
}) => {
  // const [isRolling, setIsRolling] = useState(false); // Prop now

  const handleRoll = () => {
    setIsRolling(true);
    // Delay actual dispatch to allow animation
    setTimeout(() => {
      dispatch({ type: ACTION_TYPES.ROLL_DICE });
      setIsRolling(false);
    }, 1000);
  };

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  if (!currentPlayer) return null;

  return (
    <div className={styles.controlsContainer}>
      <div className={styles.playerInfo} style={{ borderLeft: `4px solid ${currentPlayer.color}` }}>
        <h2 className={styles.playerName}>{currentPlayer.name}</h2>
        <div className={styles.money}>${currentPlayer.money}</div>
        <div className={`${styles.status} ${gameState.turnPhase === 'roll' ? styles.statusActive : ''}`}>
           {gameState.turnPhase === 'roll' ? '🎲 ROLL DICE TO MOVE' : 'ACTION PHASE'}
        </div>
      </div>

      <div className={styles.actions}>
        <button 
           className={styles.themeToggle} 
           onClick={toggleTheme}
           title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {currentTheme === 'dark' ? '☀️' : '🌙'}
        </button>



        {/* Dice removed from here */}

        {/* Buy / Property Status Logic */}
        {(() => {
             const currentSpace = gameState.board.find(s => s.position === currentPlayer.position);
             
             // Only relevant if landed on a property
             if (currentSpace?.type === 'property' && gameState.turnPhase === 'action') {
                 if (currentSpace.owner) {
                     const owner = gameState.players.find(p => p.id === currentSpace.owner);
                     return (
                         <div className={styles.propertyStatus} style={{ borderColor: owner?.color }}>
                             Owned by {owner?.name}
                             {/* Rent logic could go here */}
                         </div>
                     );
                 }
                 
                 const canAfford = currentPlayer.money >= (currentSpace.price || 0);

                 return (
                    <button 
                        className={styles.button}
                        disabled={!canAfford}
                        style={{ backgroundColor: canAfford ? 'var(--accent-gold)' : 'var(--bg-secondary)' }}
                        onClick={() => canAfford && dispatch({ type: ACTION_TYPES.BUY_PROPERTY })}
                    >
                        {canAfford 
                            ? `Buy ${currentSpace.name} ($${currentSpace.price})` 
                            : `Need $${currentSpace.price} to Buy`}
                    </button>
                 );
             }
             return null;
        })()}

        <button 
          className={styles.button}
          disabled={gameState.turnPhase !== 'roll' || isRolling}
          onClick={handleRoll}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
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

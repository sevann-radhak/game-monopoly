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

  const isCardPhase = gameState.turnPhase === 'card';
  const isBotTurn = currentPlayer.type === 'bot';

  return (
    <div className={styles.controlsContainer}>
      <div className={styles.playerInfo} style={{ borderLeft: `4px solid ${currentPlayer.color}` }}>
        <h2 className={styles.playerName}>{currentPlayer.name}</h2>
        <div className={styles.money}>${currentPlayer.money}</div>
        <div className={`${styles.status} ${gameState.turnPhase === 'roll' ? styles.statusActive : ''}`}>
           {isCardPhase ? '🎴 RESOLVING CARD...' : (gameState.turnPhase === 'roll' ? '🎲 ROLL DICE TO MOVE' : 'ACTION PHASE')}
        </div>
      </div>

      <div className={styles.actions}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
          <button 
             className={styles.themeToggle} 
             onClick={toggleTheme}
             disabled={isCardPhase}
             title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {currentTheme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>



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
                    <div className={styles.propertyActions}>
                      <button 
                          className={styles.button}
                          disabled={isBotTurn || !canAfford || isCardPhase}
                          style={{ backgroundColor: (canAfford && !isCardPhase && !isBotTurn) ? 'var(--accent-gold)' : 'var(--bg-secondary)', marginBottom: '0.5rem' }}
                          onClick={() => !isBotTurn && canAfford && !isCardPhase && dispatch({ type: ACTION_TYPES.BUY_PROPERTY })}
                      >
                          {canAfford 
                              ? `Buy ${currentSpace.name} ($${currentSpace.price})` 
                              : `Need $${currentSpace.price} to Buy`}
                      </button>
                      <button 
                          className={styles.auctionButton}
                          disabled={isBotTurn || isCardPhase}
                          onClick={() => !isBotTurn && !isCardPhase && dispatch({ type: ACTION_TYPES.DECLINE_PURCHASE })}
                      >
                          Decline & Auction
                      </button>
                    </div>
                 );
             }
             return null;
        })()}

        {/* Jail Controls */}
        {currentPlayer.isInJail && gameState.turnPhase === 'roll' && (
          <>
            <button 
              className={styles.button}
              disabled={isBotTurn || currentPlayer.money < 50 || isRolling || isCardPhase}
              onClick={() => !isBotTurn && !isCardPhase && dispatch({ type: ACTION_TYPES.PAY_JAIL_FINE })}
            >
              Pay $50 Fine
            </button>
            {currentPlayer.getOutOfJailFreeCards > 0 && (
              <button 
                className={styles.button}
                disabled={isBotTurn || isRolling || isCardPhase}
                onClick={() => !isBotTurn && !isCardPhase && dispatch({ type: ACTION_TYPES.USE_JAIL_CARD })}
              >
                Use Get Out of Jail Free Card
              </button>
            )}
          </>
        )}

        <button 
          className={styles.button}
          disabled={(isBotTurn || (gameState.turnPhase !== 'roll' && !(gameState.dice[0] === gameState.dice[1] && gameState.dice[0] !== 0 && !currentPlayer.isInJail)) || isRolling || isCardPhase)}
          onClick={() => !isBotTurn && !isCardPhase && handleRoll()}
        >
          {isRolling ? 'Rolling...' : (gameState.dice[0] === gameState.dice[1] && gameState.dice[0] !== 0 && !currentPlayer.isInJail ? 'Roll Again' : (currentPlayer.isInJail ? 'Try for Doubles' : 'Roll Dice'))}
        </button>
        
        <button 
          className={styles.button}
          disabled={
            isBotTurn ||
            isCardPhase ||
            gameState.turnPhase === 'roll' || 
            gameState.turnPhase === 'auction' ||
            (gameState.dice[0] === gameState.dice[1] && gameState.dice[0] !== 0 && !currentPlayer.isInJail) ||
            (gameState.turnPhase === 'action' && !!gameState.board.find(s => s.position === currentPlayer.position && s.type === 'property' && !s.owner))
          }
          onClick={() => !isBotTurn && !isCardPhase && dispatch({ type: ACTION_TYPES.END_TURN })}
        >
          End Turn
        </button>

        <button 
          className={styles.button}
          disabled={isBotTurn || isCardPhase}
          onClick={() => !isBotTurn && !isCardPhase && dispatch({ type: ACTION_TYPES.SETUP_TRADE })}
        >
          Propose Trade
        </button>


        {currentPlayer.money < 0 && (
          <button 
            className={`${styles.button} ${styles.bankruptcyButton}`}
            disabled={isBotTurn || isCardPhase}
            onClick={() => !isBotTurn && !isCardPhase && dispatch({ type: ACTION_TYPES.DECLARE_BANKRUPTCY })}
          >
            Declare Bankruptcy
          </button>
        )}
      </div>


        <div className={styles.log}>
         <div className={styles.logEntry}>{gameState.lastAction}</div>
      </div>
    </div>
  );
};

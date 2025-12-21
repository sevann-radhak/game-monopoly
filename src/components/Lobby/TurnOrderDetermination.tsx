import React, { useState, useEffect, useCallback } from 'react';
import type { LobbyState, PlayerSlot } from '../../types';
import { Dice } from '../Dice/Dice';
import styles from './TurnOrderDetermination.module.css';

interface TurnOrderDeterminationProps {
  lobby: LobbyState;
  onComplete: (turnOrder: string[]) => void;
}

interface PlayerRoll {
  slotId: string;
  slot: PlayerSlot;
  roll: number | null;
  dice: [number, number] | null;
  isRolling: boolean;
  hasRolled: boolean;
}

export const TurnOrderDetermination: React.FC<TurnOrderDeterminationProps> = ({
  lobby,
  onComplete,
}) => {
  const [playerRolls, setPlayerRolls] = useState<PlayerRoll[]>(() => {
    return lobby.config.playerSlots.map(slot => ({
      slotId: slot.id,
      slot,
      roll: null,
      dice: null,
      isRolling: false,
      hasRolled: false,
    }));
  });

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [allRolled, setAllRolled] = useState(false);
  const [isDetermining, setIsDetermining] = useState(false);

  const currentPlayer = playerRolls[currentPlayerIndex];

  const rollDice = (): [number, number] => {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
  };

  const performRoll = useCallback(() => {
    setPlayerRolls(prev => {
      const current = prev[currentPlayerIndex];
      if (current.hasRolled || current.isRolling) return prev;

      const updated = [...prev];
      updated[currentPlayerIndex] = {
        ...updated[currentPlayerIndex],
        isRolling: true,
      };
      return updated;
    });

    setTimeout(() => {
      const [die1, die2] = rollDice();
      const total = die1 + die2;

      setPlayerRolls(prev => {
        const updated = [...prev];
        updated[currentPlayerIndex] = {
          ...updated[currentPlayerIndex],
          roll: total,
          dice: [die1, die2],
          isRolling: false,
          hasRolled: true,
        };
        return updated;
      });

      const nextIndex = currentPlayerIndex + 1;
      if (nextIndex < playerRolls.length) {
        setTimeout(() => {
          setCurrentPlayerIndex(nextIndex);
        }, 1000);
      } else {
        setTimeout(() => {
          setAllRolled(true);
        }, 1000);
      }
    }, 1500);
  }, [currentPlayerIndex, playerRolls.length]);

  const handleRoll = () => {
    performRoll();
  };

  useEffect(() => {
    const current = playerRolls[currentPlayerIndex];
    if (current && current.slot.type === 'bot' && !current.hasRolled && !current.isRolling) {
      const timer = setTimeout(() => {
        performRoll();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, playerRolls, performRoll]);

  useEffect(() => {
    if (allRolled && !isDetermining) {
      setIsDetermining(true);
      
      setTimeout(() => {
        const sortedRolls = [...playerRolls].sort((a, b) => {
          const rollA = a.roll || 0;
          const rollB = b.roll || 0;
          
          if (rollB !== rollA) {
            return rollB - rollA;
          }
          
          return a.slotId.localeCompare(b.slotId);
        });

        const turnOrder = sortedRolls.map(pr => pr.slotId);
        onComplete(turnOrder);
      }, 2000);
    }
  }, [allRolled, isDetermining, playerRolls, onComplete]);

  if (allRolled) {
    const sortedRolls = [...playerRolls].sort((a, b) => {
      const rollA = a.roll || 0;
      const rollB = b.roll || 0;
      return rollB !== rollA ? rollB - rollA : a.slotId.localeCompare(b.slotId);
    });

    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <h2 className={styles.title}>Turn Order Determined!</h2>
          <div className={styles.orderList}>
            {sortedRolls.map((playerRoll, index) => (
              <div
                key={playerRoll.slotId}
                className={styles.orderItem}
                style={{ '--player-color': playerRoll.slot.color } as React.CSSProperties}
              >
                <div className={styles.orderNumber}>{index + 1}</div>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>{playerRoll.slot.name}</div>
                  <div className={styles.rollValue}>Rolled: {playerRoll.roll}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.loading}>Starting game...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h2 className={styles.title}>Determine Turn Order</h2>
        <p className={styles.subtitle}>
          Each player rolls the dice. Highest roll goes first!
        </p>

        <div className={styles.currentPlayerSection}>
          <div className={styles.currentPlayerCard}>
            <div
              className={styles.playerColorBar}
              style={{ backgroundColor: currentPlayer.slot.color }}
            />
            <div className={styles.playerName}>{currentPlayer.slot.name}</div>
            <div className={styles.playerType}>
              {currentPlayer.slot.type === 'human' ? '👤 Human' : '🤖 Bot'}
            </div>
          </div>

          <div className={styles.diceSection}>
            {currentPlayer.isRolling ? (
              <>
                <Dice value={Math.floor(Math.random() * 6) + 1} isRolling={true} />
                <Dice value={Math.floor(Math.random() * 6) + 1} isRolling={true} />
              </>
            ) : currentPlayer.hasRolled && currentPlayer.dice ? (
              <>
                <Dice value={currentPlayer.dice[0]} isRolling={false} />
                <Dice value={currentPlayer.dice[1]} isRolling={false} />
                <div className={styles.rollTotal}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalValue}>{currentPlayer.roll}</span>
                </div>
              </>
            ) : (
              <div className={styles.rollPrompt}>
                {currentPlayer.slot.type === 'human' ? (
                  <button
                    className={styles.rollButton}
                    onClick={handleRoll}
                    disabled={currentPlayer.isRolling}
                  >
                    Roll Dice
                  </button>
                ) : (
                  <div className={styles.autoRolling}>Bot rolling...</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${((currentPlayerIndex + (currentPlayer.hasRolled ? 1 : 0)) / playerRolls.length) * 100}%`,
              }}
            />
          </div>
          <div className={styles.progressText}>
            {currentPlayerIndex + (currentPlayer.hasRolled ? 1 : 0)} / {playerRolls.length} players rolled
          </div>
        </div>

        <div className={styles.rollsList}>
          {playerRolls.map((playerRoll, index) => (
            <div
              key={playerRoll.slotId}
              className={`${styles.rollItem} ${
                index === currentPlayerIndex ? styles.current : ''
              } ${playerRoll.hasRolled ? styles.completed : ''}`}
            >
              <div
                className={styles.rollItemColor}
                style={{ backgroundColor: playerRoll.slot.color }}
              />
              <span className={styles.rollItemName}>{playerRoll.slot.name}</span>
              {playerRoll.hasRolled && (
                <span className={styles.rollItemValue}>{playerRoll.roll}</span>
              )}
              {index === currentPlayerIndex && !playerRoll.hasRolled && (
                <span className={styles.rollItemStatus}>Rolling...</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


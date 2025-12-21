import React from 'react';
import type { GameState } from '../../types';
import styles from './VictoryModal.module.css';

interface VictoryModalProps {
  gameState: GameState;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ gameState }) => {
  const winner = gameState.players.find(p => p.id === gameState.winnerId);

  if (!winner) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className={styles.particle} />
        ))}
      </div>
      
      <div className={styles.container}>
        <div className={styles.trophy}>🏆</div>
        <h1 className={styles.title}>VICTORY</h1>
        <div className={styles.winnerName} style={{ color: winner.color }}>
          {winner.name}
        </div>
        <p className={styles.subtitle}>Has conquered the board!</p>
        
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Final Balance</span>
            <span className={styles.statValue}>${winner.money}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Properties</span>
            <span className={styles.statValue}>{winner.properties.length}</span>
          </div>
        </div>

        <button className={styles.restartBtn} onClick={() => window.location.reload()}>
          New Game
        </button>
      </div>
    </div>
  );
};

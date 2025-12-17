import React, { useState } from 'react';
import type { GameState } from '../../types';
import { PropertyCard } from '../Property/PropertyCard';
import { ACTION_TYPES, type GameAction } from '../../engine/GameEngine';
import { canBuildHouse } from '../../engine/domain/rules/BuildingRules';
import styles from './PlayerDashboard.module.css';

interface DashboardProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  onFocusProperty: (propertyId: string) => void;
}

export const PlayerDashboard: React.FC<DashboardProps> = ({ gameState, dispatch, onFocusProperty }) => {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(gameState.currentPlayerId);

  const togglePlayer = (pid: string) => {
    setExpandedPlayerId(prev => prev === pid ? null : pid);
  };

  return (
    <div className={styles.dashboard}>
      <h3 className={styles.header}>Players</h3>
      <div className={styles.playerList}>
        {gameState.players.map(player => (
          <div key={player.id} className={`${styles.playerItem} ${expandedPlayerId === player.id ? styles.expanded : ''}`}>
            
            <div 
                className={styles.playerSummary} 
                onClick={() => togglePlayer(player.id)}
                style={{ borderLeftColor: player.color }}
            >
              <span className={styles.name}>{player.name}</span>
              <span className={styles.money}>${player.money}</span>
              <span className={styles.propCount}>{player.properties.length} Props</span>
              <span className={styles.chevron}>{expandedPlayerId === player.id ? '▼' : '▶'}</span>
            </div>

            {expandedPlayerId === player.id && (
              <div className={styles.playerDetails}>
                <div className={styles.cardGrid}>
                  {player.properties.length === 0 ? (
                      <div className={styles.empty}>No properties owned</div>
                  ) : (
                      player.properties.map(pid => {
                        const prop = gameState.board.find(s => s.id === pid);
                        if (!prop) return null;
                        
                        const buildCheck = canBuildHouse(player, prop, gameState.board);

                        return (
                            <PropertyCard 
                                key={pid} 
                                property={prop} 
                                onClick={() => onFocusProperty(pid)}
                                canBuild={buildCheck.canBuild}
                                onBuild={() => dispatch({ type: ACTION_TYPES.BUILD_HOUSE, propertyId: pid })}
                                buildReason={buildCheck.reason}
                            />
                        );
                      })
                  )}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};

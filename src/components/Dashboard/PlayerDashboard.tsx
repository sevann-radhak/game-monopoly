import React, { useState } from 'react';
import type { GameState } from '../../types';
import { PropertyCard } from '../Property/PropertyCard';
import { ACTION_TYPES, type GameAction } from '../../engine/GameEngine';
import { canBuildHouse, canSellHouse } from '../../engine/domain/rules/BuildingRules';
import { canMortgage, canUnmortgage } from '../../engine/domain/rules/FinancialRules';
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

  const isCurrentPlayerTurn = (pid: string) => gameState.currentPlayerId === pid;

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
              <span className={styles.name}>{player.name} {isCurrentPlayerTurn(player.id) ? '(Turn)' : ''}</span>
              <span className={styles.money}>${player.money}</span>
              <span className={styles.propCount}>{player.properties.length} Props</span>
              <span className={styles.chevron}>{expandedPlayerId === player.id ? '▼' : '▶'}</span>
            </div>

            {expandedPlayerId === player.id && (
              <div className={styles.playerDetails}>
                <div className={styles.inventory}>
                  <h4 className={styles.subHeader}>Inventory</h4>
                  <div className={styles.inventoryList}>
                    {player.getOutOfJailFreeCards > 0 && (
                      <div className={styles.inventoryItem}>
                        🎟️ Get Out of Jail Free ({player.getOutOfJailFreeCards})
                      </div>
                    )}
                    {player.getOutOfJailFreeCards === 0 && (
                      <div className={styles.empty}>No items</div>
                    )}
                  </div>
                </div>

                <div className={styles.propertiesHeader}>
                   <h4 className={styles.subHeader}>Properties</h4>
                </div>
                <div className={styles.cardGrid}>
                  {player.properties.length === 0 ? (
                      <div className={styles.empty}>No properties owned</div>
                  ) : (
                      player.properties.map(pid => {
                        const prop = gameState.board.find(s => s.id === pid);
                        if (!prop) return null;
                        
                        const buildCheck = canBuildHouse(player, prop, gameState.board);
                        const sellCheck = canSellHouse(player, prop, gameState.board);
                        const mortgageCheck = canMortgage(player, prop, gameState.board);
                        const unmortgageCheck = canUnmortgage(player, prop);

                        // Only allow actions if it's the player's turn and no blocking modal is open
                        const isBlocked = gameState.turnPhase === 'card' || gameState.turnPhase === 'auction' || gameState.turnPhase === 'trade';
                        const showActions = isCurrentPlayerTurn(player.id) && !isBlocked;

                        const owner = prop.owner ? gameState.players.find(p => p.id === prop.owner) : null;
                        
                        return (
                            <PropertyCard 
                                key={pid} 
                                property={prop} 
                                onClick={() => onFocusProperty(pid)}
                                canBuild={showActions && buildCheck.canBuild}
                                onBuild={() => dispatch({ type: ACTION_TYPES.BUILD_HOUSE, propertyId: pid })}
                                buildReason={(!buildCheck.canBuild && prop.owner === gameState.currentPlayerId) ? buildCheck.reason : undefined}
                                canSell={showActions && sellCheck.canSell}
                                onSell={() => dispatch({ type: ACTION_TYPES.SELL_BUILDING, propertyId: pid })}
                                canMortgage={showActions && mortgageCheck.canMortgage}
                                onMortgage={() => dispatch({ type: ACTION_TYPES.MORTGAGE_PROPERTY, propertyId: pid })}
                                canUnmortgage={showActions && unmortgageCheck.canUnmortgage}
                                onUnmortgage={() => dispatch({ type: ACTION_TYPES.UNMORTGAGE_PROPERTY, propertyId: pid })}
                                ownerColor={owner?.color}
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

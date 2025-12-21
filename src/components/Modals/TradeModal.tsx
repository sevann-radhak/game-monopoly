import React, { useState } from 'react';
import type { GameState, TradeOffer } from '../../types';
import { ACTION_TYPES, type GameAction } from '../../engine/GameEngine';
import styles from './TradeModal.module.css';

interface TradeModalProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const TradeModal: React.FC<TradeModalProps> = ({ gameState, dispatch }) => {
  const activeTrade = gameState.activeTrade;
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId)!;

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    gameState.players.find(p => p.id !== currentPlayer.id)?.id || ''
  );
  
  const [offeringMoney, setOfferingMoney] = useState(0);
  const [requestingMoney, setRequestingMoney] = useState(0);
  const [offeringProps, setOfferingProps] = useState<string[]>([]);
  const [requestingProps, setRequestingProps] = useState<string[]>([]);
  
  // Track trade response state
  const [tradeStatus, setTradeStatus] = useState<'waiting' | 'accepted' | 'rejected' | null>(null);
  const [lastTradeId, setLastTradeId] = useState<string | null>(null);

  // Detect when trade changes from active to inactive (response received)
  React.useEffect(() => {
    console.log('[TRADE MODAL] useEffect triggered', {
      hasActiveTrade: !!activeTrade,
      hasLastTradeId: !!lastTradeId,
      tradeStatus,
      lastAction: gameState.lastAction
    });

    // Generate a unique ID for the current trade
    const currentTradeId = activeTrade 
      ? `${activeTrade.fromPlayerId}-${activeTrade.toPlayerId}-${Date.now()}` 
      : null;

    // If we had a trade and now we don't, and we were waiting
    if (lastTradeId && !activeTrade && tradeStatus === 'waiting') {
      console.log('[TRADE MODAL] Trade disappeared, checking result...');
      console.log('[TRADE MODAL] Last Action:', gameState.lastAction);
      
      // Check last action to determine if accepted or rejected
      const lastActionLower = gameState.lastAction?.toLowerCase() || '';
      
      if (lastActionLower.includes('accept')) {
        console.log('[TRADE MODAL] Setting status to ACCEPTED');
        setTradeStatus('accepted');
        setTimeout(() => {
          console.log('[TRADE MODAL] Clearing accepted status');
          setTradeStatus(null);
          setLastTradeId(null);
        }, 3000);
      } else if (lastActionLower.includes('reject') || lastActionLower.includes('cancel')) {
        console.log('[TRADE MODAL] Setting status to REJECTED');
        setTradeStatus('rejected');
        setTimeout(() => {
          console.log('[TRADE MODAL] Clearing rejected status');
          setTradeStatus(null);
          setLastTradeId(null);
        }, 3000);
      } else {
        // Fallback: if we can't determine, assume rejected
        console.log('[TRADE MODAL] Could not determine, defaulting to REJECTED');
        setTradeStatus('rejected');
        setTimeout(() => {
          setTradeStatus(null);
          setLastTradeId(null);
        }, 3000);
      }
    } else if (activeTrade && !lastTradeId && tradeStatus === 'waiting') {
      // New trade created while waiting
      setLastTradeId(currentTradeId);
    }
  }, [activeTrade, tradeStatus, gameState.lastAction, lastTradeId]);

  if (gameState.turnPhase !== 'trade' && !activeTrade && !tradeStatus) return null;

  const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
  const targetPlayer = gameState.players.find(p => p.id === selectedPlayerId)!;

  const handleCreateTrade = () => {
    const trade: TradeOffer = {
      fromPlayerId: currentPlayer.id,
      toPlayerId: selectedPlayerId,
      offering: { money: offeringMoney, properties: offeringProps },
      requesting: { money: requestingMoney, properties: requestingProps }
    };
    dispatch({ type: ACTION_TYPES.CREATE_TRADE, trade });
    setTradeStatus('waiting'); // Start waiting for response
    setLastTradeId(`${currentPlayer.id}-${selectedPlayerId}-${Date.now()}`);
    console.log('[TRADE MODAL] Trade created, waiting for response...');
  };

  const toggleOfferingProp = (pid: string) => {
    setOfferingProps(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);
  };

  const toggleRequestingProp = (pid: string) => {
    setRequestingProps(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);
  };

  // Show success/rejection overlay
  if (tradeStatus === 'accepted' || tradeStatus === 'rejected') {
    return (
      <div className={styles.overlay}>
        <div className={`${styles.resultModal} ${tradeStatus === 'accepted' ? styles.success : styles.error}`}>
          <div className={styles.resultIcon}>
            {tradeStatus === 'accepted' ? '✅' : '❌'}
          </div>
          <h2 className={styles.resultTitle}>
            {tradeStatus === 'accepted' ? 'Trade Accepted!' : 'Trade Rejected'}
          </h2>
          <p className={styles.resultMessage}>
            {tradeStatus === 'accepted' 
              ? 'The trade has been completed successfully.' 
              : 'Your trade offer was declined.'}
          </p>
        </div>
      </div>
    );
  }

  // If a trade is active (someone offered), show the acceptance view
  if (activeTrade) {
    const fromPlayer = gameState.players.find(p => p.id === activeTrade.fromPlayerId)!;
    const toPlayer = gameState.players.find(p => p.id === activeTrade.toPlayerId)!;
    const isReceiver = gameState.currentPlayerId === toPlayer.id;
    const isSender = gameState.currentPlayerId === fromPlayer.id;

    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          {tradeStatus === 'waiting' && isSender ? (
            <>
              <div className={styles.waitingHeader}>
                <div className={styles.spinner}></div>
                <h2 className={styles.title}>⏳ Waiting for Response...</h2>
                <p className={styles.waitingText}>{toPlayer.name} is analyzing your offer</p>
              </div>
            </>
          ) : (
            <h2 className={styles.title}>📜 Trade Offer</h2>
          )}
          
          <div className={styles.tradeView}>
            <div className={styles.tradeColumn}>
              <h3 className={styles.columnTitle}>{fromPlayer.name} offers:</h3>
              
              {activeTrade.offering.money > 0 && (
                <div className={styles.moneyCard}>
                  💵 ${activeTrade.offering.money}
                </div>
              )}
              
              <div className={styles.propertyGrid}>
                {activeTrade.offering.properties.map(pid => {
                  const prop = gameState.board.find(s => s.id === pid);
                  if (!prop) return null;
                  return (
                    <div 
                      key={pid} 
                      className={styles.propertyCard}
                      style={{ borderTopColor: `var(--color-${prop.color})` }}
                    >
                      <div className={styles.propertyName}>{prop.name}</div>
                      <div className={styles.propertyPrice}>${prop.price}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.arrow}>⇄</div>

            <div className={styles.tradeColumn}>
              <h3 className={styles.columnTitle}>{toPlayer.name} gives:</h3>
              
              {activeTrade.requesting.money > 0 && (
                <div className={styles.moneyCard}>
                  💵 ${activeTrade.requesting.money}
                </div>
              )}
              
              <div className={styles.propertyGrid}>
                {activeTrade.requesting.properties.map(pid => {
                  const prop = gameState.board.find(s => s.id === pid);
                  if (!prop) return null;
                  return (
                    <div 
                      key={pid} 
                      className={styles.propertyCard}
                      style={{ borderTopColor: `var(--color-${prop.color})` }}
                    >
                      <div className={styles.propertyName}>{prop.name}</div>
                      <div className={styles.propertyPrice}>${prop.price}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            {isReceiver ? (
              <>
                <button className={styles.acceptBtn} onClick={() => dispatch({ type: ACTION_TYPES.ACCEPT_TRADE })}>
                  ✅ Accept Trade
                </button>
                <button className={styles.rejectBtn} onClick={() => dispatch({ type: ACTION_TYPES.REJECT_TRADE })}>
                  ❌ Reject
                </button>
              </>
            ) : (
              <button className={styles.cancelBtn} onClick={() => dispatch({ type: ACTION_TYPES.CANCEL_TRADE })}>
                Cancel Offer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Create trade view
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>🤝 Propose Trade</h2>
        
        <div className={styles.playerSelector}>
          <label>Trade with: </label>
          <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)}>
            {otherPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className={styles.tradeEditor}>
          <div className={styles.editorColumn}>
            <h3 className={styles.columnTitle}>You Offer</h3>
            
            <div className={styles.moneyInput}>
              <label>💰 Money:</label>
              <input 
                type="number" 
                value={offeringMoney} 
                onChange={(e) => setOfferingMoney(Math.max(0, Number(e.target.value)))}
                max={currentPlayer.money}
                min={0}
              />
            </div>

            <div className={styles.propertyGrid}>
              {currentPlayer.properties.map(pid => {
                const prop = gameState.board.find(s => s.id === pid)!;
                const isSelected = offeringProps.includes(pid);
                return (
                  <div 
                    key={pid} 
                    className={`${styles.propertyCard} ${isSelected ? styles.selected : ''}`}
                    style={{ borderTopColor: `var(--color-${prop.color})` }}
                    onClick={() => toggleOfferingProp(pid)}
                  >
                    <div className={styles.propertyName}>{prop.name}</div>
                    <div className={styles.propertyPrice}>${prop.price}</div>
                    {isSelected && <div className={styles.checkmark}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.editorColumn}>
            <h3 className={styles.columnTitle}>You Request</h3>
            
            <div className={styles.moneyInput}>
              <label>💰 Money:</label>
              <input 
                type="number" 
                value={requestingMoney} 
                onChange={(e) => setRequestingMoney(Math.max(0, Number(e.target.value)))}
                max={targetPlayer?.money || 0}
                min={0}
              />
            </div>

            <div className={styles.propertyGrid}>
              {targetPlayer?.properties.map(pid => {
                const prop = gameState.board.find(s => s.id === pid)!;
                const isSelected = requestingProps.includes(pid);
                return (
                  <div 
                    key={pid} 
                    className={`${styles.propertyCard} ${isSelected ? styles.selected : ''}`}
                    style={{ borderTopColor: `var(--color-${prop.color})` }}
                    onClick={() => toggleRequestingProp(pid)}
                  >
                    <div className={styles.propertyName}>{prop.name}</div>
                    <div className={styles.propertyPrice}>${prop.price}</div>
                    {isSelected && <div className={styles.checkmark}>✓</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={() => dispatch({ type: ACTION_TYPES.CANCEL_TRADE })}>
            Cancel
          </button>
          <button className={styles.proposeBtn} onClick={handleCreateTrade}>
            📤 Send Offer
          </button>
        </div>
      </div>
    </div>
  );
};

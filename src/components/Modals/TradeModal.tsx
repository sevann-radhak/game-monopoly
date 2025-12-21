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

  // State for creating a trade
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    gameState.players.find(p => p.id !== currentPlayer.id)?.id || ''
  );
  
  const [offeringMoney, setOfferingMoney] = useState(0);
  const [requestingMoney, setRequestingMoney] = useState(0);
  const [offeringProps, setOfferingProps] = useState<string[]>([]);
  const [requestingProps, setRequestingProps] = useState<string[]>([]);

  if (gameState.turnPhase !== 'trade' && !activeTrade) return null;

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
  };

  const toggleOfferingProp = (pid: string) => {
    setOfferingProps(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);
  };

  const toggleRequestingProp = (pid: string) => {
    setRequestingProps(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]);
  };

  // If a trade is active (someone offered), show the acceptance view
  if (activeTrade) {
    const fromPlayer = gameState.players.find(p => p.id === activeTrade.fromPlayerId)!;
    const toPlayer = gameState.players.find(p => p.id === activeTrade.toPlayerId)!;
    const isReceiver = gameState.currentPlayerId === toPlayer.id;

    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <h2>Trade Offer</h2>
          <div className={styles.tradeView}>
            <div className={styles.side}>
              <h3>{fromPlayer.name} offers:</h3>
              <div className={styles.item}>${activeTrade.offering.money}</div>
              {activeTrade.offering.properties.map(pid => (
                <div key={pid} className={styles.item}>
                    {gameState.board.find(s => s.id === pid)?.name}
                </div>
              ))}
            </div>
            <div className={styles.arrow}>⇆</div>
            <div className={styles.side}>
              <h3>{fromPlayer.name} requests from {toPlayer.name}:</h3>
              <div className={styles.item}>${activeTrade.requesting.money}</div>
              {activeTrade.requesting.properties.map(pid => (
                <div key={pid} className={styles.item}>
                    {gameState.board.find(s => s.id === pid)?.name}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            {isReceiver ? (
              <>
                <button className={styles.accept} onClick={() => dispatch({ type: ACTION_TYPES.ACCEPT_TRADE })}>Accept</button>
                <button className={styles.reject} onClick={() => dispatch({ type: ACTION_TYPES.REJECT_TRADE })}>Reject</button>
              </>
            ) : (
              <button className={styles.cancel} onClick={() => dispatch({ type: ACTION_TYPES.CANCEL_TRADE })}>Cancel Offer</button>
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
        <h2>Propose Trade</h2>
        <div className={styles.setup}>
            <label>Trade with: </label>
            <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)}>
                {otherPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>

        <div className={styles.tradeEditor}>
            <div className={styles.side}>
                <h3>You Offer</h3>
                <input 
                    type="number" 
                    value={offeringMoney} 
                    onChange={(e) => setOfferingMoney(Number(e.target.value))}
                    max={currentPlayer.money}
                />
                <div className={styles.propList}>
                    {currentPlayer.properties.map(pid => {
                         const prop = gameState.board.find(s => s.id === pid)!;
                         return (
                            <div 
                                key={pid} 
                                className={`${styles.prop} ${offeringProps.includes(pid) ? styles.selected : ''}`}
                                onClick={() => toggleOfferingProp(pid)}
                            >
                                {prop.name}
                            </div>
                         );
                    })}
                </div>
            </div>

            <div className={styles.side}>
                <h3>You Request</h3>
                <input 
                    type="number" 
                    value={requestingMoney} 
                    onChange={(e) => setRequestingMoney(Number(e.target.value))}
                    max={targetPlayer?.money || 0}
                />
                <div className={styles.propList}>
                    {targetPlayer?.properties.map(pid => {
                         const prop = gameState.board.find(s => s.id === pid)!;
                         return (
                            <div 
                                key={pid} 
                                className={`${styles.prop} ${requestingProps.includes(pid) ? styles.selected : ''}`}
                                onClick={() => toggleRequestingProp(pid)}
                            >
                                {prop.name}
                            </div>
                         );
                    })}
                </div>
            </div>
        </div>

        <div className={styles.footer}>
            <button className={styles.cancel} onClick={() => dispatch({ type: ACTION_TYPES.CANCEL_TRADE })}>Cancel</button>
            <button className={styles.propose} onClick={handleCreateTrade}>Send Offer</button>
        </div>
      </div>
    </div>
  );
};

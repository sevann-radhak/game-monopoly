import React, { useState } from 'react';
import type { GameState } from '../../types';
import { ACTION_TYPES, type GameAction } from '../../engine/GameEngine';
import styles from './AuctionModal.module.css';

interface AuctionModalProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const AuctionModal: React.FC<AuctionModalProps> = ({ gameState, dispatch }) => {
  const { auction, players } = gameState;
  if (!auction) return null;

  const property = gameState.board.find(s => s.id === auction.propertyId);
  const currentBidderId = auction.bidders[auction.currentBidderIndex];
  const currentBidder = players.find(p => p.id === currentBidderId);
  const highestBidder = players.find(p => p.id === auction.highestBidderId);
  const [bidAmount, setBidAmount] = useState(auction.highestBid + 10);
  const [timeLeft, setTimeLeft] = useState(5);

  React.useEffect(() => {
    // Reset timer when highest bid changes or turn changes
    setTimeLeft(5);
  }, [auction.highestBid, auction.currentBidderIndex]);

  React.useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (auction.highestBidderId) {
             // End auction if we have a winner
             handleAutoEnd();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, auction.highestBidderId, auction.currentBidderIndex]);

  const handleAutoEnd = () => {
      // In a real game, this might need a specific action. 
      // For now, if everyone else folded or time is up, winner takes it.
      // We can simulate multiple folds or add an END_AUCTION action.
      dispatch({ type: ACTION_TYPES.FOLD_AUCTION }); 
  };

  if (!property || !currentBidder) return null;

  const handleBid = () => {
    if (bidAmount > auction.highestBid && bidAmount <= currentBidder.money) {
      dispatch({ type: ACTION_TYPES.PLACE_BID, amount: bidAmount });
      setBidAmount(bidAmount + 10);
    }
  };

  const handleFold = () => {
    dispatch({ type: ACTION_TYPES.FOLD_AUCTION });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.timerBar} style={{ width: `${(timeLeft / 5) * 100}%` }} />
        <div className={styles.timerText}>{timeLeft === 0 ? 'SOLD!' : `Closes in: ${timeLeft}s`}</div>
        <div className={styles.header}>
          <h2>AUCTION</h2>
          <div className={styles.propertyName}>{property.name}</div>
        </div>

        <div className={styles.body}>
          <div className={styles.bidInfo}>
            <div className={styles.highestBid}>
              <span>Highest Bid:</span>
              <span className={styles.amount}>${auction.highestBid}</span>
              {highestBidder && (
                <div className={styles.bidderBy} style={{ color: highestBidder.color }}>
                  by {highestBidder.name}
                </div>
              )}
            </div>
          </div>

          <div className={styles.currentTurn}>
            <div className={styles.turnLabel}>Current Turn:</div>
            <div className={styles.bidderName} style={{ color: currentBidder.color }}>
              {currentBidder.name}
            </div>
            <div className={styles.bidderMoney}>Available: ${currentBidder.money}</div>
          </div>

          <div className={styles.controls}>
            <div className={styles.inputGroup}>
              <button 
                className={styles.adjustBtn} 
                onClick={() => setBidAmount(Math.max(auction.highestBid + 1, bidAmount - 10))}
              >
                -
              </button>
              <input 
                type="number" 
                value={bidAmount} 
                onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                min={auction.highestBid + 1}
                max={currentBidder.money}
              />
              <button 
                className={styles.adjustBtn} 
                onClick={() => setBidAmount(Math.min(currentBidder.money, bidAmount + 10))}
              >
                +
              </button>
            </div>

            <div className={styles.mainActions}>
              <button 
                className={styles.bidBtn} 
                onClick={handleBid}
                disabled={bidAmount <= auction.highestBid || bidAmount > currentBidder.money}
              >
                Place Bid (${bidAmount})
              </button>
              <button className={styles.foldBtn} onClick={handleFold}>
                Fold
              </button>
            </div>
          </div>
        </div>

        <div className={styles.biddersList}>
          {players.map(p => {
            const isOut = !auction.bidders.includes(p.id);
            return (
              <div 
                key={p.id} 
                className={`${styles.bidderItem} ${isOut ? styles.folded : ''} ${p.id === currentBidderId ? styles.active : ''}`}
                style={{ borderLeftColor: p.color }}
              >
                {p.name} {isOut && '(Folded)'}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

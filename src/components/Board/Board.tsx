import React from 'react';
import type { GameState } from '../../types';
import { BoardSpace } from './BoardSpace';
import styles from './Board.module.css';
// import { PlayerToken } from '../Player/PlayerToken';

interface BoardProps {
  gameState: GameState;
}

export const Board: React.FC<BoardProps> = ({ gameState }) => {
  // We need to map linear 0-39 index to grid placement
  // Grid 11x11.
  // Row 11 (Bottom): 10, 9, 8... 0 (Right to Left) -> Wait, 0 is Bottom Right? 
  // Standard: 
  // 0 (GO) -> Bottom Right (Row 11/11, Col 11/11)
  // 1-9 -> Bottom Row (Row 11, Col 10...2)
  // 10 (Jail/Visit) -> Bottom Left (Row 11, Col 1)
  // 11-19 -> Left Col (Row 10...2, Col 1)
  // 20 (Free Parking) -> Top Left (Row 1, Col 1)
  // 21-29 -> Top Row (Row 1, Col 2...10)
  // 30 (Go To Jail) -> Top Right (Row 1, Col 11)
  // 31-39 -> Right Col (Row 2...10, Col 11)

  const getGridStyle = (index: number) => {
    let row = 1;
    let col = 1;

    if (index === 0) { row = 11; col = 11; }
    else if (index > 0 && index < 10) { row = 11; col = 11 - index; }
    else if (index === 10) { row = 11; col = 1; }
    else if (index > 10 && index < 20) { row = 11 - (index - 10); col = 1; }
    else if (index === 20) { row = 1; col = 1; }
    else if (index > 20 && index < 30) { row = 1; col = 1 + (index - 20); }
    else if (index === 30) { row = 1; col = 11; }
    else if (index > 30 && index < 40) { row = 1 + (index - 30); col = 11; }

    return { gridRow: row, gridColumn: col };
  };

  return (
    <div className={styles.boardContainer}>
      <div className={styles.board}>
        {gameState.board.map((space) => {
           const playersHere = gameState.players.filter(p => p.position === space.position);
           
           return (
             <div key={space.id} style={getGridStyle(space.position)} className={styles.gridCellWrapper}>
                <BoardSpace 
                  space={space} 
                  players={
                    playersHere.length > 0 && (
                      <div className={styles.playersTokenContainer}>
                         {playersHere.map(p => (
                           <div key={p.id} className={styles.playerToken} style={{ backgroundColor: p.color }} title={p.name} />
                         ))}
                      </div>
                    )
                  }
                />
             </div>
           );
        })}
        
        <div className={styles.centerBoard}>
           <h1 className={styles.title}>MONOPOLY</h1>
           <div className={styles.diceArea}>
              Dice: {gameState.dice[0]} - {gameState.dice[1]}
           </div>
           
           {/* Temporary Controls moved to App usually, but for debug maybe here or in center? */}
           {/* We leave center for Logo/Dice/Chest/Chance */}
        </div>
      </div>
    </div>
  );
};

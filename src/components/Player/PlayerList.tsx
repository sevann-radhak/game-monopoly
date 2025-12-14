import React from 'react';
import classNames from 'classnames';
import type { Player } from '../../types';
import styles from './PlayerList.module.css';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
  return (
    <div className={styles.container}>
       <h3 className={styles.header}>Players</h3>
       {players.map(player => (
         <div 
           key={player.id} 
           className={classNames(styles.playerCard, { [styles.active]: player.id === currentPlayerId })}
           style={{ borderLeftColor: player.color }}
         >
            <div className={styles.info}>
               <div className={styles.name}>{player.name}</div>
               <div className={styles.money}>${player.money}</div>
            </div>
            
            <div className={styles.details}>
                <span>Pos: {player.position}</span>
                <span>Props: {player.properties.length}</span>
            </div>
         </div>
       ))}
    </div>
  );
};

import React from 'react';
import classNames from 'classnames';
import { SpaceType, type Space } from '../../types';
import styles from './BoardSpace.module.css';

interface BoardSpaceProps {
  space: Space;
  className?: string;
  players?: React.ReactNode;
}

export const BoardSpace: React.FC<BoardSpaceProps> = ({ space, className, players }) => {
  const isCorner = space.type === SpaceType.CORNER;

  return (
    <div
      className={classNames(styles.space, className, { [styles.corner]: isCorner })}
      style={{
         // Add explicit grid area or rotation if passed via className,
         // but for color bar, we use inline style or map color to var
         '--property-color': space.color ? `var(--color-${space.color.replace('_', '-')})` : 'transparent'
      } as React.CSSProperties}
    >
      {space.type === SpaceType.PROPERTY && (
        <div 
          className={styles.colorBar} 
          style={{ backgroundColor: 'var(--property-color)' }}
        />
      )}
      
      <div className={styles.name}>
        {space.name}
      </div>

      {space.price && <div className={styles.price}>${space.price}</div>}
      
      {players}
    </div>
  );
};

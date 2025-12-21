import React from 'react';
import classNames from 'classnames';
import { SpaceType, type Space } from '../../types';
import styles from './BoardSpace.module.css';

interface BoardSpaceProps {
  space: Space;
  className?: string;
  players?: React.ReactNode;
  isFocused?: boolean;
  gridRow?: number;
  gridColumn?: number;
}

export const BoardSpace: React.FC<BoardSpaceProps> = ({ space, className, players, isFocused, gridRow, gridColumn }) => {
  const isCorner = space.type === SpaceType.CORNER;
  const isProperty = space.type === SpaceType.PROPERTY;
  
  // Use a map or logic to get the owner's color if needed
  // For now we will assume the owner ID can let us look up something, 
  // but players are not passed here. 
  // Ideally, 'Space' object would have 'ownerColor' populated, or we look it up.
  // But wait, the user wants "marked... so others see it belongs".
  // The 'Space' interface has 'owner' (string).
  // We can just use a generic 'owned' border or try to pass player colors map?
  // Let's rely on a CSS class 'owned' for now, and maybe dynamic color later if we have it.
  // Actually, we can assume P1=Red, P2=Blue as per GameEngine default unless changed.
  // Let's map owner ID to color simply here for now:
  const getOwnerColor = (ownerId?: string) => {
      if (ownerId === 'p1') return 'red';
      if (ownerId === 'p2') return 'blue';
      return 'gold';
  };

  const ownerColor = space.owner ? getOwnerColor(space.owner) : null;

  return (
    <div
      className={classNames(styles.space, className, { 
          [styles.corner]: isCorner,
          [styles.property]: isProperty,
          [styles.focused]: isFocused
      })}
      style={{
         gridRow: gridRow,
         gridColumn: gridColumn,
         '--property-color': space.color ? `var(--color-${space.color.replace('_', '-')})` : 'transparent',
         '--owner-border': ownerColor ? `3px solid ${ownerColor}` : '1px solid var(--border-color)',
         '--owner-border-color': ownerColor || 'transparent',
         borderColor: ownerColor ? ownerColor : undefined,
         borderWidth: ownerColor ? '3px' : undefined,
         transform: isFocused ? 'scale(1.2) translateY(-10px) z-index(100)' : undefined,
         zIndex: isFocused ? 100 : undefined
      } as React.CSSProperties}
    >
      {/* Property Color Strip (Top) */}
      {isProperty && space.color && (
        <div className={styles.colorBar} style={{ backgroundColor: 'var(--property-color)' }}>
            {/* House/Hotel Visuals */}
            {space.houses && space.houses > 0 && (
                <div className={styles.improvements}>
                    {space.houses === 5 ? (
                        <div className={styles.hotel} title="Hotel" />
                    ) : (
                        Array.from({ length: space.houses }).map((_, i) => (
                            <div key={i} className={styles.house} />
                        ))
                    )}
                </div>
            )}

            {space.owner && (
                <div className={styles.ownerMarker} title={`Owned by ${space.owner}`}>

                   <div className={styles.ownerInitial}>
                       {space.owner === 'p1' ? 'P1' : 'P2'}
                   </div>
                </div>
            )}
        </div>
      )}

      {/* Main Content Area */}
      <div className={styles.content}>
          <div className={styles.name}>
            {isCorner ? space.name.split(' ').map((word, i) => <div key={i}>{word}</div>) : space.name}
          </div>

          {/* Icons for non-properties (Action, Utility, Station) */}
          {space.type === SpaceType.ACTION && (
            <div className={styles.icon}>
              {space.id.startsWith('chance') ? '❓' : 
               space.id.startsWith('community_chest') ? '🎁' :
               space.id === 'income_tax' ? '💰' :
               space.id === 'luxury' ? '💍' : '⚡'}
            </div>
          )}
          
          {space.color === 'station' && <div className={styles.icon}>🚂</div>}
          {space.color === 'utility' && <div className={styles.icon}>{space.id === 'electric' ? '💡' : '🚰'}</div>}
          
          {space.price && <div className={styles.price}>${space.price}</div>}
      </div>
      
      {/* Container for player tokens on this space */}
      {players}
    </div>
  );
};

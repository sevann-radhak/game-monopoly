import React from 'react';
import styles from './PropertyCard.module.css';
import type { Space } from '../../types';

interface PropertyCardProps {
  property: Space;
  onClick?: () => void;
  size?: 'small' | 'medium';
  canBuild?: boolean;
  onBuild?: () => void;
  buildReason?: string;
  isMonopoly?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick, size = 'small', canBuild, onBuild, buildReason, isMonopoly }) => {
  const colorVar = property.color 
    ? `var(--color-${property.color.replace('_', '-')})` 
    : 'gray';

  return (
    <div 
        className={`${styles.card} ${styles[size]}`} 
        onClick={onClick}
        role="button"
        tabIndex={0}
    >
      <div className={styles.header} style={{ backgroundColor: colorVar }}>
        <div className={styles.title}>TITLE DEED</div>
        <div className={styles.name}>{property.name}</div>
        {isMonopoly && <div className={styles.monopolyBadge}>MONOPOLY</div>}
      </div>
      <div className={styles.body}>
        <div className={`${styles.rent} ${(property.houses || 0) === 0 ? styles.activeRent : ''}`}>
            Rent ${property.rent?.[0] || 0}
        </div>
        {size === 'medium' && (
            <div className={styles.details}>
                <div className={`${styles.row} ${(property.houses || 0) === 1 ? styles.activeRent : ''}`}>
                    <span>1 House</span> <span>${property.rent?.[1]}</span>
                </div>
                <div className={`${styles.row} ${(property.houses || 0) === 2 ? styles.activeRent : ''}`}>
                    <span>2 Houses</span> <span>${property.rent?.[2]}</span>
                </div>
                <div className={`${styles.row} ${(property.houses || 0) === 3 ? styles.activeRent : ''}`}>
                    <span>3 Houses</span> <span>${property.rent?.[3]}</span>
                </div>
                <div className={`${styles.row} ${(property.houses || 0) === 4 ? styles.activeRent : ''}`}>
                    <span>4 Houses</span> <span>${property.rent?.[4]}</span>
                </div>
                <div className={`${styles.row} ${(property.houses || 0) === 5 ? styles.activeRent : ''}`}>
                    <span>Hotel</span> <span>${property.rent?.[5]}</span>
                </div>
            </div>
        )}
        <div className={styles.price}>Mortgage Value ${property.price ? property.price / 2 : 0}</div>
      
      {canBuild && onBuild && (
          <button 
            className={styles.buildButton}
            onClick={(e) => {
                e.stopPropagation();
                onBuild();
            }}
          >
            Build House (${property.houseCost})
          </button>
      )}
      {!canBuild && buildReason && size === 'medium' && (
          <div className={styles.reason}>Cannot build: {buildReason}</div>
      )}
      </div>
    </div>
  );
};

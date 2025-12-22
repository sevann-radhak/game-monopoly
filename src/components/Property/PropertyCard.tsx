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
  canSell?: boolean;
  onSell?: () => void;
  canMortgage?: boolean;
  onMortgage?: () => void;
  canUnmortgage?: boolean;
  onUnmortgage?: () => void;
  isMonopoly?: boolean;
  ownerColor?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
    property, 
    onClick, 
    size = 'small', 
    canBuild, 
    onBuild, 
    buildReason,
    canSell,
    onSell,
    canMortgage,
    onMortgage,
    canUnmortgage,
    onUnmortgage,
    isMonopoly,
    ownerColor
}) => {
  const colorVar = property.color 
    ? `var(--color-${property.color.replace('_', '-')})` 
    : 'gray';

  const borderColor = ownerColor || 'transparent';

  return (
    <div 
        className={`${styles.card} ${styles[size]} ${property.mortgaged ? styles.mortgagedCard : ''}`} 
        onClick={onClick}
        role="button"
        tabIndex={0}
        style={{ borderColor: borderColor, borderWidth: ownerColor ? '3px' : '1px' }}
    >
      <div className={styles.header} style={{ backgroundColor: colorVar }}>
        <div className={styles.title}>TITLE DEED</div>
        <div className={styles.name}>{property.name}</div>
        {isMonopoly && <div className={styles.monopolyBadge}>MONOPOLY</div>}
        {property.mortgaged && <div className={styles.mortgagedBadge}>MORTGAGED</div>}
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
        <div className={styles.mortgageValue}>Mortgage Value ${property.price ? property.price / 2 : 0}</div>
      
      <div className={styles.actionsGrid}>
        {canBuild && onBuild && (
            <button 
                className={styles.actionButton}
                onClick={(e) => { e.stopPropagation(); onBuild(); }}
            >
                Build House (${property.houseCost})
            </button>
        )}
        {canSell && onSell && (
            <button 
                className={`${styles.actionButton} ${styles.sellButton}`}
                onClick={(e) => { e.stopPropagation(); onSell(); }}
            >
                Sell House (${(property.houseCost || 0) / 2})
            </button>
        )}
        {canMortgage && onMortgage && (
            <button 
                className={`${styles.actionButton} ${styles.mortgageButton}`}
                onClick={(e) => { e.stopPropagation(); onMortgage(); }}
            >
                Mortgage (${(property.price || 0) / 2})
            </button>
        )}
        {canUnmortgage && onUnmortgage && (
            <button 
                className={`${styles.actionButton} ${styles.unmortgageButton}`}
                onClick={(e) => { e.stopPropagation(); onUnmortgage(); }}
            >
                Unmortgage (${Math.ceil((property.price || 0) / 2 * 1.1)})
            </button>
        )}
      </div>

      {!canBuild && buildReason && size === 'medium' && (
          <div className={styles.reason}>Status: {buildReason}</div>
      )}
      </div>
    </div>
  );
};

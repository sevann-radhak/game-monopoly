import React from 'react';
import type { Card } from '../../types';
import styles from './CardModal.module.css';

interface CardModalProps {
  card: Card;
  onConfirm: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onConfirm }) => {
  const isChance = card.type === 'chance';
  const categoryLabel = isChance ? 'Chance' : 'Community Chest';
  const decorationClass = isChance ? styles.chanceDecoration : styles.communityChestDecoration;
  const textClass = isChance ? styles.chanceText : styles.communityChestText;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={`${styles.cardDecoration} ${decorationClass}`} />
        <span className={`${styles.category} ${textClass}`}>
          {categoryLabel}
        </span>
        <h2 className={styles.cardTitle}>
          {isChance ? '?' : '✉️'}
        </h2>
        <p className={styles.description}>{card.text}</p>
        <button className={styles.actionButton} onClick={onConfirm}>
          Ok
        </button>
      </div>
    </div>
  );
};

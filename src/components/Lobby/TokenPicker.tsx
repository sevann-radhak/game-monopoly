import React, { useState } from 'react';
import type { TokenId } from '../../types';
import { ALL_TOKENS, getAvailableTokens } from '../../types/tokens';
import styles from './TokenPicker.module.css';

interface TokenPickerProps {
  selectedToken: TokenId | undefined;
  usedTokens: TokenId[];
  onTokenSelect: (token: TokenId) => void;
  disabled?: boolean;
}

export const TokenPicker: React.FC<TokenPickerProps> = ({
  selectedToken,
  usedTokens,
  onTokenSelect,
  disabled = false,
}) => {
  const [hoveredToken, setHoveredToken] = useState<TokenId | null>(null);

  const availableTokens = getAvailableTokens(usedTokens);
  const allTokensWithAvailability = ALL_TOKENS.map(token => ({
    ...token,
    isAvailable: !usedTokens.includes(token.id) || token.id === selectedToken,
  }));

  const getTokenEmoji = (tokenId: TokenId): string => {
    const emojiMap: Record<TokenId, string> = {
      racecar: '🏎️',
      top_hat: '🎩',
      thimble: '🧵',
      boot: '👢',
      wheelbarrow: '🛒',
      battleship: '🚢',
      dog: '🐕',
      cat: '🐱',
    };
    return emojiMap[tokenId] || '🎯';
  };

  return (
    <div className={styles.container}>
      <div className={styles.tokenGrid}>
        {allTokensWithAvailability.map(token => {
          const isSelected = token.id === selectedToken;
          const isUsed = usedTokens.includes(token.id) && !isSelected;
          const isHovered = hoveredToken === token.id;

          return (
            <button
              key={token.id}
              type="button"
              className={`${styles.tokenOption} ${isSelected ? styles.selected : ''} ${isUsed ? styles.used : ''}`}
              onClick={() => !disabled && !isUsed && onTokenSelect(token.id)}
              onMouseEnter={() => setHoveredToken(token.id)}
              onMouseLeave={() => setHoveredToken(null)}
              disabled={disabled || isUsed}
              title={isUsed ? `${token.name} already in use` : token.name}
              aria-label={`Select token ${token.name}`}
            >
              <div 
                className={styles.tokenIcon}
                style={{ 
                  backgroundColor: token.color,
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {getTokenEmoji(token.id)}
              </div>
              <span className={styles.tokenName}>{token.name}</span>
              {isSelected && <span className={styles.checkmark}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};


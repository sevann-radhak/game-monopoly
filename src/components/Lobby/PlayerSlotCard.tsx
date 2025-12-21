import React, { useState } from 'react';
import type { PlayerSlot, TokenId } from '../../types';
import { ColorPicker } from './ColorPicker';
import { TokenPicker } from './TokenPicker';
import styles from './PlayerSlotCard.module.css';

interface PlayerSlotCardProps {
  slot: PlayerSlot;
  usedColors: string[];
  usedTokens: TokenId[];
  onUpdate: (updates: Partial<PlayerSlot>) => void;
  onRemove: () => void;
  onToggleReady: () => void;
  canRemove: boolean;
  disabled?: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
}

export const PlayerSlotCard: React.FC<PlayerSlotCardProps> = ({
  slot,
  usedColors,
  usedTokens,
  onUpdate,
  onRemove,
  onToggleReady,
  canRemove,
  disabled = false,
  validationErrors = [],
  validationWarnings = [],
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(slot.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  const handleNameSubmit = () => {
    if (editedName.trim()) {
      onUpdate({ name: editedName.trim() });
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditedName(slot.name);
      setIsEditingName(false);
    }
  };

  const handleColorSelect = (color: string) => {
    onUpdate({ color });
    setShowColorPicker(false);
  };

  const handleTokenSelect = (token: TokenId) => {
    onUpdate({ token });
    setShowTokenPicker(false);
  };

  const getTokenEmoji = (tokenId: TokenId | undefined): string => {
    if (!tokenId) return '🎯';
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

  const hasErrors = validationErrors.length > 0;
  const hasWarnings = validationWarnings.length > 0;

  return (
    <div
      className={`${styles.card} ${slot.isReady ? styles.ready : ''} ${disabled ? styles.disabled : ''} ${hasErrors ? styles.hasErrors : ''} ${hasWarnings ? styles.hasWarnings : ''}`}
    >
      <div className={styles.header}>
        <div className={styles.typeBadge} data-type={slot.type}>
          {slot.type === 'human' ? '👤' : '🤖'}
          <span>{slot.type === 'human' ? 'Human' : 'Bot'}</span>
        </div>
        {canRemove && !disabled && (
          <button
            type="button"
            className={styles.removeBtn}
            onClick={onRemove}
            aria-label="Remove player"
            title="Remove player"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.nameSection}>
          {isEditingName && !disabled ? (
            <input
              type="text"
              className={styles.nameInput}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleNameKeyDown}
              autoFocus
              maxLength={20}
            />
          ) : (
            <div
              className={styles.nameDisplay}
              onClick={() => !disabled && slot.type === 'human' && setIsEditingName(true)}
              title={slot.type === 'human' ? 'Click to edit name' : 'Bot name'}
            >
              {slot.name || 'Unnamed Player'}
            </div>
          )}
        </div>

        <div className={styles.visualSection}>
          <div className={styles.tokenPreview}>
            <div
              className={styles.tokenIcon}
              style={{ backgroundColor: slot.color || '#9ca3af' }}
              onClick={() => !disabled && setShowTokenPicker(!showTokenPicker)}
              title="Click to change token"
            >
              {getTokenEmoji(slot.token)}
            </div>
            {showTokenPicker && !disabled && (
              <div className={styles.pickerOverlay}>
                <TokenPicker
                  selectedToken={slot.token}
                  usedTokens={usedTokens.filter(t => t !== slot.token)}
                  onTokenSelect={handleTokenSelect}
                />
                <button
                  type="button"
                  className={styles.closePicker}
                  onClick={() => setShowTokenPicker(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>

          <div className={styles.colorSection}>
            <div
              className={styles.colorPreview}
              style={{ backgroundColor: slot.color || '#9ca3af' }}
              onClick={() => !disabled && setShowColorPicker(!showColorPicker)}
              title="Click to change color"
            />
            {showColorPicker && !disabled && (
              <div className={styles.pickerOverlay}>
                <ColorPicker
                  selectedColor={slot.color || '#9ca3af'}
                  usedColors={usedColors.filter(c => c !== slot.color)}
                  onColorSelect={handleColorSelect}
                />
                <button
                  type="button"
                  className={styles.closePicker}
                  onClick={() => setShowColorPicker(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        {(hasErrors || hasWarnings) && (
          <div className={styles.validationMessages}>
            {validationErrors.map((error, index) => (
              <div key={index} className={styles.errorMessage}>
                ⚠ {error}
              </div>
            ))}
            {validationWarnings.map((warning, index) => (
              <div key={index} className={styles.warningMessage}>
                ℹ {warning}
              </div>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          {slot.type === 'human' && (
            <button
              type="button"
              className={`${styles.readyBtn} ${slot.isReady ? styles.ready : ''}`}
              onClick={onToggleReady}
              disabled={disabled || !slot.name.trim() || !slot.token || !slot.color}
            >
              {slot.isReady ? '✓ Ready' : 'Not Ready'}
            </button>
          )}
          {slot.type === 'bot' && (
            <div className={styles.botReady}>
              <span className={styles.botReadyIcon}>✓</span>
              <span>Auto Ready</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


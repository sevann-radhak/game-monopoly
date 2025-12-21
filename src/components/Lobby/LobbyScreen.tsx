import React, { useState, useMemo } from 'react';
import type { LobbyState, PlayerSlot, TokenId } from '../../types';
import { createLobby, addPlayerSlot, removePlayerSlot, updatePlayerSlot, setPlayerReady, canStartGame, validateLobby, createLobbyState, updateLobbyState } from '../../services/lobby/LobbyManager';
import { createHumanSlot, createBotSlot } from '../../services/lobby/PlayerSlotFactory';
import { getAvailableTokensForLobby } from '../../services/lobby/TokenManager';
import { validateSlot } from '../../services/lobby/SlotValidator';
import { PlayerSlotCard } from './PlayerSlotCard';
import { TurnOrderDetermination } from './TurnOrderDetermination';
import styles from './LobbyScreen.module.css';

interface LobbyScreenProps {
  onGameStart: (lobby: LobbyState, turnOrder: string[]) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onGameStart,
  theme,
  toggleTheme,
}) => {
  const [lobby, setLobby] = useState<LobbyState>(() => {
    const config = createLobby('local', 8);
    return createLobbyState(config, 'waiting');
  });
  const [showTurnOrder, setShowTurnOrder] = useState(false);
  const [turnOrderRolls, setTurnOrderRolls] = useState<Map<string, number>>(new Map());

  const usedColors = useMemo(() => {
    return lobby.config.playerSlots
      .map(slot => slot.color)
      .filter((color): color is string => color !== undefined);
  }, [lobby.config.playerSlots]);

  const usedTokens = useMemo(() => {
    return lobby.config.playerSlots
      .map(slot => slot.token)
      .filter((token): token is TokenId => token !== undefined);
  }, [lobby.config.playerSlots]);

  const validation = useMemo(() => validateLobby(lobby.config), [lobby.config]);
  const canStartResult = useMemo(() => canStartGame(lobby.config), [lobby.config]);

  const handleAddHuman = () => {
    const availableTokens = getAvailableTokensForLobby(lobby.config);
    if (availableTokens.length === 0) {
      alert('No available tokens. Maximum players reached.');
      return;
    }

    const defaultColor = '#dc2626';
    const defaultToken = availableTokens[0];
    
    try {
      const updatedConfig = addPlayerSlot(
        lobby.config,
        'human',
        'Player',
        defaultColor,
        defaultToken
      );
      setLobby(updateLobbyState(lobby, { config: updatedConfig }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add player');
    }
  };

  const handleAddBot = () => {
    const availableTokens = getAvailableTokensForLobby(lobby.config);
    if (availableTokens.length === 0) {
      alert('No available tokens. Maximum players reached.');
      return;
    }

    try {
      const updatedConfig = addPlayerSlot(lobby.config, 'bot');
      setLobby(updateLobbyState(lobby, { config: updatedConfig }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add bot');
    }
  };

  const handleRemoveSlot = (slotId: string) => {
    try {
      const updatedConfig = removePlayerSlot(lobby.config, slotId);
      setLobby(updateLobbyState(lobby, { config: updatedConfig }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove player');
    }
  };

  const handleUpdateSlot = (slotId: string, updates: Partial<PlayerSlot>) => {
    try {
      const updatedConfig = updatePlayerSlot(lobby.config, slotId, updates);
      setLobby(updateLobbyState(lobby, { config: updatedConfig }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update player');
    }
  };

  const handleToggleReady = (slotId: string) => {
    const slot = lobby.config.playerSlots.find(s => s.id === slotId);
    if (!slot) return;

    try {
      const updatedConfig = setPlayerReady(lobby.config, slotId, !slot.isReady);
      setLobby(updateLobbyState(lobby, { config: updatedConfig }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to toggle ready status');
    }
  };

  const handleStartGame = () => {
    if (!canStartResult.canStart) {
      alert('Cannot start game. Please check that all players are configured correctly.');
      return;
    }

    setShowTurnOrder(true);
  };

  const handleTurnOrderComplete = (turnOrder: string[]) => {
    setShowTurnOrder(false);
    onGameStart(lobby, turnOrder);
  };

  const availableTokenCount = getAvailableTokensForLobby(lobby.config).length;
  const canAddPlayer = lobby.config.playerSlots.length < lobby.config.maxPlayers && availableTokenCount > 0;

  if (showTurnOrder) {
    return (
      <TurnOrderDetermination
        lobby={lobby}
        onComplete={handleTurnOrderComplete}
      />
    );
  }

  return (
    <div className={styles.container} data-theme={theme}>
      <div className={styles.header}>
        <h1 className={styles.title}>Monopoly Lobby</h1>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className={styles.playerCount}>
            {lobby.config.playerSlots.length} / {lobby.config.maxPlayers} Players
          </div>
        </div>
      </div>

      {validation.errors.length > 0 && (
        <div className={styles.errorBox}>
          <h3 className={styles.errorTitle}>Configuration Issues:</h3>
          <ul className={styles.errorList}>
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddHuman}
          disabled={!canAddPlayer}
          title={!canAddPlayer ? 'Maximum players reached' : 'Add human player'}
        >
          + Add Human Player
        </button>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddBot}
          disabled={!canAddPlayer}
          title={!canAddPlayer ? 'Maximum players reached' : 'Add bot player'}
        >
          + Add Bot
        </button>
      </div>

      <div className={styles.slotsContainer}>
        {lobby.config.playerSlots.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No players added yet.</p>
            <p className={styles.emptyStateHint}>
              Add at least {lobby.config.minPlayers} players to start the game.
            </p>
          </div>
        ) : (
          <div className={styles.slotsGrid}>
            {lobby.config.playerSlots.map(slot => {
              const slotUsedColors = usedColors.filter(c => c !== slot.color);
              const slotUsedTokens = usedTokens.filter(t => t !== slot.token);
              const validation = validateSlot(slot, lobby.config);

              return (
                <PlayerSlotCard
                  key={slot.id}
                  slot={slot}
                  usedColors={slotUsedColors}
                  usedTokens={slotUsedTokens}
                  onUpdate={(updates) => handleUpdateSlot(slot.id, updates)}
                  onRemove={() => handleRemoveSlot(slot.id)}
                  onToggleReady={() => handleToggleReady(slot.id)}
                  canRemove={lobby.config.playerSlots.length > lobby.config.minPlayers}
                  validationErrors={validation.errors}
                  validationWarnings={validation.warnings}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Min Players:</span>
            <span className={styles.infoValue}>{lobby.config.minPlayers}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Starting Money:</span>
            <span className={styles.infoValue}>${lobby.config.settings.startingMoney}</span>
          </div>
        </div>
        <button
          type="button"
          className={`${styles.startButton} ${canStartResult.canStart ? styles.enabled : ''}`}
          onClick={handleStartGame}
          disabled={!canStartResult.canStart}
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

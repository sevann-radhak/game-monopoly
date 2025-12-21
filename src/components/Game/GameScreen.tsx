import React, { useReducer, useState, useEffect } from 'react';
import { Board } from '../Board/Board';
import { GameControls } from '../Controls/GameControls';
import { PlayerDashboard } from '../Dashboard/PlayerDashboard';
import { gameReducer, ACTION_TYPES } from '../../engine/GameEngine';
import { CardModal } from '../Modals/CardModal';
import { AuctionModal } from '../Auction/AuctionModal';
import { TradeModal } from '../Modals/TradeModal';
import { VictoryModal } from '../Modals/VictoryModal';
import { useGameLoop } from '../../hooks/useGameLoop';
import type { GameState, LobbyConfig } from '../../types';
import { initializeGameFromLobby } from '../../services/game/GameInitializer';

interface GameScreenProps {
  lobbyConfig: LobbyConfig;
  turnOrder: string[];
  onGameEnd: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  lobbyConfig,
  turnOrder,
  onGameEnd,
  theme,
  toggleTheme,
}) => {
  const { gameState: initialState } = initializeGameFromLobby(
    lobbyConfig,
    turnOrder
  );

  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState<[number, number]>([1, 1]);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(
    null
  );

  useGameLoop(gameState, dispatch, setIsRolling);

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setDisplayDice(gameState.dice);
    }
  }, [isRolling, gameState.dice]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (gameState.gameStatus === 'ended') {
      onGameEnd();
    }
  }, [gameState.gameStatus, onGameEnd]);

  return (
    <div className="app-container" data-theme={theme}>
      <Board
        gameState={gameState}
        isRolling={isRolling}
        displayDice={displayDice}
        focusedPropertyId={focusedPropertyId}
      />
      <GameControls
        gameState={gameState}
        dispatch={dispatch}
        toggleTheme={toggleTheme}
        currentTheme={theme}
        isRolling={isRolling}
        setIsRolling={setIsRolling}
      />
      <PlayerDashboard
        gameState={gameState}
        dispatch={dispatch}
        onFocusProperty={(id) => setFocusedPropertyId(id)}
      />

      {gameState.turnPhase === 'card' && gameState.activeCard && (
        <CardModal
          card={gameState.activeCard}
          onConfirm={() => dispatch({ type: ACTION_TYPES.APPLY_CARD })}
        />
      )}

      {gameState.turnPhase === 'auction' && (
        <AuctionModal gameState={gameState} dispatch={dispatch} />
      )}

      {(gameState.turnPhase === 'trade' || gameState.activeTrade) && (
        <TradeModal gameState={gameState} dispatch={dispatch} />
      )}

      {gameState.gameStatus === 'ended' && (
        <VictoryModal gameState={gameState} onReturnToLobby={onGameEnd} />
      )}
    </div>
  );
};


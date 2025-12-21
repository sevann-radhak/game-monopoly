import { useState, useCallback, useEffect } from 'react';
import { useLobby } from './hooks/useLobby';
import { LobbyScreen } from './components/Lobby/LobbyScreen';
import { GameScreen } from './components/Game/GameScreen';
import type { LobbyState } from './types';
import './index.css';

type AppState = 'lobby' | 'game';

function App() {
  const { returnToLobby } = useLobby();
  const [appState, setAppState] = useState<AppState>('lobby');
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('monopoly_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-view', appState);
    localStorage.setItem('monopoly_theme', theme);
  }, [theme, appState]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleGameStart = useCallback(
    (lobby: LobbyState, order: string[]) => {
      setLobbyState(lobby);
      setTurnOrder(order);
      setAppState('game');
    },
    []
  );

  const handleGameEnd = useCallback(() => {
    returnToLobby();
    setAppState('lobby');
    setLobbyState(null);
    setTurnOrder([]);
  }, [returnToLobby]);

  if (appState === 'lobby') {
    return (
      <LobbyScreen
        onGameStart={handleGameStart}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (appState === 'game' && lobbyState && turnOrder.length > 0) {
    return (
      <GameScreen
        lobbyConfig={lobbyState.config}
        turnOrder={turnOrder}
        onGameEnd={handleGameEnd}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return <div>Loading...</div>;
}

export default App;

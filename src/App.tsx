import { useReducer, useState, useEffect } from 'react';
import { Board } from './components/Board/Board';
import { GameControls } from './components/Controls/GameControls';
import { PlayerDashboard } from './components/Dashboard/PlayerDashboard';
import { createInitialState, gameReducer } from './engine/GameEngine';
import './index.css';

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialState(['Player 1', 'Player 2']));
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRolling, setIsRolling] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-container" data-theme={theme}>
      <Board 
        gameState={gameState} 
        isRolling={isRolling}
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
    </div>
  );
}

export default App;

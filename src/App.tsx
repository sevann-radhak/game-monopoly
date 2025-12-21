import { useReducer, useState, useEffect } from 'react';
import { Board } from './components/Board/Board';
import { GameControls } from './components/Controls/GameControls';
import { PlayerDashboard } from './components/Dashboard/PlayerDashboard';
import { createInitialState, gameReducer, ACTION_TYPES } from './engine/GameEngine';
import { CardModal } from './components/Modals/CardModal';
import { AuctionModal } from './components/Auction/AuctionModal';
import { TradeModal } from './components/Modals/TradeModal';
import { VictoryModal } from './components/Modals/VictoryModal';
import './index.css';


import { useGameLoop } from './hooks/useGameLoop';

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialState([
      { name: 'Human Player', type: 'human' },
      { name: 'Bot AI', type: 'bot' }
  ]));
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState<[number, number]>([1, 1]);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);

  // Attach the Game Loop
  useGameLoop(gameState, dispatch, setIsRolling);

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
        <AuctionModal 
          gameState={gameState} 
          dispatch={dispatch} 
        />
      )}

      {(gameState.turnPhase === 'trade' || gameState.activeTrade) && (
        <TradeModal 
          gameState={gameState} 
          dispatch={dispatch} 
        />
      )}

      {gameState.gameStatus === 'ended' && (
        <VictoryModal gameState={gameState} />
      )}
    </div>

  );
}

export default App;

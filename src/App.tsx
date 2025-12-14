import { useReducer } from 'react';
import { Board } from './components/Board/Board';
import { GameControls } from './components/Controls/GameControls';
import { createInitialState, gameReducer } from './engine/GameEngine';
import './index.css';

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialState(['Player 1', 'Player 2']));

  return (
    <>
      <Board gameState={gameState} />
      <GameControls gameState={gameState} dispatch={dispatch} />
    </>
  );
}

export default App;

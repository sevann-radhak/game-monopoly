import { BOARD_CONFIG } from './constants';
import { calculateNewPosition, isDouble, rollDice } from './domain/rules/MovementRules';
import type { GameState, Player } from '../types';

export const ACTION_TYPES = {
  ROLL_DICE: 'ROLL_DICE',
  BUY_PROPERTY: 'BUY_PROPERTY',
  END_TURN: 'END_TURN',
} as const;

export type GameAction =
  | { type: typeof ACTION_TYPES.ROLL_DICE }
  | { type: typeof ACTION_TYPES.BUY_PROPERTY }
  | { type: typeof ACTION_TYPES.END_TURN };

export const createInitialState = (playerNames: string[]): GameState => {
  const players: Player[] = playerNames.map((name, index) => ({
    id: `p${index + 1}`,
    name,
    color: ['red', 'blue', 'green', 'yellow'][index] || 'gray',
    money: 1500,
    position: 0,
    isInJail: false,
    jailTurns: 0,
    properties: [],
    getOutOfJailFreeCards: 0,
  }));

  return {
    players,
    currentPlayerId: players[0].id,
    board: BOARD_CONFIG, // In a real app, strict immutability might clone this
    dice: [0, 0],
    doublesCount: 0,
    gameStatus: 'playing',
    turnPhase: 'roll',
    lastAction: 'Game started',
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case ACTION_TYPES.ROLL_DICE: {
      if (state.turnPhase !== 'roll') return state;

      const dice = rollDice();
      const double = isDouble(dice);
      const moveAmount = dice[0] + dice[1];
      const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
      const currentPlayer = state.players[currentPlayerIndex];

      // Handle Jail (simplified for now)
      if (currentPlayer.isInJail) {
        // checks...
        return state; 
      }

      const { position, passedGo } = calculateNewPosition(currentPlayer.position, moveAmount);
      
      const newPlayers = [...state.players];
      newPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        position,
        money: passedGo ? currentPlayer.money + 200 : currentPlayer.money,
      };

      const newDoublesCount = double ? state.doublesCount + 1 : 0;
      
      // Speeding Rule (3 doubles -> Jail)
      if (newDoublesCount === 3) {
        newPlayers[currentPlayerIndex].isInJail = true;
        newPlayers[currentPlayerIndex].position = 10; // Jail
        return {
          ...state,
          players: newPlayers,
          dice,
          doublesCount: 0,
          turnPhase: 'end',
          lastAction: `${currentPlayer.name} rolled 3 doubles and went to Jail!`,
        };
      }

      return {
        ...state,
        players: newPlayers,
        dice,
        doublesCount: newDoublesCount,
        turnPhase: double ? 'roll' : 'action', // Double = roll again (simplified, strictly should be action then roll)
         // Actually in Monopoly: Move -> Action (Buy/Pay) -> If Double, Roll Again.
         // For now, let's say 'action' phase allows ending turn OR rolling again if double.
        lastAction: `${currentPlayer.name} rolled ${moveAmount} (Dice: ${dice[0]}, ${dice[1]})`,
      };
    }

    case ACTION_TYPES.BUY_PROPERTY: {
        if (state.turnPhase !== 'action') return state;

        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];
        const currentSpace = state.board.find(s => s.position === currentPlayer.position);

        if (!currentSpace || currentSpace.type !== 'property' || currentSpace.owner) {
            return state; // Cannot buy
        }

        if (currentPlayer.money < (currentSpace.price || 0)) {
             return {
                 ...state,
                 lastAction: `Not enough money to buy ${currentSpace.name}`
             };
        }

        // Execute Buy
        const newPlayers = [...state.players];
        newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            money: currentPlayer.money - (currentSpace.price || 0),
            properties: [...currentPlayer.properties, currentSpace.id]
        };

        const newBoard = state.board.map(s => {
            if (s.id === currentSpace.id) {
                return { ...s, owner: currentPlayer.id };
            }
            return s;
        });

        return {
            ...state,
            players: newPlayers,
            board: newBoard,
            lastAction: `${currentPlayer.name} bought ${currentSpace.name} for $${currentSpace.price}`
        };
    }

    case ACTION_TYPES.END_TURN: {
       if (state.turnPhase === 'roll') return state; // Can't skip roll

       const currentIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        // Switch to next player
       const nextIndex = (currentIndex + 1) % state.players.length;

       return {
         ...state,
         currentPlayerId: state.players[nextIndex].id,
         doublesCount: 0,
         turnPhase: 'roll',
         lastAction: `Turn ended. ${state.players[nextIndex].name}'s turn.`,
       };
    }

    default:
      return state;
  }
};

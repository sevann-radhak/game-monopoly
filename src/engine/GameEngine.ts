import { BOARD_CONFIG } from './constants';
import { calculateNewPosition, isDouble, rollDice } from './domain/rules/MovementRules';
import { calculateRent } from './domain/rules/RentRules';
import { canBuildHouse } from './domain/rules/BuildingRules';
import type { GameState, Player } from '../types';

export const ACTION_TYPES = {
  ROLL_DICE: 'ROLL_DICE',
  BUY_PROPERTY: 'BUY_PROPERTY',
  BUILD_HOUSE: 'BUILD_HOUSE',
  END_TURN: 'END_TURN',
} as const;

export type GameAction =
  | { type: typeof ACTION_TYPES.ROLL_DICE }
  | { type: typeof ACTION_TYPES.BUY_PROPERTY }
  | { type: typeof ACTION_TYPES.BUILD_HOUSE, propertyId: string }
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
      const isDoublesReRoll = state.turnPhase === 'action' && isDouble(state.dice);
      if (state.turnPhase !== 'roll' && !isDoublesReRoll) return state;

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
      
      let newPlayers = [...state.players];
      let playerMoney = passedGo ? currentPlayer.money + 200 : currentPlayer.money;
      let lastActionMsg = `${currentPlayer.name} rolled ${moveAmount} (Dice: ${dice[0]}, ${dice[1]})`;

      // Check for rent
      const landedSpace = state.board.find(s => s.position === position);
      if (landedSpace && landedSpace.owner && landedSpace.owner !== currentPlayer.id && !landedSpace.mortgaged) {
          const rentAmount = calculateRent(landedSpace, state.board, moveAmount);
          
          if (rentAmount > 0) {
              playerMoney -= rentAmount;
              
              // Pay the owner
              const ownerIndex = newPlayers.findIndex(p => p.id === landedSpace.owner);
              if (ownerIndex !== -1) {
                  newPlayers[ownerIndex] = {
                      ...newPlayers[ownerIndex],
                      money: newPlayers[ownerIndex].money + rentAmount
                  };
              }
              lastActionMsg += `. Paid $${rentAmount} rent to ${newPlayers[ownerIndex].name}`;
          }
      }

      newPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        position,
        money: playerMoney,
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
        turnPhase: 'action', // Always action so they can buy/build
        lastAction: lastActionMsg,
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

    case ACTION_TYPES.BUILD_HOUSE: {
        // Find property
        const property = state.board.find(s => s.id === (action as any).propertyId);
        if (!property) return state;

        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];

        const { canBuild, reason } = canBuildHouse(currentPlayer, property, state.board);

        if (!canBuild) {
            return {
                ...state,
                lastAction: `Cannot build on ${property.name}: ${reason}`
            };
        }

        // Execute Build
        const houseCost = property.houseCost || 0;
        
        const newPlayers = [...state.players];
        newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            money: currentPlayer.money - houseCost
        };

        const newBoard = state.board.map(s => {
            if (s.id === property.id) {
                 return { ...s, houses: (s.houses || 0) + 1 };
            }
            return s;
        });

        const newLevel = (property.houses || 0) + 1;
        const upgradeName = newLevel === 5 ? 'Hotel' : 'House';

        return {
            ...state,
            players: newPlayers,
            board: newBoard,
            lastAction: `${currentPlayer.name} built a ${upgradeName} on ${property.name} for $${houseCost}`
        };
    }

    case ACTION_TYPES.END_TURN: {
       if (state.turnPhase === 'roll') return state; // Can't skip roll
       if (isDouble(state.dice) && state.turnPhase !== 'end') return state; // Must roll again if doubles (unless jail/end)

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

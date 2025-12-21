import { BOARD_CONFIG } from './constants';
import { calculateNewPosition, isDouble, rollDice } from './domain/rules/MovementRules';
import { calculateRent } from './domain/rules/RentRules';
import { canBuildHouse, canSellHouse } from './domain/rules/BuildingRules';
import { canMortgage, canUnmortgage, getLiquidationValue } from './domain/rules/FinancialRules';
import { isTaxSpace, calculateTax } from './domain/rules/TaxRules';
import { isValidTrade } from './domain/rules/TradeRules';

import type { GameState, Player, CardEffect, TradeOffer } from '../types';

export const ACTION_TYPES = {
  ROLL_DICE: 'ROLL_DICE',
  BUY_PROPERTY: 'BUY_PROPERTY',
  DECLINE_PURCHASE: 'DECLINE_PURCHASE',
  PLACE_BID: 'PLACE_BID',
  FOLD_AUCTION: 'FOLD_AUCTION',
  BUILD_HOUSE: 'BUILD_HOUSE',
  SELL_BUILDING: 'SELL_BUILDING',
  MORTGAGE_PROPERTY: 'MORTGAGE_PROPERTY',
  UNMORTGAGE_PROPERTY: 'UNMORTGAGE_PROPERTY',
  END_TURN: 'END_TURN',
  PAY_JAIL_FINE: 'PAY_JAIL_FINE',
  USE_JAIL_CARD: 'USE_JAIL_CARD',
  APPLY_CARD: 'APPLY_CARD',
  DECLARE_BANKRUPTCY: 'DECLARE_BANKRUPTCY',
  SETUP_TRADE: 'SETUP_TRADE',
  CREATE_TRADE: 'CREATE_TRADE',
  ACCEPT_TRADE: 'ACCEPT_TRADE',
  REJECT_TRADE: 'REJECT_TRADE',
  CANCEL_TRADE: 'CANCEL_TRADE',
} as const;

export type GameAction =
  | { type: typeof ACTION_TYPES.ROLL_DICE }
  | { type: typeof ACTION_TYPES.BUY_PROPERTY }
  | { type: typeof ACTION_TYPES.DECLINE_PURCHASE }
  | { type: typeof ACTION_TYPES.PLACE_BID, amount: number }
  | { type: typeof ACTION_TYPES.FOLD_AUCTION }
  | { type: typeof ACTION_TYPES.BUILD_HOUSE, propertyId: string }
  | { type: typeof ACTION_TYPES.SELL_BUILDING, propertyId: string }
  | { type: typeof ACTION_TYPES.MORTGAGE_PROPERTY, propertyId: string }
  | { type: typeof ACTION_TYPES.UNMORTGAGE_PROPERTY, propertyId: string }
  | { type: typeof ACTION_TYPES.END_TURN }
  | { type: typeof ACTION_TYPES.PAY_JAIL_FINE }
  | { type: typeof ACTION_TYPES.USE_JAIL_CARD }
  | { type: typeof ACTION_TYPES.APPLY_CARD }
  | { type: typeof ACTION_TYPES.DECLARE_BANKRUPTCY }
  | { type: typeof ACTION_TYPES.SETUP_TRADE }
  | { type: typeof ACTION_TYPES.CREATE_TRADE, trade: TradeOffer }
  | { type: typeof ACTION_TYPES.ACCEPT_TRADE }
  | { type: typeof ACTION_TYPES.REJECT_TRADE }
  | { type: typeof ACTION_TYPES.CANCEL_TRADE };

import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffleDeck } from './cards';

export const createInitialState = (playerConfigs: { name: string, type: 'human' | 'bot' }[]): GameState => {
  const players: Player[] = playerConfigs.map((config, index) => ({
    id: `p${index + 1}`,
    name: config.name,
    type: config.type,
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
    chanceDeck: shuffleDeck(CHANCE_CARDS),
    communityChestDeck: shuffleDeck(COMMUNITY_CHEST_CARDS),
  };
};


export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case ACTION_TYPES.ROLL_DICE: {
      const isDoublesReRoll = (state.turnPhase === 'action' || state.turnPhase === 'end') && 
                              isDouble(state.dice) && 
                              state.doublesCount > 0 && 
                              state.doublesCount < 3;
      if (state.turnPhase !== 'roll' && !isDoublesReRoll) return state;

      const dice = rollDice();
      const double = isDouble(dice);
      const moveAmount = dice[0] + dice[1];
      const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
      const currentPlayer = state.players[currentPlayerIndex];

      let newPlayers = [...state.players];
      let playerMoney = currentPlayer.money;
      let lastActionMsg = `${currentPlayer.name} rolled ${moveAmount} (Dice: ${dice[0]}, ${dice[1]})`;
      let newPosition = currentPlayer.position;
      let newIsInJail = currentPlayer.isInJail;
      let newJailTurns = currentPlayer.jailTurns;
      let phase: 'roll' | 'action' | 'end' = 'action';

      // Handle Jail Exit Attempt via Doubles
      if (currentPlayer.isInJail) {
        if (double) {
          newIsInJail = false;
          newJailTurns = 0;
          lastActionMsg = `${currentPlayer.name} rolled doubles and is out of Jail!`;
          // Move the amount of the dice
          const { position, passedGo } = calculateNewPosition(currentPlayer.position, moveAmount);
          newPosition = position;
          if (passedGo) playerMoney += 200;
          // IMPORTANT: Official rules say if you get out via doubles, you move but do NOT roll again.
          phase = 'action'; 
        } else {
          newJailTurns += 1;
          lastActionMsg = `${currentPlayer.name} rolled ${moveAmount} but stayed in Jail.`;
          
          if (newJailTurns >= 3) {
            // Must pay $50 and move
            playerMoney -= 50;
            newIsInJail = false;
            newJailTurns = 0;
            const { position, passedGo } = calculateNewPosition(currentPlayer.position, moveAmount);
            newPosition = position;
            if (passedGo) playerMoney += 200;
            lastActionMsg = `${currentPlayer.name} failed to roll doubles for 3 turns. Paid $50 and moved.`;
            phase = 'action';
          } else {
            return {
              ...state,
              players: state.players.map((p, i) => i === currentPlayerIndex ? { ...p, jailTurns: newJailTurns } : p),
              dice,
              doublesCount: 0,
              turnPhase: 'end',
              lastAction: lastActionMsg,
            };
          }
        }
      } else {
        // Normal movement
        const { position, passedGo } = calculateNewPosition(currentPlayer.position, moveAmount);
        newPosition = position;
        if (passedGo) playerMoney += 200;

        const newDoublesCount = double ? state.doublesCount + 1 : 0;
        
        // Speeding Rule (3 doubles -> Jail)
        if (newDoublesCount === 3) {
          newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            isInJail: true,
            jailTurns: 0,
            position: 10,
            money: playerMoney,
          };
          return {
            ...state,
            players: newPlayers,
            lastMoveType: 'jail',
            jailSource: undefined,
            lastAction: `${currentPlayer.name} rolled 3 doubles and went to Jail!`,
          };
        }

        // Check Go To Jail space (30)
        if (newPosition === 30) {
          newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            isInJail: true,
            jailTurns: 0,
            position: 10,
            money: playerMoney,
          };
          return {
            ...state,
            players: newPlayers,
            turnPhase: 'end',
            lastMoveType: 'jail',
            jailSource: 30,
            lastAction: `${currentPlayer.name} landed on Go To Jail!`,
          };
        }

        newPlayers[currentPlayerIndex] = {
          ...currentPlayer,
          position: newPosition,
          money: playerMoney,
        };

        // Check for rent on the new position
        const landedSpace = state.board.find(s => s.position === newPosition);
        if (landedSpace && landedSpace.owner && landedSpace.owner !== currentPlayer.id && !landedSpace.mortgaged) {
          const rentAmount = calculateRent(landedSpace, state.board, moveAmount);
          if (rentAmount > 0) {
            playerMoney -= rentAmount;
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

        // Handle Taxes
        if (landedSpace && isTaxSpace(landedSpace)) {
            const taxAmount = calculateTax(landedSpace);
            playerMoney -= taxAmount;
            lastActionMsg += `. Paid $${taxAmount} in taxes.`;
        }

        newPlayers[currentPlayerIndex].money = playerMoney;

        // Handle Card Spaces
        if (landedSpace && (landedSpace.id.startsWith('chance') || landedSpace.id.startsWith('community_chest'))) {
          const isChance = landedSpace.id.startsWith('chance');
          const deck = isChance ? state.chanceDeck : state.communityChestDeck;
          const card = deck[0];
          const remainingDeck = [...deck.slice(1), card]; // Cycle card to bottom

          return {
            ...state,
            players: newPlayers,
            dice,
            doublesCount: newDoublesCount,
            turnPhase: 'card',
            activeCard: card,
            lastAction: `${currentPlayer.name} landed on ${landedSpace.name} and drew a card.`,
            [isChance ? 'chanceDeck' : 'communityChestDeck']: remainingDeck,
          };
        }

        return {
          ...state,
          players: newPlayers,
          dice,
          doublesCount: newDoublesCount,
          turnPhase: 'action',
          lastMoveType: 'forward',
          jailSource: undefined,
          lastAction: lastActionMsg,
        };
      }

      // Default return for Jail exit logic
      newPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        position: newPosition,
        money: playerMoney,
        isInJail: newIsInJail,
        jailTurns: newJailTurns,
      };

      return {
        ...state,
        players: newPlayers,
        dice,
        doublesCount: 0, // No rerolls if getting out of jail via doubles (official rule)
        turnPhase: phase,
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
            turnPhase: 'end',
            lastAction: `${currentPlayer.name} bought ${currentSpace.name} for $${currentSpace.price}`
        };
    }

    case ACTION_TYPES.DECLINE_PURCHASE: {
        if (state.turnPhase !== 'action') return state;
        
        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];
        const currentSpace = state.board.find(s => s.position === currentPlayer.position);

        if (!currentSpace || currentSpace.type !== 'property' || currentSpace.owner) {
            return state;
        }

        // Initialize Auction
        return {
            ...state,
            turnPhase: 'auction',
            auction: {
                propertyId: currentSpace.id,
                highestBid: 0,
                highestBidderId: null,
                bidders: state.players.map(p => p.id),
                currentBidderIndex: state.players.findIndex(p => p.id === state.currentPlayerId)
            },
            lastAction: `Auction started for ${currentSpace.name}!`
        };
    }

    case ACTION_TYPES.PLACE_BID: {
        if (state.turnPhase !== 'auction' || !state.auction) return state;
        
        const { amount } = action as { type: typeof ACTION_TYPES.PLACE_BID, amount: number };
        const auction = state.auction;
        const bidderId = auction.bidders[auction.currentBidderIndex];
        const bidder = state.players.find(p => p.id === bidderId);

        if (!bidder || amount <= auction.highestBid || bidder.money < amount) {
            return state;
        }

        const nextBidderIndex = (auction.currentBidderIndex + 1) % auction.bidders.length;

        return {
            ...state,
            auction: {
                ...auction,
                highestBid: amount,
                highestBidderId: bidderId,
                currentBidderIndex: nextBidderIndex
            },
            lastAction: `${bidder.name} bid $${amount} for ${state.board.find(s => s.id === auction.propertyId)?.name}`
        };
    }

    case ACTION_TYPES.FOLD_AUCTION: {
        if (state.turnPhase !== 'auction' || !state.auction) return state;
        
        const auction = state.auction;
        const bidderId = auction.bidders[auction.currentBidderIndex];
        const newBidders = auction.bidders.filter(id => id !== bidderId);

        if (newBidders.length === 1 && auction.highestBidderId) {
            // Winner found
            const winnerId = auction.highestBidderId;
            const winnerIndex = state.players.findIndex(p => p.id === winnerId);
            const winner = state.players[winnerIndex];
            const propertyId = auction.propertyId;
            const property = state.board.find(s => s.id === propertyId);

            if (!property || winner.money < auction.highestBid) {
                // Should not happen if logic is correct, but let's be safe
                 return {
                    ...state,
                    turnPhase: 'end',
                    auction: undefined,
                    lastAction: `Auction for ${property?.name} ended with no winner.`
                };
            }

            const newPlayers = [...state.players];
            newPlayers[winnerIndex] = {
                ...winner,
                money: winner.money - auction.highestBid,
                properties: [...winner.properties, propertyId]
            };

            const newBoard = state.board.map(s => {
                if (s.id === propertyId) {
                    return { ...s, owner: winnerId };
                }
                return s;
            });

            return {
                ...state,
                players: newPlayers,
                board: newBoard,
                turnPhase: 'end',
                auction: undefined,
                lastAction: `${winner.name} won the auction for ${property.name} at $${auction.highestBid}!`
            };
        } else if (newBidders.length === 0) {
             return {
                ...state,
                turnPhase: 'end',
                auction: undefined,
                lastAction: `Auction ended. No one bought the property.`
            };
        }

        // Continue auction with remaining bidders
        const nextBidderIndex = auction.currentBidderIndex % newBidders.length;

        return {
            ...state,
            auction: {
                ...auction,
                bidders: newBidders,
                currentBidderIndex: nextBidderIndex
            },
            lastAction: `${state.players.find(p => p.id === bidderId)?.name} folded.`
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

    case ACTION_TYPES.SELL_BUILDING: {
        const property = state.board.find(s => s.id === (action as any).propertyId);
        if (!property) return state;

        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];

        const { canSell, reason } = canSellHouse(currentPlayer, property, state.board);
        if (!canSell) {
            return {
                ...state,
                lastAction: `Cannot sell building on ${property.name}: ${reason}`
            };
        }

        const sellPrice = (property.houseCost || 0) / 2;
        const newPlayers = [...state.players];
        newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            money: currentPlayer.money + sellPrice
        };

        const newBoard = state.board.map(s => {
            if (s.id === property.id) {
                return { ...s, houses: (s.houses || 0) - 1 };
            }
            return s;
        });

        const newLevel = (property.houses || 0) - 1;
        const upgradeName = newLevel === 4 ? 'Hotel' : 'House';

        return {
            ...state,
            players: newPlayers,
            board: newBoard,
            lastAction: `${currentPlayer.name} sold a ${upgradeName} on ${property.name} for $${sellPrice}`
        };
    }

    case ACTION_TYPES.MORTGAGE_PROPERTY: {
        const property = state.board.find(s => s.id === (action as any).propertyId);
        if (!property) return state;

        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];

        const { canMortgage: possible, reason } = canMortgage(currentPlayer, property, state.board);
        if (!possible) {
            return {
                ...state,
                lastAction: `Cannot mortgage ${property.name}: ${reason}`
            };
        }

        const mortgageValue = (property.price || 0) / 2;
        const newPlayers = [...state.players];
        newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            money: currentPlayer.money + mortgageValue
        };

        const newBoard = state.board.map(s => {
            if (s.id === property.id) {
                return { ...s, mortgaged: true };
            }
            return s;
        });

        return {
            ...state,
            players: newPlayers,
            board: newBoard,
            lastAction: `${currentPlayer.name} mortgaged ${property.name} for $${mortgageValue}`
        };
    }

    case ACTION_TYPES.UNMORTGAGE_PROPERTY: {
        const property = state.board.find(s => s.id === (action as any).propertyId);
        if (!property) return state;

        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];

        const { canUnmortgage: possible, reason } = canUnmortgage(currentPlayer, property);
        if (!possible) {
            return {
                ...state,
                lastAction: `Cannot unmortgage ${property.name}: ${reason}`
            };
        }

        const unmortgageCost = Math.ceil((property.price || 0) / 2 * 1.1);
        const newPlayers = [...state.players];
        newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            money: currentPlayer.money - unmortgageCost
        };

        const newBoard = state.board.map(s => {
            if (s.id === property.id) {
                return { ...s, mortgaged: false };
            }
            return s;
        });

        return {
            ...state,
            players: newPlayers,
            board: newBoard,
            lastAction: `${currentPlayer.name} unmortgaged ${property.name} for $${unmortgageCost}`
        };
    }


    case ACTION_TYPES.PAY_JAIL_FINE: {
        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];

        if (!currentPlayer.isInJail || currentPlayer.money < 50) return state;

        const newPlayers = [...state.players];
        newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            money: currentPlayer.money - 50,
            isInJail: false,
            jailTurns: 0
        };

        return {
            ...state,
            players: newPlayers,
            turnPhase: 'roll', // Can roll after paying fine
            lastAction: `${currentPlayer.name} paid $50 to get out of Jail.`
        };
    }

    case ACTION_TYPES.USE_JAIL_CARD: {
        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];

        if (!currentPlayer.isInJail || currentPlayer.getOutOfJailFreeCards <= 0) return state;

        const newPlayers = [...state.players];
        newPlayers[currentPlayerIndex] = {
            ...currentPlayer,
            getOutOfJailFreeCards: currentPlayer.getOutOfJailFreeCards - 1,
            isInJail: false,
            jailTurns: 0
        };

        return {
            ...state,
            players: newPlayers,
            turnPhase: 'roll', // Can roll after using card
            lastAction: `${currentPlayer.name} used a Get Out of Jail Free card.`
        };
    }

    case ACTION_TYPES.APPLY_CARD: {
        if (state.turnPhase !== 'card' || !state.activeCard) return state;

        const card = state.activeCard;
        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];
        let newPlayers = [...state.players];
        let newBoard = [...state.board];
        let lastActionMsg = `${currentPlayer.name} applied card: ${card.text}`;
        let nextPhase: 'roll' | 'action' | 'card' | 'end' | 'ended' = 'action';
        let moveType: 'forward' | 'backward' | 'jail' = 'forward';

        const applyEffect = (effect: CardEffect, player: Player) => {
            let pMoney = player.money;
            let pPos = player.position;
            let pJail = player.isInJail;
            let pJailCards = player.getOutOfJailFreeCards;

            switch (effect.type) {
                case 'MOVE_TO': {
                    const { position, passGo } = effect;
                    if (passGo && position < pPos) pMoney += 200;
                    pPos = position;
                    moveType = 'forward'; // All "Move To" in Monopoly are forward
                    break;
                }
                case 'MOVE_RELATIVE': {
                    pPos = (pPos + effect.amount + 40) % 40;
                    moveType = effect.amount < 0 ? 'backward' : 'forward';
                    break;
                }
                case 'COLLECT': {
                    pMoney += effect.amount;
                    break;
                }
                case 'PAY': {
                    pMoney -= effect.amount;
                    break;
                }
                case 'COLLECT_FROM_PLAYERS': {
                    newPlayers = newPlayers.map(p => {
                        if (p.id === player.id) return p;
                        const amount = Math.min(p.money, effect.amount);
                        pMoney += amount;
                        return { ...p, money: p.money - amount };
                    });
                    break;
                }
                case 'PAY_PLAYERS': {
                    newPlayers = newPlayers.map(p => {
                        if (p.id === player.id) return p;
                        pMoney -= effect.amount;
                        return { ...p, money: p.money + effect.amount };
                    });
                    break;
                }
                case 'STREET_REPAIRS': {
                    const playerProperties = newBoard.filter(s => s.owner === player.id);
                    let cost = 0;
                    playerProperties.forEach(prop => {
                        if (prop.houses === 5) cost += effect.hotelCost;
                        else cost += (prop.houses || 0) * effect.houseCost;
                    });
                    pMoney -= cost;
                    break;
                }
                case 'GO_TO_JAIL': {
                    pPos = 10;
                    pJail = true;
                    nextPhase = 'end';
                    moveType = 'jail';
                    break;
                }
                case 'GET_OUT_OF_JAIL_FREE': {
                    pJailCards += 1;
                    break;
                }
                case 'MOVE_NEAREST': {
                    // Logic for nearest station/utility
                    const positions = effect.target === 'station' ? [5, 15, 25, 35] : [12, 28];
                    let nearest = positions.find(pos => pos > pPos);
                    if (nearest === undefined) {
                        nearest = positions[0];
                        pMoney += 200; // Passed go
                    }
                    pPos = nearest;
                    moveType = 'forward';
                    break;
                }
            }

            return { ...player, money: pMoney, position: pPos, isInJail: pJail, getOutOfJailFreeCards: pJailCards };
        };

        newPlayers[currentPlayerIndex] = applyEffect(card.effect, currentPlayer);

        // If card was movement, we might need to trigger rent or purchase
        // For simplicity, we keep it in 'action' phase so player can buy if they landed on unowned property
        // or we calculate rent here.
        
        const landingSpace = newBoard.find(s => s.position === newPlayers[currentPlayerIndex].position);
        if (card.effect.type.startsWith('MOVE')) {
             if (landingSpace && landingSpace.owner && landingSpace.owner !== currentPlayer.id && !landingSpace.mortgaged) {
                let rentAmount = calculateRent(landingSpace, newBoard, state.dice[0] + state.dice[1]);
                
                // Special card rent rules
                if (card.effect.type === 'MOVE_NEAREST') {
                    if (card.effect.target === 'station') {
                        rentAmount *= 2; // Double rent for nearest railroad
                    } else if (card.effect.target === 'utility') {
                        // For utility, it's 10x the dice throw regardless of how many they own
                        rentAmount = (state.dice[0] + state.dice[1]) * 10;
                    }
                }

                if (rentAmount > 0) {
                    newPlayers[currentPlayerIndex].money -= rentAmount;
                    const ownerIndex = newPlayers.findIndex(p => p.id === landingSpace.owner);
                    if (ownerIndex !== -1) {
                        newPlayers[ownerIndex] = {
                            ...newPlayers[ownerIndex],
                            money: newPlayers[ownerIndex].money + rentAmount
                        };
                    }
                    lastActionMsg += `. Paid $${rentAmount} rent to ${newPlayers[ownerIndex].name}`;
                }
             }
        }

        // Check for Taxes
        if (landingSpace && isTaxSpace(landingSpace)) {
            const taxAmount = calculateTax(landingSpace);
            newPlayers[currentPlayerIndex].money -= taxAmount;
            lastActionMsg += `. Paid $${taxAmount} in taxes.`;
        }

        return {
            ...state,
            players: newPlayers,
            turnPhase: nextPhase,
            lastMoveType: moveType,
            jailSource: undefined,
            activeCard: undefined,
            lastAction: lastActionMsg,
        };
    }

    case ACTION_TYPES.DECLARE_BANKRUPTCY: {
        const currentPlayerIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        const currentPlayer = state.players[currentPlayerIndex];

       // Check if player is truly bankrupt (Net Worth < 0)
        // If they have assets (Liquidation Value) that can cover their debt (negative money), they cannot bankrupt.
        const netWorth = getLiquidationValue(currentPlayer, state.board);
        if (netWorth >= 0) {
            return {
                ...state,
                lastAction: `Cannot declare bankruptcy! You have $${netWorth} in value. Sell houses or mortgage properties.`
            };
        } 

        // Find creditor (owner of current space, or bank)
        const landedSpace = state.board.find(s => s.position === currentPlayer.position);
        const creditorId = landedSpace?.owner;

        let newBoard = [...state.board];
        let newPlayers = [...state.players];

        if (creditorId) {
            // Transfer properties to creditor
            newBoard = newBoard.map(s => {
                if (s.owner === currentPlayer.id) {
                    return { ...s, owner: creditorId };
                }
                return s;
            });

            // Transfer cards to creditor
            const creditorIdx = newPlayers.findIndex(p => p.id === creditorId);
            if (creditorIdx !== -1) {
                newPlayers[creditorIdx] = {
                    ...newPlayers[creditorIdx],
                    properties: [...newPlayers[creditorIdx].properties, ...currentPlayer.properties],
                    getOutOfJailFreeCards: newPlayers[creditorIdx].getOutOfJailFreeCards + currentPlayer.getOutOfJailFreeCards
                };
            }
        } else {
            // Return to bank
            newBoard = newBoard.map(s => {
                if (s.owner === currentPlayer.id) {
                    return { ...s, owner: undefined, houses: 0, mortgaged: false };
                }
                return s;
            });
        }

        // Remove bankrupted player
        newPlayers = newPlayers.filter(p => p.id !== currentPlayer.id);

        if (newPlayers.length === 1) {
            return {
                ...state,
                players: newPlayers,
                board: newBoard,
                currentPlayerId: newPlayers[0].id,
                turnPhase: 'ended',
                gameStatus: 'ended',
                winnerId: newPlayers[0].id,
                lastAction: `🏆 ${newPlayers[0].name} IS THE WINNER! 🏆`
            };
        }

        const nextPlayerIndex = currentPlayerIndex % newPlayers.length;
        const nextPlayerId = newPlayers[nextPlayerIndex].id;

        return {
            ...state,
            players: newPlayers,
            board: newBoard,
            currentPlayerId: nextPlayerId,
            turnPhase: 'roll',
            lastAction: `${currentPlayer.name} declared bankruptcy and left the game!`
        };
    }

    case ACTION_TYPES.SETUP_TRADE: {
        return {
            ...state,
            turnPhase: 'trade',
            activeTrade: undefined,
            lastAction: "Setting up a trade..."
        };
    }

    case ACTION_TYPES.CREATE_TRADE: {
        const { trade } = action as any;
        
        // Validate Trade
        const { isValid, reason } = isValidTrade(trade, state.players, state.board);
        if (!isValid) {
            return {
                ...state,
                lastAction: `Invalid Trade: ${reason}`
            };
        }

        return {
            ...state,
            turnPhase: 'trade',
            activeTrade: trade,
            lastAction: `${state.players.find(p => p.id === trade.fromPlayerId)?.name} offered a trade to ${state.players.find(p => p.id === trade.toPlayerId)?.name}`
        };

    }

    case ACTION_TYPES.ACCEPT_TRADE: {
        if (!state.activeTrade) return state;
        const trade = state.activeTrade;

        // Re-validate Trade (state check)
        const { isValid, reason } = isValidTrade(trade, state.players, state.board);
        if (!isValid) {
             return {
                ...state,
                turnPhase: 'action', // Return to action
                activeTrade: undefined,
                lastAction: `Trade failed: ${reason}`
            };
        }
        
        const fromPlayerIndex = state.players.findIndex(p => p.id === trade.fromPlayerId);
        const toPlayerIndex = state.players.findIndex(p => p.id === trade.toPlayerId);
        
        const newPlayers = [...state.players];
        
        // Transfer Money
        newPlayers[fromPlayerIndex] = {
            ...newPlayers[fromPlayerIndex],
            money: newPlayers[fromPlayerIndex].money - trade.offering.money + trade.requesting.money,
            properties: newPlayers[fromPlayerIndex].properties
                .filter(id => !trade.offering.properties.includes(id))
                .concat(trade.requesting.properties)
        };
        
        newPlayers[toPlayerIndex] = {
            ...newPlayers[toPlayerIndex],
            money: newPlayers[toPlayerIndex].money + trade.offering.money - trade.requesting.money,
            properties: newPlayers[toPlayerIndex].properties
                .filter(id => !trade.requesting.properties.includes(id))
                .concat(trade.offering.properties)
        };
        
        // Update Board Owners
        const newBoard = state.board.map(s => {
            if (trade.offering.properties.includes(s.id)) {
                return { ...s, owner: trade.toPlayerId };
            }
            if (trade.requesting.properties.includes(s.id)) {
                return { ...s, owner: trade.fromPlayerId };
            }
            return s;
        });
        
        return {
            ...state,
            players: newPlayers,
            board: newBoard,
            turnPhase: 'action', // or 'end' depending on previous state, but 'action' is safe
            activeTrade: undefined,
            lastAction: "Trade accepted!"
        };
    }

    case ACTION_TYPES.REJECT_TRADE:
    case ACTION_TYPES.CANCEL_TRADE: {
        return {
            ...state,
            turnPhase: 'action',
            activeTrade: undefined,
            lastAction: action.type === ACTION_TYPES.REJECT_TRADE ? "Trade rejected" : "Trade cancelled"
        };
    }

    case ACTION_TYPES.END_TURN: {

       const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
       if (!currentPlayer) return state;

       if (currentPlayer.money < 0) {
           return {
               ...state,
               lastAction: "You cannot end your turn with negative money! Mortgage properties or sell buildings."
           };
       }

       if (state.turnPhase === 'roll') return state; // Can't skip roll

        if (isDouble(state.dice) && state.doublesCount > 0 && !currentPlayer.isInJail) {
             return {
                 ...state,
                 turnPhase: 'roll',
                 lastAction: `${currentPlayer.name} rolled doubles! Roll again.`
             };
        }

       const currentIndex = state.players.findIndex(p => p.id === state.currentPlayerId);
        // Switch to next player
       const nextIndex = (currentIndex + 1) % state.players.length;

       return {
         ...state,
         currentPlayerId: state.players[nextIndex].id,
         doublesCount: 0,
         turnPhase: 'roll',
         jailSource: undefined,
         lastAction: `Turn ended. ${state.players[nextIndex].name}'s turn.`,
       };
    }

    default:
      return state;
  }
};

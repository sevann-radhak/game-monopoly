import type { TokenId } from './tokens';

export type GameMode = 'local' | 'online';

export type LobbyStatus = 'waiting' | 'determining_order' | 'starting' | 'started';

export interface PlayerSlot {
  id: string;
  type: 'human' | 'bot';
  name: string;
  color: string;
  token: TokenId;
  isReady: boolean;
  playerId?: string;
  botPersonality?: string;
}

export interface GameSettings {
  startingMoney: number;
  enableAuctions: boolean;
  enableTrading: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  startingMoney: 1500,
  enableAuctions: true,
  enableTrading: true,
};

export interface LobbyConfig {
  sessionId: string;
  gameMode: GameMode;
  maxPlayers: number;
  minPlayers: number;
  playerSlots: PlayerSlot[];
  settings: GameSettings;
  createdAt: number;
  hostPlayerId?: string;
}

export interface TurnOrderRoll {
  playerSlotId: string;
  roll: number;
  timestamp: number;
}

export interface LobbyState {
  config: LobbyConfig;
  status: LobbyStatus;
  turnOrderRolls?: Map<string, number>;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;



import type { LobbyConfig } from '../../types';

export interface SessionService {
  createSession(config: LobbyConfig): Promise<string>;
  joinSession(sessionId: string, playerId: string): Promise<void>;
  leaveSession(sessionId: string, playerId: string): Promise<void>;
  updateLobby(sessionId: string, config: LobbyConfig): Promise<void>;
  subscribeToLobby(
    sessionId: string,
    callback: (config: LobbyConfig) => void
  ): () => void;
  getLobby(sessionId: string): Promise<LobbyConfig | null>;
}

export type LobbyEvent =
  | { type: 'lobby_created'; sessionId: string; config: LobbyConfig }
  | { type: 'player_joined'; sessionId: string; playerId: string }
  | { type: 'player_left'; sessionId: string; playerId: string }
  | { type: 'lobby_updated'; sessionId: string; config: LobbyConfig }
  | { type: 'game_started'; sessionId: string; config: LobbyConfig };

export interface SessionServiceEvents {
  on(event: 'lobby_created', handler: (event: LobbyEvent) => void): void;
  on(event: 'player_joined', handler: (event: LobbyEvent) => void): void;
  on(event: 'player_left', handler: (event: LobbyEvent) => void): void;
  on(event: 'lobby_updated', handler: (event: LobbyEvent) => void): void;
  on(event: 'game_started', handler: (event: LobbyEvent) => void): void;
  off(event: string, handler: (event: LobbyEvent) => void): void;
}


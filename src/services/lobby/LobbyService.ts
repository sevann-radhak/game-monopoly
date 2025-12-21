import type { SessionService } from '../session/SessionService';
import type {
  LobbyConfig,
  PlayerSlot,
  GameMode,
  GameSettings,
  TokenId,
} from '../../types';
import {
  createLobby as createLobbyConfig,
  addPlayerSlot as addPlayerSlotToConfig,
  removePlayerSlot as removePlayerSlotFromConfig,
  updatePlayerSlot as updatePlayerSlotInConfig,
  setPlayerReady as setPlayerReadyInConfig,
  canStartGame,
  validateLobby,
  determineTurnOrder,
  createLobbyState,
  updateLobbyState,
} from './LobbyManager';
import { DEFAULT_GAME_SETTINGS } from '../../types/lobby';

export class LobbyService {
  constructor(private sessionService: SessionService) {}

  async createLobby(
    gameMode: GameMode = 'local',
    maxPlayers: number = 8,
    settings?: Partial<GameSettings>
  ): Promise<string> {
    const config = createLobbyConfig(gameMode, maxPlayers, settings);
    return await this.sessionService.createSession(config);
  }

  async getLobby(sessionId: string): Promise<LobbyConfig | null> {
    return await this.sessionService.getLobby(sessionId);
  }

  async addPlayerSlot(
    sessionId: string,
    type: 'human' | 'bot',
    name?: string,
    color?: string,
    token?: TokenId
  ): Promise<LobbyConfig> {
    const currentConfig = await this.sessionService.getLobby(sessionId);
    if (!currentConfig) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedConfig = addPlayerSlotToConfig(
      currentConfig,
      type,
      name,
      color,
      token
    );
    await this.sessionService.updateLobby(sessionId, updatedConfig);
    return updatedConfig;
  }

  async removePlayerSlot(
    sessionId: string,
    slotId: string
  ): Promise<LobbyConfig> {
    const currentConfig = await this.sessionService.getLobby(sessionId);
    if (!currentConfig) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedConfig = removePlayerSlotFromConfig(currentConfig, slotId);
    await this.sessionService.updateLobby(sessionId, updatedConfig);
    return updatedConfig;
  }

  async updatePlayerSlot(
    sessionId: string,
    slotId: string,
    updates: Partial<Omit<PlayerSlot, 'id' | 'type'>>
  ): Promise<LobbyConfig> {
    const currentConfig = await this.sessionService.getLobby(sessionId);
    if (!currentConfig) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedConfig = updatePlayerSlotInConfig(
      currentConfig,
      slotId,
      updates
    );
    await this.sessionService.updateLobby(sessionId, updatedConfig);
    return updatedConfig;
  }

  async setPlayerReady(
    sessionId: string,
    slotId: string,
    isReady: boolean
  ): Promise<LobbyConfig> {
    const currentConfig = await this.sessionService.getLobby(sessionId);
    if (!currentConfig) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedConfig = setPlayerReadyInConfig(
      currentConfig,
      slotId,
      isReady
    );
    await this.sessionService.updateLobby(sessionId, updatedConfig);
    return updatedConfig;
  }

  async joinSession(sessionId: string, playerId: string): Promise<void> {
    await this.sessionService.joinSession(sessionId, playerId);
  }

  async leaveSession(sessionId: string, playerId: string): Promise<void> {
    await this.sessionService.leaveSession(sessionId, playerId);
  }

  subscribeToLobby(
    sessionId: string,
    callback: (config: LobbyConfig) => void
  ): () => void {
    return this.sessionService.subscribeToLobby(sessionId, callback);
  }

  async canStartGame(sessionId: string): Promise<{
    canStart: boolean;
    reasons: string[];
  }> {
    const config = await this.sessionService.getLobby(sessionId);
    if (!config) {
      return {
        canStart: false,
        reasons: ['Session not found'],
      };
    }
    return canStartGame(config);
  }

  async validateLobby(sessionId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const config = await this.sessionService.getLobby(sessionId);
    if (!config) {
      return {
        isValid: false,
        errors: ['Session not found'],
      };
    }
    return validateLobby(config);
  }

  async determineTurnOrder(
    sessionId: string,
    rolls: Map<string, number>
  ): Promise<string[]> {
    const config = await this.sessionService.getLobby(sessionId);
    if (!config) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return determineTurnOrder(config, rolls);
  }
}


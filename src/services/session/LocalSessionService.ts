import type { SessionService, LobbyEvent } from './SessionService';
import type { LobbyConfig } from '../../types';

class LocalSessionService implements SessionService {
  private sessions: Map<string, LobbyConfig> = new Map();
  private subscribers: Map<string, Set<(config: LobbyConfig) => void>> = new Map();
  private eventHandlers: Map<string, Set<(event: LobbyEvent) => void>> = new Map();

  async createSession(config: LobbyConfig): Promise<string> {
    if (this.sessions.has(config.sessionId)) {
      throw new Error(`Session ${config.sessionId} already exists`);
    }

    this.sessions.set(config.sessionId, config);
    this.notifySubscribers(config.sessionId, config);
    this.emitEvent({
      type: 'lobby_created',
      sessionId: config.sessionId,
      config,
    });

    return config.sessionId;
  }

  async joinSession(sessionId: string, playerId: string): Promise<void> {
    const config = this.sessions.get(sessionId);
    if (!config) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.emitEvent({
      type: 'player_joined',
      sessionId,
      playerId,
    });
  }

  async leaveSession(sessionId: string, playerId: string): Promise<void> {
    const config = this.sessions.get(sessionId);
    if (!config) {
      return;
    }

    this.emitEvent({
      type: 'player_left',
      sessionId,
      playerId,
    });
  }

  async updateLobby(sessionId: string, config: LobbyConfig): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (config.sessionId !== sessionId) {
      throw new Error('Session ID mismatch');
    }

    this.sessions.set(sessionId, config);
    this.notifySubscribers(sessionId, config);
    this.emitEvent({
      type: 'lobby_updated',
      sessionId,
      config,
    });
  }

  subscribeToLobby(
    sessionId: string,
    callback: (config: LobbyConfig) => void
  ): () => void {
    if (!this.subscribers.has(sessionId)) {
      this.subscribers.set(sessionId, new Set());
    }

    const callbacks = this.subscribers.get(sessionId)!;
    callbacks.add(callback);

    const config = this.sessions.get(sessionId);
    if (config) {
      callback(config);
    }

    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(sessionId);
      }
    };
  }

  async getLobby(sessionId: string): Promise<LobbyConfig | null> {
    return this.sessions.get(sessionId) || null;
  }

  private notifySubscribers(sessionId: string, config: LobbyConfig): void {
    const callbacks = this.subscribers.get(sessionId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(config);
        } catch (error) {
          console.error('Error in lobby subscriber callback:', error);
        }
      });
    }
  }

  private emitEvent(event: LobbyEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }

  on(event: string, handler: (event: LobbyEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (event: LobbyEvent) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.subscribers.delete(sessionId);
  }

  clearAllSessions(): void {
    this.sessions.clear();
    this.subscribers.clear();
    this.eventHandlers.clear();
  }
}

export const localSessionService = new LocalSessionService();


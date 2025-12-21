import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  LobbyConfig,
  LobbyState,
  PlayerSlot,
  GameMode,
} from '../types';
import { LobbyService } from '../services/lobby/LobbyService';
import { localSessionService } from '../services/session/LocalSessionService';
import { createLobbyState, updateLobbyState } from '../services/lobby/LobbyManager';

type AppState = 'lobby' | 'game' | 'ended';

interface UseLobbyReturn {
  lobbyState: LobbyState | null;
  appState: AppState;
  startGame: (turnOrder: string[]) => void;
  returnToLobby: () => void;
  createNewLobby: (gameMode?: GameMode, maxPlayers?: number) => void;
  addSlot: (type: 'human' | 'bot', name?: string, color?: string, token?: string) => void;
  removeSlot: (slotId: string) => void;
  updateSlot: (slotId: string, updates: Partial<Omit<PlayerSlot, 'id' | 'type'>>) => void;
  setReady: (slotId: string, isReady: boolean) => void;
  canStart: { canStart: boolean; reasons: string[] };
  setLobbyStatus: (status: LobbyState['status']) => void;
  setTurnOrderRolls: (rolls: Map<string, number>) => void;
  getTurnOrder: (rolls: Map<string, number>) => Promise<string[]>;
}

const LOBBY_STORAGE_KEY = 'monopoly_lobby_state';

export function useLobby(): UseLobbyReturn {
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [appState, setAppState] = useState<AppState>('lobby');
  const lobbyServiceRef = useRef(new LobbyService(localSessionService));
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOBBY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const config = parsed.config;
        if (config && config.sessionId) {
          currentSessionIdRef.current = config.sessionId;
          setLobbyState(parsed);
          
          const unsubscribe = lobbyServiceRef.current.subscribeToLobby(
            config.sessionId,
            (updatedConfig) => {
              setLobbyState((prev) => {
                if (prev) {
                  return updateLobbyState(prev, { config: updatedConfig });
                }
                return createLobbyState(updatedConfig, 'waiting');
              });
            }
          );
          unsubscribeRef.current = unsubscribe;
        } else {
          createNewLobby();
        }
      } catch {
        createNewLobby();
      }
    } else {
      createNewLobby();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (lobbyState) {
      localStorage.setItem(LOBBY_STORAGE_KEY, JSON.stringify(lobbyState));
    }
  }, [lobbyState]);

  const createNewLobby = useCallback(
    async (gameMode: GameMode = 'local', maxPlayers: number = 8) => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      const sessionId = await lobbyServiceRef.current.createLobby(
        gameMode,
        maxPlayers
      );
      currentSessionIdRef.current = sessionId;

      const config = await lobbyServiceRef.current.getLobby(sessionId);
      if (config) {
        const state = createLobbyState(config, 'waiting');
        setLobbyState(state);
        setAppState('lobby');

        const unsubscribe = lobbyServiceRef.current.subscribeToLobby(
          sessionId,
          (updatedConfig) => {
            setLobbyState((prev) => {
              if (prev) {
                return updateLobbyState(prev, { config: updatedConfig });
              }
              return createLobbyState(updatedConfig, 'waiting');
            });
          }
        );
        unsubscribeRef.current = unsubscribe;
      }
    },
    []
  );

  const addSlot = useCallback(
    async (
      type: 'human' | 'bot',
      name?: string,
      color?: string,
      token?: string
    ) => {
      if (!lobbyState || !currentSessionIdRef.current) return;

      try {
        await lobbyServiceRef.current.addPlayerSlot(
          currentSessionIdRef.current,
          type,
          name,
          color,
          token as any
        );
      } catch (error) {
        console.error('Failed to add player slot:', error);
      }
    },
    [lobbyState]
  );

  const removeSlot = useCallback(
    async (slotId: string) => {
      if (!lobbyState || !currentSessionIdRef.current) return;

      try {
        await lobbyServiceRef.current.removePlayerSlot(
          currentSessionIdRef.current,
          slotId
        );
      } catch (error) {
        console.error('Failed to remove player slot:', error);
      }
    },
    [lobbyState]
  );

  const updateSlot = useCallback(
    async (
      slotId: string,
      updates: Partial<Omit<PlayerSlot, 'id' | 'type'>>
    ) => {
      if (!lobbyState || !currentSessionIdRef.current) return;

      try {
        await lobbyServiceRef.current.updatePlayerSlot(
          currentSessionIdRef.current,
          slotId,
          updates
        );
      } catch (error) {
        console.error('Failed to update player slot:', error);
      }
    },
    [lobbyState]
  );

  const setReady = useCallback(
    async (slotId: string, isReady: boolean) => {
      if (!lobbyState || !currentSessionIdRef.current) return;

      try {
        await lobbyServiceRef.current.setPlayerReady(
          currentSessionIdRef.current,
          slotId,
          isReady
        );
      } catch (error) {
        console.error('Failed to set player ready:', error);
      }
    },
    [lobbyState]
  );

  const setLobbyStatus = useCallback(
    (status: LobbyState['status']) => {
      if (!lobbyState) return;
      setLobbyState(updateLobbyState(lobbyState, { status }));
    },
    [lobbyState]
  );

  const setTurnOrderRolls = useCallback(
    (rolls: Map<string, number>) => {
      if (!lobbyState) return;
      setLobbyState(updateLobbyState(lobbyState, { turnOrderRolls: rolls }));
    },
    [lobbyState]
  );

  const getTurnOrder = useCallback(
    async (rolls: Map<string, number>): Promise<string[]> => {
      if (!lobbyState || !currentSessionIdRef.current) return [];
      try {
        return await lobbyServiceRef.current.determineTurnOrder(
          currentSessionIdRef.current,
          rolls
        );
      } catch (error) {
        console.error('Failed to determine turn order:', error);
        return [];
      }
    },
    [lobbyState]
  );

  const startGame = useCallback(
    (turnOrder: string[]) => {
      if (!lobbyState) return;

      const updatedConfig = { ...lobbyState.config };
      updatedConfig.playerSlots = updatedConfig.playerSlots.map((slot, index) => {
        const orderIndex = turnOrder.indexOf(slot.id);
        return {
          ...slot,
          playerId: `p${orderIndex + 1}`,
        };
      });

      const updatedState = updateLobbyState(lobbyState, {
        config: updatedConfig,
        status: 'started',
      });

      setLobbyState(updatedState);
      setAppState('game');
    },
    [lobbyState]
  );

  const returnToLobby = useCallback(() => {
    if (!lobbyState) {
      createNewLobby();
      return;
    }

    const resetConfig = {
      ...lobbyState.config,
      playerSlots: lobbyState.config.playerSlots.map(slot => ({
        ...slot,
        isReady: slot.type === 'bot',
        playerId: undefined,
      })),
    };

    const resetState = createLobbyState(resetConfig, 'waiting');
    setLobbyState(resetState);
    setAppState('lobby');
  }, [lobbyState, createNewLobby]);

  const [canStart, setCanStart] = useState<{
    canStart: boolean;
    reasons: string[];
  }>({ canStart: false, reasons: ['No lobby initialized'] });

  useEffect(() => {
    if (lobbyState && currentSessionIdRef.current) {
      lobbyServiceRef.current
        .canStartGame(currentSessionIdRef.current)
        .then(setCanStart)
        .catch(() => {
          setCanStart({ canStart: false, reasons: ['Error checking if can start'] });
        });
    } else {
      setCanStart({ canStart: false, reasons: ['No lobby initialized'] });
    }
  }, [lobbyState]);

  return {
    lobbyState,
    appState,
    startGame,
    returnToLobby,
    createNewLobby,
    addSlot,
    removeSlot,
    updateSlot,
    setReady,
    canStart,
    setLobbyStatus,
    setTurnOrderRolls,
    getTurnOrder,
  };
}


import type {
  LobbyConfig,
  LobbyState,
  PlayerSlot,
  GameMode,
  GameSettings,
  TokenId,
} from '../../types';
import { DEFAULT_GAME_SETTINGS, MIN_PLAYERS, MAX_PLAYERS } from '../../types/lobby';
import { ALL_TOKENS } from '../../types/tokens';
import { createHumanSlot, createBotSlot } from './PlayerSlotFactory';
import { isTokenAvailable, validateTokenUniqueness } from './TokenManager';
import { validateColorUniqueness, getDuplicateColors, getDuplicateNames } from './ColorManager';

export function createLobby(
  gameMode: GameMode,
  maxPlayers: number = MAX_PLAYERS,
  settings?: Partial<GameSettings>
): LobbyConfig {
  if (maxPlayers < MIN_PLAYERS || maxPlayers > MAX_PLAYERS) {
    throw new Error(
      `Max players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`
    );
  }

  const sessionId = generateSessionId();
  const gameSettings: GameSettings = {
    ...DEFAULT_GAME_SETTINGS,
    ...settings,
  };

  return {
    sessionId,
    gameMode,
    maxPlayers,
    minPlayers: MIN_PLAYERS,
    playerSlots: [],
    settings: gameSettings,
    createdAt: Date.now(),
  };
}

export function addPlayerSlot(
  lobby: LobbyConfig,
  type: 'human' | 'bot',
  name?: string,
  color?: string,
  token?: TokenId
): LobbyConfig {
  if (lobby.playerSlots.length >= lobby.maxPlayers) {
    throw new Error(`Cannot add more players. Maximum is ${lobby.maxPlayers}`);
  }

  const slot =
    type === 'human'
      ? createHumanSlot(name || 'Player', color || '#000000', token || ALL_TOKENS[0].id)
      : createBotSlot(name, color, token);

  return {
    ...lobby,
    playerSlots: [...lobby.playerSlots, slot],
  };
}

export function removePlayerSlot(
  lobby: LobbyConfig,
  slotId: string
): LobbyConfig {
  const updatedSlots = lobby.playerSlots.filter(slot => slot.id !== slotId);

  if (updatedSlots.length === lobby.playerSlots.length) {
    throw new Error(`Player slot ${slotId} not found`);
  }

  return {
    ...lobby,
    playerSlots: updatedSlots,
  };
}

export function updatePlayerSlot(
  lobby: LobbyConfig,
  slotId: string,
  updates: Partial<Omit<PlayerSlot, 'id' | 'type'>>
): LobbyConfig {
  const slotIndex = lobby.playerSlots.findIndex(slot => slot.id === slotId);
  if (slotIndex === -1) {
    throw new Error(`Player slot ${slotId} not found`);
  }

  const updatedSlots = [...lobby.playerSlots];
  updatedSlots[slotIndex] = {
    ...updatedSlots[slotIndex],
    ...updates,
  };

  if (updates.token && !isTokenAvailable(lobby, updates.token)) {
    const currentSlot = updatedSlots[slotIndex];
    if (currentSlot.token !== updates.token) {
      throw new Error(`Token ${updates.token} is already assigned to another player`);
    }
  }

  return {
    ...lobby,
    playerSlots: updatedSlots,
  };
}

export function setPlayerReady(
  lobby: LobbyConfig,
  slotId: string,
  isReady: boolean
): LobbyConfig {
  return updatePlayerSlot(lobby, slotId, { isReady });
}

export function canStartGame(lobby: LobbyConfig): {
  canStart: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (lobby.playerSlots.length < lobby.minPlayers) {
    const needed = lobby.minPlayers - lobby.playerSlots.length;
    reasons.push(
      `Need ${needed} more player${needed > 1 ? 's' : ''} to start (minimum ${lobby.minPlayers})`
    );
  }

  if (lobby.playerSlots.length > lobby.maxPlayers) {
    reasons.push(
      `Too many players: ${lobby.playerSlots.length}/${lobby.maxPlayers} (maximum ${lobby.maxPlayers})`
    );
  }

  const slotsWithoutName = lobby.playerSlots.filter(
    slot => !slot.name || slot.name.trim() === ''
  );
  if (slotsWithoutName.length > 0) {
    const slotTypes = slotsWithoutName.map(s => s.type).join(', ');
    reasons.push(`${slotsWithoutName.length} player${slotsWithoutName.length > 1 ? 's' : ''} missing name${slotsWithoutName.length > 1 ? 's' : ''} (${slotTypes})`);
  }

  const slotsWithoutToken = lobby.playerSlots.filter(
    slot => !slot.token
  );
  if (slotsWithoutToken.length > 0) {
    const slotNames = slotsWithoutToken.map(s => s.name || 'Unnamed').join(', ');
    reasons.push(`Missing tokens: ${slotNames}`);
  }

  if (!validateTokenUniqueness(lobby)) {
    reasons.push('Each player must have a unique token');
  }

  const duplicateNames = getDuplicateNames(lobby);
  if (duplicateNames.length > 0) {
    const namesList = duplicateNames.map(n => `"${n}"`).join(', ');
    reasons.push(`Duplicate names: ${namesList}`);
  }

  if (!validateColorUniqueness(lobby)) {
    const duplicateColors = getDuplicateColors(lobby);
    if (duplicateColors.length > 0) {
      reasons.push(`Duplicate colors detected. Each player must have a unique color`);
    } else {
      reasons.push('All players must have a unique color');
    }
  }

  const slotsWithoutColor = lobby.playerSlots.filter(
    slot => !slot.color || slot.color.trim() === ''
  );
  if (slotsWithoutColor.length > 0) {
    const slotNames = slotsWithoutColor.map(s => s.name || 'Unnamed').join(', ');
    reasons.push(`Missing colors: ${slotNames}`);
  }

  const humanSlotsNotReady = lobby.playerSlots.filter(
    slot => slot.type === 'human' && !slot.isReady
  );
  if (humanSlotsNotReady.length > 0) {
    const notReadyNames = humanSlotsNotReady.map(s => s.name || 'Unnamed').join(', ');
    reasons.push(`Players not ready: ${notReadyNames}`);
  }

  return {
    canStart: reasons.length === 0,
    reasons,
  };
}

export function validateLobby(lobby: LobbyConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!lobby.sessionId || lobby.sessionId.trim() === '') {
    errors.push('Lobby must have a session ID');
  }

  if (lobby.maxPlayers < MIN_PLAYERS || lobby.maxPlayers > MAX_PLAYERS) {
    errors.push(`Max players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
  }

  if (lobby.minPlayers < MIN_PLAYERS || lobby.minPlayers > lobby.maxPlayers) {
    errors.push(`Min players must be between ${MIN_PLAYERS} and ${lobby.maxPlayers}`);
  }

  if (lobby.playerSlots.length < 0) {
    errors.push('Player slots cannot be negative');
  }

  if (lobby.playerSlots.length > lobby.maxPlayers) {
    errors.push(`Cannot have more than ${lobby.maxPlayers} players`);
  }

  if (!lobby.settings) {
    errors.push('Lobby must have game settings');
  } else {
    if (lobby.settings.startingMoney < 0) {
      errors.push('Starting money cannot be negative');
    }
  }

  if (!validateTokenUniqueness(lobby)) {
    errors.push('All players must have unique tokens');
  }

  const duplicateSlotIds = lobby.playerSlots
    .map(slot => slot.id)
    .filter((id, index, arr) => arr.indexOf(id) !== index);
  if (duplicateSlotIds.length > 0) {
    errors.push('All player slots must have unique IDs');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function determineTurnOrder(
  lobby: LobbyConfig,
  rolls: Map<string, number>
): string[] {
  if (rolls.size !== lobby.playerSlots.length) {
    throw new Error('All players must roll dice to determine turn order');
  }

  const slotIds = lobby.playerSlots.map(slot => slot.id);
  const missingRolls = slotIds.filter(id => !rolls.has(id));
  if (missingRolls.length > 0) {
    throw new Error(`Missing rolls for slots: ${missingRolls.join(', ')}`);
  }

  const sortedSlots = [...lobby.playerSlots].sort((a, b) => {
    const rollA = rolls.get(a.id) || 0;
    const rollB = rolls.get(b.id) || 0;

    if (rollB !== rollA) {
      return rollB - rollA;
    }

    return a.name.localeCompare(b.name);
  });

  return sortedSlots.map(slot => slot.id);
}

export function createLobbyState(
  config: LobbyConfig,
  status: LobbyState['status'] = 'waiting'
): LobbyState {
  return {
    config,
    status,
  };
}

export function updateLobbyState(
  state: LobbyState,
  updates: Partial<Pick<LobbyState, 'status' | 'turnOrderRolls'>>
): LobbyState {
  return {
    ...state,
    ...updates,
  };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

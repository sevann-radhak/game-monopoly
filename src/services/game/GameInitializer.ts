import type { LobbyConfig, PlayerSlot, Player, GameState } from '../../types';
import { BOARD_CONFIG } from '../../engine/constants';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffleDeck } from '../../engine/cards';

export interface GameInitializationResult {
  gameState: GameState;
  playerIdMap: Map<string, string>;
}

export function initializeGameFromLobby(
  lobbyConfig: LobbyConfig,
  turnOrder: string[]
): GameInitializationResult {
  if (turnOrder.length !== lobbyConfig.playerSlots.length) {
    throw new Error(
      'Turn order must include all player slots'
    );
  }

  const slotIdSet = new Set(lobbyConfig.playerSlots.map(slot => slot.id));
  const invalidSlotIds = turnOrder.filter(id => !slotIdSet.has(id));
  if (invalidSlotIds.length > 0) {
    throw new Error(
      `Invalid slot IDs in turn order: ${invalidSlotIds.join(', ')}`
    );
  }

  const players = mapPlayerSlotsToPlayers(
    lobbyConfig.playerSlots,
    turnOrder,
    lobbyConfig.settings.startingMoney
  );

  const playerIdMap = new Map<string, string>();
  const slotMap = new Map<string, PlayerSlot>();
  lobbyConfig.playerSlots.forEach(slot => {
    slotMap.set(slot.id, slot);
  });

  turnOrder.forEach((slotId, index) => {
    const player = players[index];
    if (player) {
      playerIdMap.set(slotId, player.id);
    }
  });

  const gameState: GameState = {
    players,
    currentPlayerId: players[0]?.id || '',
    board: BOARD_CONFIG,
    dice: [0, 0],
    doublesCount: 0,
    gameStatus: 'playing',
    turnPhase: 'roll',
    lastAction: 'Game started',
    chanceDeck: shuffleDeck(CHANCE_CARDS),
    communityChestDeck: shuffleDeck(COMMUNITY_CHEST_CARDS),
  };

  return {
    gameState,
    playerIdMap,
  };
}

export function mapPlayerSlotsToPlayers(
  slots: PlayerSlot[],
  turnOrder: string[],
  startingMoney: number
): Player[] {
  const slotMap = new Map<string, PlayerSlot>();
  slots.forEach(slot => {
    slotMap.set(slot.id, slot);
  });

  const orderedSlots: PlayerSlot[] = [];
  turnOrder.forEach(slotId => {
    const slot = slotMap.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found in player slots`);
    }
    orderedSlots.push(slot);
  });

  return orderedSlots.map((slot, index) => {
    const playerId = slot.playerId || generatePlayerId(index);
    
    return {
      id: playerId,
      name: slot.name,
      type: slot.type,
      color: slot.color,
      money: startingMoney,
      position: 0,
      isInJail: false,
      jailTurns: 0,
      properties: [],
      getOutOfJailFreeCards: 0,
    };
  });
}

function generatePlayerId(index: number): string {
  return `player_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateGameInitialization(
  lobbyConfig: LobbyConfig,
  turnOrder: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (lobbyConfig.playerSlots.length < lobbyConfig.minPlayers) {
    errors.push(
      `Need at least ${lobbyConfig.minPlayers} players to start`
    );
  }

  if (lobbyConfig.playerSlots.length > lobbyConfig.maxPlayers) {
    errors.push(
      `Too many players. Maximum is ${lobbyConfig.maxPlayers}`
    );
  }

  if (turnOrder.length !== lobbyConfig.playerSlots.length) {
    errors.push(
      'Turn order must include all player slots'
    );
  }

  const slotIds = new Set(lobbyConfig.playerSlots.map(slot => slot.id));
  const missingSlots = turnOrder.filter(id => !slotIds.has(id));
  if (missingSlots.length > 0) {
    errors.push(
      `Turn order contains invalid slot IDs: ${missingSlots.join(', ')}`
    );
  }

  const duplicateSlots = turnOrder.filter(
    (id, index) => turnOrder.indexOf(id) !== index
  );
  if (duplicateSlots.length > 0) {
    errors.push(
      `Turn order contains duplicate slot IDs: ${duplicateSlots.join(', ')}`
    );
  }

  const slotsWithoutName = lobbyConfig.playerSlots.filter(
    slot => !slot.name || slot.name.trim() === ''
  );
  if (slotsWithoutName.length > 0) {
    errors.push('All players must have a name');
  }

  const slotsWithoutToken = lobbyConfig.playerSlots.filter(
    slot => !slot.token
  );
  if (slotsWithoutToken.length > 0) {
    errors.push('All players must have a token assigned');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}


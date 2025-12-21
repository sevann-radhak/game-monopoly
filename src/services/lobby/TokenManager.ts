import type { LobbyConfig, TokenId } from '../../types';
import { getAvailableTokens } from '../../types/tokens';

export function getAvailableTokensForLobby(lobby: LobbyConfig): TokenId[] {
  const usedTokens = lobby.playerSlots
    .map(slot => slot.token)
    .filter((token): token is TokenId => token !== undefined);

  return getAvailableTokens(usedTokens).map(token => token.id);
}

export function assignToken(
  lobby: LobbyConfig,
  slotId: string,
  token: TokenId
): LobbyConfig {
  if (!isTokenAvailable(lobby, token)) {
    throw new Error(`Token ${token} is already assigned to another player`);
  }

  const slotIndex = lobby.playerSlots.findIndex(slot => slot.id === slotId);
  if (slotIndex === -1) {
    throw new Error(`Player slot ${slotId} not found`);
  }

  const updatedSlots = [...lobby.playerSlots];
  updatedSlots[slotIndex] = {
    ...updatedSlots[slotIndex],
    token,
  };

  return {
    ...lobby,
    playerSlots: updatedSlots,
  };
}

export function isTokenAvailable(lobby: LobbyConfig, token: TokenId): boolean {
  const usedTokens = lobby.playerSlots
    .map(slot => slot.token)
    .filter((token): token is TokenId => token !== undefined);

  return !usedTokens.includes(token);
}

export function validateTokenUniqueness(lobby: LobbyConfig): boolean {
  const tokens = lobby.playerSlots
    .map(slot => slot.token)
    .filter((token): token is TokenId => token !== undefined);

  const uniqueTokens = new Set(tokens);
  return uniqueTokens.size === tokens.length;
}

export function getTokenBySlotId(lobby: LobbyConfig, slotId: string): TokenId | undefined {
  const slot = lobby.playerSlots.find(s => s.id === slotId);
  return slot?.token;
}


import type { PlayerSlot, LobbyConfig } from '../../types';
import { isColorAvailable, getDuplicateColors } from './ColorManager';
import { isTokenAvailable } from './TokenManager';
import { getDuplicateNames } from './ColorManager';

export interface SlotValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSlot(
  slot: PlayerSlot,
  lobby: LobbyConfig
): SlotValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!slot.name || slot.name.trim() === '') {
    errors.push('Name is required');
  } else {
    const normalizedName = slot.name.toLowerCase().trim();
    const duplicateNames = getDuplicateNames(lobby);
    if (duplicateNames.includes(normalizedName)) {
      errors.push('Name is already taken');
    }
  }

  if (!slot.token) {
    errors.push('Token is required');
  } else if (!isTokenAvailable(lobby, slot.token)) {
    const currentSlot = lobby.playerSlots.find(s => s.id === slot.id);
    if (!currentSlot || currentSlot.token !== slot.token) {
      errors.push('Token is already assigned to another player');
    }
  }

  if (!slot.color || slot.color.trim() === '') {
    errors.push('Color is required');
  } else if (!isColorAvailable(lobby, slot.color)) {
    const currentSlot = lobby.playerSlots.find(s => s.id === slot.id);
    if (!currentSlot || currentSlot.color !== slot.color) {
      errors.push('Color is already used by another player');
    }
  }

  if (slot.type === 'human' && !slot.isReady) {
    if (errors.length === 0) {
      warnings.push('Mark as ready to start game');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}



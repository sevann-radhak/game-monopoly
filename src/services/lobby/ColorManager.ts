import type { LobbyConfig } from '../../types';

export function validateColorUniqueness(lobby: LobbyConfig): boolean {
  const colors = lobby.playerSlots
    .map(slot => slot.color)
    .filter((color): color is string => color !== undefined && color.trim() !== '');

  const uniqueColors = new Set(colors);
  return uniqueColors.size === colors.length;
}

export function isColorAvailable(lobby: LobbyConfig, color: string): boolean {
  const usedColors = lobby.playerSlots
    .map(slot => slot.color)
    .filter((c): c is string => c !== undefined && c.trim() !== '');

  return !usedColors.includes(color);
}

export function getDuplicateColors(lobby: LobbyConfig): string[] {
  const colorCounts = new Map<string, number>();
  
  lobby.playerSlots.forEach(slot => {
    if (slot.color) {
      colorCounts.set(slot.color, (colorCounts.get(slot.color) || 0) + 1);
    }
  });

  const duplicates: string[] = [];
  colorCounts.forEach((count, color) => {
    if (count > 1) {
      duplicates.push(color);
    }
  });

  return duplicates;
}

export function getDuplicateNames(lobby: LobbyConfig): string[] {
  const nameCounts = new Map<string, number>();
  
  lobby.playerSlots.forEach(slot => {
    if (slot.name) {
      const normalizedName = slot.name.toLowerCase().trim();
      nameCounts.set(normalizedName, (nameCounts.get(normalizedName) || 0) + 1);
    }
  });

  const duplicates: string[] = [];
  nameCounts.forEach((count, name) => {
    if (count > 1) {
      duplicates.push(name);
    }
  });

  return duplicates;
}


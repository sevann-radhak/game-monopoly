import type { PlayerSlot, TokenId } from '../../types';
import { ALL_TOKENS } from '../../types/tokens';
import { getRandomPersonality } from '../../types/botPersonality';

const BOT_NAMES = [
  'Alex',
  'Sam',
  'Jordan',
  'Taylor',
  'Morgan',
  'Casey',
  'Riley',
  'Quinn',
  'Avery',
  'Blake',
  'Cameron',
  'Dakota',
  'Emery',
  'Finley',
  'Harper',
];

let botNameIndex = 0;

export function createHumanSlot(
  name: string,
  color: string,
  token: TokenId
): PlayerSlot {
  return {
    id: generateSlotId(),
    type: 'human',
    name: name.trim(),
    color,
    token,
    isReady: false,
  };
}

export function createBotSlot(
  name?: string,
  color?: string,
  token?: TokenId,
  personality?: string
): PlayerSlot {
  const botName = name || generateBotName();
  const botColor = color || getRandomColor();
  const botToken = token || getRandomToken();
  const botPersonality = personality || getRandomPersonality();

  return {
    id: generateSlotId(),
    type: 'bot',
    name: botName,
    color: botColor,
    token: botToken,
    isReady: true,
    botPersonality,
  };
}

export function generateBotName(): string {
  const name = BOT_NAMES[botNameIndex % BOT_NAMES.length];
  botNameIndex++;
  return name;
}

function generateSlotId(): string {
  return `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getRandomColor(): string {
  const colors = [
    '#dc2626',
    '#1f2937',
    '#9ca3af',
    '#78350f',
    '#16a34a',
    '#2563eb',
    '#a16207',
    '#ea580c',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomToken(): TokenId {
  const randomIndex = Math.floor(Math.random() * ALL_TOKENS.length);
  return ALL_TOKENS[randomIndex].id;
}


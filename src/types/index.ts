export type PlayerId = string;
export type PropertyId = string;

export const PropertyColor = {
  BROWN: 'brown',
  LIGHT_BLUE: 'light_blue',
  PINK: 'pink',
  ORANGE: 'orange',
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
  DARK_BLUE: 'dark_blue',
  STATION: 'station',
  UTILITY: 'utility',
  NONE: 'none'
} as const;

export type PropertyColor = typeof PropertyColor[keyof typeof PropertyColor];

export const SpaceType = {
  PROPERTY: 'property',
  ACTION: 'action',
  CORNER: 'corner'
} as const;

export type SpaceType = typeof SpaceType[keyof typeof SpaceType];

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  position: number; // 0-39
  color?: PropertyColor;
  price?: number;
  rent?: number[]; // [Base, 1House, ..., Hotel]
  houseCost?: number;
  hotelCost?: number;
  owner?: PlayerId;
  mortgaged?: boolean;
  houses?: number; // 0-4, 5=Hotel
}

export interface Player {
  id: PlayerId;
  name: string;
  color: string; // Token color
  money: number;
  position: number;
  isInJail: boolean;
  jailTurns: number;
  properties: PropertyId[];
  getOutOfJailFreeCards: number;
}

export interface GameState {
  players: Player[];
  currentPlayerId: PlayerId;
  board: Space[];
  dice: [number, number];
  doublesCount: number;
  gameStatus: 'waiting' | 'playing' | 'ended';
  turnPhase: 'roll' | 'action' | 'end'; // e.g. waiting for roll, moving/acting, waiting to end turn
  lastAction?: string; // Log description
}

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

export type CardType = 'chance' | 'community_chest';

export interface Card {
  id: string;
  type: CardType;
  text: string;
  effect: CardEffect;
}

export type CardEffect = 
  | { type: 'MOVE_TO', position: number, passGo?: boolean }
  | { type: 'MOVE_RELATIVE', amount: number }
  | { type: 'COLLECT', amount: number }
  | { type: 'PAY', amount: number }
  | { type: 'COLLECT_FROM_PLAYERS', amount: number }
  | { type: 'PAY_PLAYERS', amount: number }
  | { type: 'STREET_REPAIRS', houseCost: number, hotelCost: number }
  | { type: 'GO_TO_JAIL' }
  | { type: 'GET_OUT_OF_JAIL_FREE' }
  | { type: 'MOVE_NEAREST', target: 'station' | 'utility' };

export interface Player {
  id: PlayerId;
  name: string;
  type: 'human' | 'bot'; // Agent Type
  color: string; // Token color
  money: number;
  position: number;
  isInJail: boolean;
  jailTurns: number;
  properties: PropertyId[];
  getOutOfJailFreeCards: number;
}

export interface AuctionState {
  propertyId: string;
  highestBid: number;
  highestBidderId: PlayerId | null;
  bidders: PlayerId[];
  currentBidderIndex: number;
  timeLeft?: number; // 5 seconds timer
}

export interface TradeSide {
  money: number;
  properties: PropertyId[];
}

export interface TradeOffer {
  fromPlayerId: PlayerId;
  toPlayerId: PlayerId;
  offering: TradeSide;
  requesting: TradeSide;
}

export interface GameState {
  players: Player[];
  currentPlayerId: PlayerId;
  board: Space[];
  dice: [number, number];
  doublesCount: number;
  gameStatus: 'waiting' | 'playing' | 'ended';
  turnPhase: 'roll' | 'action' | 'card' | 'end' | 'auction' | 'trade' | 'ended'; 
  lastAction?: string; 
  chanceDeck: Card[];
  communityChestDeck: Card[];
  activeCard?: Card;
  auction?: AuctionState;
  activeTrade?: TradeOffer;
  winnerId?: PlayerId;
  lastMoveType?: 'forward' | 'backward' | 'jail';
  jailSource?: number;
}


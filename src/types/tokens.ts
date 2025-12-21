export const OFFICIAL_TOKENS = {
  RACECAR: { id: 'racecar', name: 'Racecar', color: '#dc2626' },
  TOP_HAT: { id: 'top_hat', name: 'Top Hat', color: '#1f2937' },
  THIMBLE: { id: 'thimble', name: 'Thimble', color: '#9ca3af' },
  BOOT: { id: 'boot', name: 'Boot', color: '#78350f' },
  WHEELBARROW: { id: 'wheelbarrow', name: 'Wheelbarrow', color: '#16a34a' },
  BATTLESHIP: { id: 'battleship', name: 'Battleship', color: '#2563eb' },
  DOG: { id: 'dog', name: 'Dog', color: '#a16207' },
  CAT: { id: 'cat', name: 'Cat', color: '#ea580c' },
} as const;

export type TokenId = typeof OFFICIAL_TOKENS[keyof typeof OFFICIAL_TOKENS]['id'];

export interface Token {
  id: TokenId;
  name: string;
  color: string;
}

export const ALL_TOKENS: Token[] = Object.values(OFFICIAL_TOKENS);

export const getTokenById = (id: TokenId): Token | undefined => {
  return ALL_TOKENS.find(token => token.id === id);
};

export const getAvailableTokens = (usedTokenIds: TokenId[]): Token[] => {
  return ALL_TOKENS.filter(token => !usedTokenIds.includes(token.id));
};

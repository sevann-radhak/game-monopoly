export type BotPersonality = 'aggressive' | 'conservative' | 'balanced' | 'random';

export interface BotPersonalityConfig {
  personality: BotPersonality;
  name: string;
  description: string;
  traits: {
    riskTolerance: number;
    propertyAcquisition: number;
    buildingStrategy: number;
    tradingFrequency: number;
  };
}

export const BOT_PERSONALITIES: Record<BotPersonality, BotPersonalityConfig> = {
  aggressive: {
    personality: 'aggressive',
    name: 'Aggressive',
    description: 'Takes risks, buys properties aggressively, builds quickly',
    traits: {
      riskTolerance: 0.8,
      propertyAcquisition: 0.9,
      buildingStrategy: 0.8,
      tradingFrequency: 0.7,
    },
  },
  conservative: {
    personality: 'conservative',
    name: 'Conservative',
    description: 'Plays safe, saves money, builds slowly',
    traits: {
      riskTolerance: 0.2,
      propertyAcquisition: 0.4,
      buildingStrategy: 0.3,
      tradingFrequency: 0.2,
    },
  },
  balanced: {
    personality: 'balanced',
    name: 'Balanced',
    description: 'Moderate risk-taking, balanced strategy',
    traits: {
      riskTolerance: 0.5,
      propertyAcquisition: 0.6,
      buildingStrategy: 0.5,
      tradingFrequency: 0.5,
    },
  },
  random: {
    personality: 'random',
    name: 'Random',
    description: 'Unpredictable decisions',
    traits: {
      riskTolerance: 0.5,
      propertyAcquisition: 0.5,
      buildingStrategy: 0.5,
      tradingFrequency: 0.5,
    },
  },
};

export function getPersonalityByName(name: string): BotPersonalityConfig | undefined {
  const entry = Object.entries(BOT_PERSONALITIES).find(
    ([_, config]) => config.name.toLowerCase() === name.toLowerCase()
  );
  return entry ? entry[1] : undefined;
}

export function getRandomPersonality(): BotPersonality {
  const personalities: BotPersonality[] = ['aggressive', 'conservative', 'balanced', 'random'];
  return personalities[Math.floor(Math.random() * personalities.length)];
}



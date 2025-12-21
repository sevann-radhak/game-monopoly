import type { Card } from "../types";

export const CHANCE_CARDS: Card[] = [
  { id: 'ch_go', type: 'chance', text: 'Advance to GO (Collect $200)', effect: { type: 'MOVE_TO', position: 0, passGo: true } },
  { id: 'ch_illinois', type: 'chance', text: 'Advance to Illinois Avenue. If you pass GO, collect $200', effect: { type: 'MOVE_TO', position: 24, passGo: true } },
  { id: 'ch_stcharles', type: 'chance', text: 'Advance to St. Charles Place. If you pass GO, collect $200', effect: { type: 'MOVE_TO', position: 11, passGo: true } },
  { id: 'ch_utility', type: 'chance', text: 'Advance to the nearest Utility. If unowned, you may buy it from the Bank. If owned, throw dice and pay owner 10 times the amount thrown.', effect: { type: 'MOVE_NEAREST', target: 'utility' } },
  { id: 'ch_railroad', type: 'chance', text: 'Advance to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which they are otherwise entitled.', effect: { type: 'MOVE_NEAREST', target: 'station' } },
  { id: 'ch_bank_dividend', type: 'chance', text: 'Bank pays you dividend of $50', effect: { type: 'COLLECT', amount: 50 } },
  { id: 'ch_jail_free', type: 'chance', text: 'Get Out of Jail Free', effect: { type: 'GET_OUT_OF_JAIL_FREE' } },
  { id: 'ch_back3', type: 'chance', text: 'Go Back 3 Spaces', effect: { type: 'MOVE_RELATIVE', amount: -3 } },
  { id: 'ch_jail', type: 'chance', text: 'Go to Jail. Go directly to Jail, do not pass GO, do not collect $200', effect: { type: 'GO_TO_JAIL' } },
  { id: 'ch_repairs', type: 'chance', text: 'Make general repairs on all your property. For each house pay $25. For each hotel pay $100', effect: { type: 'STREET_REPAIRS', houseCost: 25, hotelCost: 100 } },
  { id: 'ch_speeding', type: 'chance', text: 'Speeding fine $15', effect: { type: 'PAY', amount: 15 } },
  { id: 'ch_reading', type: 'chance', text: 'Take a trip to Reading Railroad. If you pass GO, collect $200', effect: { type: 'MOVE_TO', position: 5, passGo: true } },
  { id: 'ch_boardwalk', type: 'chance', text: 'Advance to Boardwalk', effect: { type: 'MOVE_TO', position: 39 } },
  { id: 'ch_chairman', type: 'chance', text: 'You have been elected Chairman of the Board. Pay each player $50', effect: { type: 'PAY_PLAYERS', amount: 50 } },
  { id: 'ch_building_loan', type: 'chance', text: 'Your building loan matures. Collect $150', effect: { type: 'COLLECT', amount: 150 } },
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
  { id: 'cc_go', type: 'community_chest', text: 'Advance to GO (Collect $200)', effect: { type: 'MOVE_TO', position: 0, passGo: true } },
  { id: 'cc_bank_error', type: 'community_chest', text: 'Bank error in your favor. Collect $200', effect: { type: 'COLLECT', amount: 200 } },
  { id: 'cc_doctor', type: 'community_chest', text: "Doctor's fee. Pay $50", effect: { type: 'PAY', amount: 50 } },
  { id: 'cc_sale', type: 'community_chest', text: 'From sale of stock you get $50', effect: { type: 'COLLECT', amount: 50 } },
  { id: 'cc_jail_free', type: 'community_chest', text: 'Get Out of Jail Free', effect: { type: 'GET_OUT_OF_JAIL_FREE' } },
  { id: 'cc_jail', type: 'community_chest', text: 'Go to Jail. Go directly to jail, do not pass GO, do not collect $200', effect: { type: 'GO_TO_JAIL' } },
  { id: 'cc_holiday', type: 'community_chest', text: 'Holiday fund matures. Receive $100', effect: { type: 'COLLECT', amount: 100 } },
  { id: 'cc_tax_refund', type: 'community_chest', text: 'Income tax refund. Collect $20; $20', effect: { type: 'COLLECT', amount: 20 } },
  { id: 'cc_birthday', type: 'community_chest', text: "It is your birthday. Collect $10 from every player", effect: { type: 'COLLECT_FROM_PLAYERS', amount: 10 } },
  { id: 'cc_life_insurance', type: 'community_chest', text: 'Life insurance matures. Collect $100', effect: { type: 'COLLECT', amount: 100 } },
  { id: 'cc_hospital', type: 'community_chest', text: 'Hospital fees. Pay $100', effect: { type: 'PAY', amount: 100 } },
  { id: 'cc_school', type: 'community_chest', text: 'School fees. Pay $50', effect: { type: 'PAY', amount: 50 } },
  { id: 'cc_consultancy', type: 'community_chest', text: 'Receive $25 consultancy fee', effect: { type: 'COLLECT', amount: 25 } },
  { id: 'cc_repairs', type: 'community_chest', text: 'You are assessed for street repairs. $40 per house. $115 per hotel', effect: { type: 'STREET_REPAIRS', houseCost: 40, hotelCost: 115 } },
  { id: 'cc_beauty', type: 'community_chest', text: 'You have won second prize in a beauty contest. Collect $10', effect: { type: 'COLLECT', amount: 10 } },
  { id: 'cc_inheritance', type: 'community_chest', text: 'You inherit $100', effect: { type: 'COLLECT', amount: 100 } },
];

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

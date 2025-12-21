
import type { TradeOffer, Player, Space } from "../../../types";
import { SpaceType } from "../../../types";

export const isValidTrade = (
    trade: TradeOffer,
    players: Player[],
    board: Space[]
): { isValid: boolean; reason?: string } => {
    
    // 1. Verify Players
    const fromPlayer = players.find(p => p.id === trade.fromPlayerId);
    const toPlayer = players.find(p => p.id === trade.toPlayerId); // Corrected from fromPlayerId to toPlayerId

    if (!fromPlayer || !toPlayer) {
        return { isValid: false, reason: "Invalid players involved in trade." };
    }

    if (fromPlayer.id === toPlayer.id) {
         return { isValid: false, reason: "Cannot trade with yourself." };
    }

    // 2. Verify Offer Money
    if (trade.offering.money < 0 || trade.requesting.money < 0) {
        return { isValid: false, reason: "Cannot trade negative amounts." };
    }

    if (fromPlayer.money < trade.offering.money) {
        return { isValid: false, reason: `${fromPlayer.name} does not have enough money ($${trade.offering.money}).` };
    }

    // Note: We don't necessarily check toPlayer money for REQUESTED amount here if we consider negotiation phase, 
    // but for ACCEPTING, we must. Assuming this validates the trade proposal/execution feasibility.
    // If this is just "Can I propose this?", then toPlayer money check might be skippable, but for strictness let's check.
    // Actually, you can PROPOSE a trade even if they don't have money, they just can't accept it.
    // BUT the prompt implies specific logic for "Create Trade" vs "Accept Trade".
    // Let's assume this validates "Can this trade be executed RIGHT NOW".
    
    if (toPlayer.money < trade.requesting.money) {
        return { isValid: false, reason: `${toPlayer.name} does not have enough money ($${trade.requesting.money}).` };
    }

    // 3. Verify Properties Checks helper
    const checkProperties = (propertyIds: string[], ownerId: string, ownerName: string): { valid: boolean; reason?: string } => {
        for (const propId of propertyIds) {
            const prop = board.find(s => s.id === propId);
            if (!prop) {
                return { valid: false, reason: `Property ${propId} not found.` };
            }
            if (prop.owner !== ownerId) {
                return { valid: false, reason: `${ownerName} does not own ${prop.name}.` };
            }

            // Building Check: Cannot trade if any property in color group has buildings
            if (prop.color && prop.type === SpaceType.PROPERTY) {
                const colorGroup = board.filter(s => s.type === SpaceType.PROPERTY && s.color === prop.color);
                const hasBuildings = colorGroup.some(s => (s.houses || 0) > 0);
                
                if (hasBuildings) {
                    return { valid: false, reason: `Cannot trade ${prop.name} because there are buildings in its color group. Sell them first.` };
                }
            }
        }
        return { valid: true };
    };

    const offerCheck = checkProperties(trade.offering.properties, fromPlayer.id, fromPlayer.name);
    if (!offerCheck.valid) return { isValid: false, reason: offerCheck.reason };

    const reqCheck = checkProperties(trade.requesting.properties, toPlayer.id, toPlayer.name);
    if (!reqCheck.valid) return { isValid: false, reason: reqCheck.reason };

    return { isValid: true };
};

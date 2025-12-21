import type { TradeOffer, Player, Space } from "../../types";
import { PropertyColor, SpaceType } from "../../types";

/**
 * TRADE EVALUATOR
 * 
 * Evaluates trade offers from the Bot's perspective.
 * Returns a score and decision (accept/reject/counter).
 */

interface TradeEvaluation {
    score: number; // Positive = good for bot, Negative = bad for bot
    decision: 'accept' | 'reject' | 'counter';
    reason: string;
    counterOffer?: TradeOffer;
}

const getPropertyValue = (property: Space, board: Space[], ownerId: string): number => {
    if (!property.price) return 0;
    
    let value = property.price;
    
    // Bonus for monopoly potential
    if (property.color && property.color !== PropertyColor.NONE) {
        const colorGroup = board.filter(s => 
            s.type === SpaceType.PROPERTY && s.color === property.color
        );
        const ownedInGroup = colorGroup.filter(s => s.owner === ownerId).length;
        const totalInGroup = colorGroup.length;
        
        // If this completes a monopoly, huge value
        if (ownedInGroup === totalInGroup - 1) {
            value *= 3;
        } else if (ownedInGroup > 0) {
            value *= 1.5; // Partial set bonus
        }
    }
    
    // Penalty if mortgaged
    if (property.mortgaged) {
        value *= 0.5;
    }
    
    // Bonus for houses
    if (property.houses && property.houses > 0) {
        value += (property.houses || 0) * (property.houseCost || 0);
    }
    
    return value;
};

const calculateNetValue = (
    trade: TradeOffer,
    botPlayer: Player,
    board: Space[]
): number => {
    // What bot gives away
    let giving = trade.offering.money;
    trade.offering.properties.forEach(propId => {
        const prop = board.find(s => s.id === propId);
        if (prop) {
            giving += getPropertyValue(prop, board, botPlayer.id);
        }
    });
    
    // What bot receives
    let receiving = trade.requesting.money;
    trade.requesting.properties.forEach(propId => {
        const prop = board.find(s => s.id === propId);
        if (prop) {
            receiving += getPropertyValue(prop, board, botPlayer.id);
        }
    });
    
    return receiving - giving;
};

export const evaluateTrade = (
    trade: TradeOffer,
    botPlayer: Player,
    board: Space[]
): TradeEvaluation => {
    
    const netValue = calculateNetValue(trade, botPlayer, board);
    
    // Decision thresholds
    if (netValue > 200) {
        return {
            score: netValue,
            decision: 'accept',
            reason: 'Great deal! This trade benefits me significantly.'
        };
    }
    
    if (netValue > 0) {
        return {
            score: netValue,
            decision: 'accept',
            reason: 'Fair trade. I accept.'
        };
    }
    
    if (netValue > -100) {
        // Close to fair, maybe counter
        // Simple counter: Ask for more money
        const counterOffer: TradeOffer = {
            ...trade,
            requesting: {
                ...trade.requesting,
                money: trade.requesting.money + 100
            }
        };
        
        return {
            score: netValue,
            decision: 'counter',
            reason: 'Close, but I need a bit more to make this work.',
            counterOffer
        };
    }
    
    return {
        score: netValue,
        decision: 'reject',
        reason: 'This trade doesn\'t benefit me. I must decline.'
    };
};

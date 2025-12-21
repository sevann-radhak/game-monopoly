import { ACTION_TYPES, type GameAction } from "../GameEngine";
import type { GameState } from "../../types";
import { evaluateTrade } from "./TradeEvaluator";

/**
 * BOT AGENT BRAIN
 * 
 * This module is a pure function "Brain" that decides the next move based on the current GameState.
 * It is completely decoupled from React or the UI.
 * 
 * Architecture:
 * - Input: GameState
 * - Output: GameAction | null
 * 
 * Design Principles:
 * - Deterministic (or controlled randomness)
 * - Zero Side Effects
 * - Future-proof for server-side execution
 */

export const getBotAction = (gameState: GameState): GameAction | null => {
    const { currentPlayerId, turnPhase, board, players } = gameState;
    const currentPlayer = players.find(p => p.id === currentPlayerId);

    if (!currentPlayer || currentPlayer.type !== 'bot') return null;

    // --- PHASE 1: PRE-ROLL ---
    if (turnPhase === 'roll') {
        // Simple logic: Just roll the dice
        // Future: Check if we want to use a "Get Out of Jail" card before rolling if in jail
        if (currentPlayer.isInJail) {
             // Heuristic: If we have lots of money, pay the fine to get out immediately and move
             if (currentPlayer.money > 1000) {
                 return { type: ACTION_TYPES.PAY_JAIL_FINE };
             }
             // Heuristic: If we have a card, use it
             if (currentPlayer.getOutOfJailFreeCards > 0) {
                 return { type: ACTION_TYPES.USE_JAIL_CARD };
             }
        }
        return { type: ACTION_TYPES.ROLL_DICE };
    }

    // --- PHASE 2: ACTION (After landing) ---
    if (turnPhase === 'action') {
        const currentSpace = board.find(s => s.position === currentPlayer.position);
        
        // 1. BUY PROPERTY
        if (currentSpace && currentSpace.type === 'property' && !currentSpace.owner) {
            const price = currentSpace.price || 0;
            const money = currentPlayer.money;

            // Heuristic: Buy if we have enough money + a safety buffer ($300)
            // Or if it completes a color group (Advanced logic later)
            if (money >= price + 300) {
                return { type: ACTION_TYPES.BUY_PROPERTY };
            } else {
                 return { type: ACTION_TYPES.DECLINE_PURCHASE };
            }
        }

        // 2. END TURN (Default fallback)
        // If we landed on an owned property, rent is auto-paid by the engine reduction (usually),
        // or effectively we just need to end turn.
        // Also check if we rolled doubles (and aren't in jail), we might need to roll again?
        // But the GameEngine sets phase to 'roll' if doubles happened. 
        // So if phase is 'action', it means we are waiting for a decision or just need to end.
        
        // Ensure we don't have pending actions
        // If we just bought, phase might be 'end' or logic handles it.
        // Wait, looking at engine:
        // - After buy/pass -> 'end' phase? Or stays in 'action'?
        // The Engine sets turnPhase to 'end' after BUY.
        // So if we are in 'action', it means we HAVE NOT decided on the property yet, OR it's a non-property space.
        
        return { type: ACTION_TYPES.END_TURN };
    }

    // --- PHASE 3: AUCTION ---
    if (turnPhase === 'auction' && gameState.auction) {
        const { auction } = gameState;
        // Check if it's our turn to bid
        const currentBidderId = auction.bidders[auction.currentBidderIndex];
        if (currentBidderId === currentPlayer.id) {
             const property = board.find(s => s.id === auction.propertyId);
             const valuation = (property?.price || 0) * 0.8; // conservative valuation
             const maxBid = currentPlayer.money * 0.5; // Don't spend more than half money
             const currentBid = auction.highestBid;
             const nextBid = currentBid + 10; // Min increment

             // If price is good and we have money, bid
             if (nextBid <= valuation && nextBid <= maxBid) {
                 return { type: ACTION_TYPES.PLACE_BID, amount: nextBid };
             } else {
                 return { type: ACTION_TYPES.FOLD_AUCTION };
             }
        }
    }

     // --- PHASE 4: END TURN ---
    if (turnPhase === 'end') {
         // Logic to build houses could go here before ending
         return { type: ACTION_TYPES.END_TURN };
    }

    // --- PHASE 5: TRADE ---
    // Respond to any active trade offer directed at this bot
    if (gameState.activeTrade && gameState.activeTrade.toPlayerId === currentPlayer.id) {
         const evaluation = evaluateTrade(gameState.activeTrade, currentPlayer, board);
         
         console.log(`[BOT TRADE EVAL] Score: ${evaluation.score}, Decision: ${evaluation.decision}`);
         
         if (evaluation.decision === 'accept') {
             return { type: ACTION_TYPES.ACCEPT_TRADE };
         } else if (evaluation.decision === 'counter' && evaluation.counterOffer) {
             // For now, just reject (counter-offer requires new action type)
             // TODO: Implement COUNTER_TRADE action
             return { type: ACTION_TYPES.REJECT_TRADE };
         } else {
             return { type: ACTION_TYPES.REJECT_TRADE };
         }
    }

    return null;
}

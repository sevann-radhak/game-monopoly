import { useEffect, useRef } from 'react';
import type { GameState } from '../types';
import type { GameAction } from '../engine/GameEngine';
import { getBotAction } from '../engine/agents/BotAgent';

/**
 * useGameLoop Hook
 * 
 * Orchestrates the game flow.
 * - Observes Game State
 * - Detects if current player is a Bot
 * - Delays action to simulate thinking (UX)
 * - Dispatches Bot Action
 * 
 * This is the heartbeat of the "Agents" architecture.
 */
export const useGameLoop = (
    gameState: GameState, 
    dispatch: React.Dispatch<GameAction>,
    setIsRolling: (rolling: boolean) => void
) => {
    
    // Safety ref to prevent double-firing in Strict Mode or rapid state changes
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const { players, currentPlayerId, gameStatus } = gameState;

        if (gameStatus !== 'playing') return;

        const currentPlayer = players.find(p => p.id === currentPlayerId);
        
        // --- BOT TURN LOGIC ---
        if (currentPlayer && currentPlayer.type === 'bot') {
            
            // Clear any existing timer to debounce
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                const action = getBotAction(gameState);
                
                if (action) {
                    console.log(`[BOT ${currentPlayer.name}] Decided:`, action.type);
                    
                    if (action.type === 'ROLL_DICE') {
                        // Trigger Rolling Animation
                        setIsRolling(true);
                        setTimeout(() => {
                            dispatch(action);
                            setIsRolling(false);
                        }, 1000);
                    } else {
                        // Instant Action (or normal delay)
                        dispatch(action);
                    }
                }
            }, 1000 + Math.random() * 1000); // 1.0s - 2.0s "Thinking" time
        }

        // --- BOT TRADE RESPONSE LOGIC ---
        // Check if there's an active trade offer directed AT a bot (even if it's not their turn)
        if (gameState.activeTrade) {
            const tradeRecipient = players.find(p => p.id === gameState.activeTrade!.toPlayerId);
            
            if (tradeRecipient && tradeRecipient.type === 'bot') {
                // Clear any existing timer
                if (timeoutRef.current) clearTimeout(timeoutRef.current);

                timeoutRef.current = setTimeout(() => {
                    // Create a temporary game state where the Bot is the "current player" for evaluation
                    const botContextState: GameState = {
                        ...gameState,
                        currentPlayerId: tradeRecipient.id
                    };
                    
                    const action = getBotAction(botContextState);
                    
                    if (action) {
                        console.log(`[BOT ${tradeRecipient.name}] Trade Response:`, action.type);
                        dispatch(action);
                    }
                }, 1500 + Math.random() * 1000); // 1.5s - 2.5s to "think" about trade
            }
        }

        // Cleanup on unmount or state change
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };

    }, [gameState, dispatch, setIsRolling]); 
    // Dependencies: Full gameState to ensure Bot always has latest data
};

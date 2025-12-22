import React, { useState, useEffect, useRef } from 'react';
import styles from '../Board/Board.module.css';
import type { TokenId } from '../../types';
import { getTokenById } from '../../types/tokens';

interface PlayerTokenProps {
  name: string;
  color: string;
  token: TokenId;
  position: number; // The target position from game state
  index: number; // Index for offset
  getGridStyle: (space: { position: number, id?: string }) => { gridRow: number; gridColumn: number };
  moveType?: 'forward' | 'backward' | 'jail';
  jailSource?: number;
}

export const PlayerToken: React.FC<PlayerTokenProps> = ({
  name,
  color,
  token,
  position,
  index,
  getGridStyle,
  moveType = 'forward',
  jailSource,
}) => {
  const getTokenEmoji = (tokenId: TokenId): string => {
    const emojiMap: Record<TokenId, string> = {
      racecar: '🏎️',
      top_hat: '🎩',
      thimble: '🧵',
      boot: '👢',
      wheelbarrow: '🛒',
      battleship: '🚢',
      dog: '🐕',
      cat: '🐱',
    };
    return emojiMap[tokenId] || '🎯';
  };
  const [visualPosition, setVisualPosition] = useState(position);
  const isMoving = useRef(false);
  const queue = useRef<number[]>([]);
  const lastPositionRef = useRef(position);
  const lastJailSourceRef = useRef<number | undefined>(undefined);
  const lastMoveTypeRef = useRef<'forward' | 'backward' | 'jail'>('forward');

  // When target position changes, add to queue
  useEffect(() => {
    // Skip if we're currently moving - let the queue finish first
    if (isMoving.current) return;
    
    const positionChanged = position !== lastPositionRef.current;
    const jailSourceChanged = jailSource !== lastJailSourceRef.current;
    const moveTypeChanged = moveType !== lastMoveTypeRef.current;
    
    // Special handling for Go To Jail from space 30 (landing on Go To Jail)
    if (jailSource === 30 && moveType === 'jail' && position === 10) {
      // Clear any existing queue and calculate path from current visual position
      queue.current = [];
      isMoving.current = false;
      
      // Calculate path: from visualPosition to 30 (if not already there), then to 10
      const path: number[] = [];
      let current = visualPosition;
      
      // If we haven't reached 30 yet, move forward to 30
      if (current !== 30) {
        // Check if we're before 30 (normal case) or if we've wrapped around
        const needsForwardTo30 = current < 30 || (current > 30 && current < 40);
        if (needsForwardTo30) {
          while (current !== 30) {
            current = (current + 1) % 40;
            if (current === 30) {
              path.push(current);
              break;
            }
            path.push(current);
          }
        }
      }
      
      // Now move backward from 30 to 10
      current = 30;
      while (current !== 10) {
        current = (current - 1 + 40) % 40;
        path.push(current);
        if (current === 10) break;
      }
      
      queue.current = path;
      lastPositionRef.current = position;
      lastJailSourceRef.current = jailSource;
      lastMoveTypeRef.current = moveType;
      processQueue();
      return;
    }
    
    // Special handling for Go To Jail from card (jailSource is undefined)
    if (moveType === 'jail' && jailSource === undefined && position === 10) {
      // Clear any existing queue - card sends directly to jail
      queue.current = [];
      isMoving.current = false;
      
      // Calculate shortest path directly to position 10
      const path: number[] = [];
      let current = visualPosition;
      
      // Calculate shortest path: forward or backward?
      const forwardDistance = (10 - current + 40) % 40;
      const backwardDistance = (current - 10 + 40) % 40;
      
      if (forwardDistance <= backwardDistance) {
        // Move forward
        while (current !== 10) {
          current = (current + 1) % 40;
          path.push(current);
          if (current === 10) break;
        }
      } else {
        // Move backward
        while (current !== 10) {
          current = (current - 1 + 40) % 40;
          path.push(current);
          if (current === 10) break;
        }
      }
      
      queue.current = path;
      lastPositionRef.current = position;
      lastJailSourceRef.current = jailSource;
      lastMoveTypeRef.current = moveType;
      processQueue();
      return;
    }
    
    if (positionChanged || jailSourceChanged || moveTypeChanged) {
      // Calculate path from current visual position to target
      const path = calculatePath(visualPosition, position, moveType, jailSource);
      queue.current = [...queue.current, ...path];
      lastPositionRef.current = position;
      lastJailSourceRef.current = jailSource;
      lastMoveTypeRef.current = moveType;
      processQueue();
    }
  }, [position, moveType, jailSource]);

  const calculatePath = (start: number, end: number, type: 'forward' | 'backward' | 'jail', source?: number): number[] => {
    const path: number[] = [];
    let current = start;

    let isBackward = type === 'backward';
    
    if (type === 'jail' && source !== 30) {
        // Standard jail (3 doubles or card without source): Move in direction avoiding GO
        isBackward = end < current;
    } else if (type === 'forward') {
        isBackward = false;
    }

    if (isBackward) {
        while (current !== end) {
            current = (current - 1 + 40) % 40;
            path.push(current);
            if (current === end) break;
        }
    } else {
        while (current !== end) {
            current = (current + 1) % 40;
            path.push(current);
            if (current === end) break;
        }
    }
    
    return path;
  };

  const processQueue = async () => {
    if (isMoving.current || queue.current.length === 0) return;
    
    isMoving.current = true;
    
    let lastProcessedPosition = visualPosition;
    
    while (queue.current.length > 0) {
        const next = queue.current.shift();
        if (next !== undefined) {
            lastProcessedPosition = next;
            setVisualPosition(next);
            await new Promise(resolve => setTimeout(resolve, 150)); 
        }
    }
    
    // Ensure visual position matches final position after movement completes
    setVisualPosition(position);
    lastPositionRef.current = position;
    
    isMoving.current = false;
  };

  const { gridRow, gridColumn } = getGridStyle({ position: visualPosition });
  
  const cellPercent = 100 / 11;
  const top = (gridRow - 1) * cellPercent;
  const left = (gridColumn - 1) * cellPercent;
  
  const offset = index * 3;

  return (
    <div
      className={styles.playerToken}
      style={{
        top: `${top}%`,
        left: `${left}%`,
        backgroundColor: color,
        marginLeft: `calc(4.5% - 12px + ${offset}px)`,
        marginTop: `calc(4.5% - 10px + ${offset}px)`,
        transform: `translateZ(20px)`,
        transition: 'top 0.15s ease-in-out, left 0.15s ease-in-out', 
      }}
      title={name}
    >
      <span className={styles.tokenEmoji}>{getTokenEmoji(token)}</span>
    </div>
  );
};

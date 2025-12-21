import React, { useState, useEffect, useRef } from 'react';
import styles from '../Board/Board.module.css';

interface PlayerTokenProps {
  name: string;
  color: string;
  position: number; // The target position from game state
  index: number; // Index for offset
  getGridStyle: (space: { position: number, id?: string }) => { gridRow: number; gridColumn: number };
  moveType?: 'forward' | 'backward' | 'jail';
  jailSource?: number;
}

export const PlayerToken: React.FC<PlayerTokenProps> = ({
  name,
  color,
  position,
  index,
  getGridStyle,
  moveType = 'forward',
  jailSource,
}) => {
  const [visualPosition, setVisualPosition] = useState(position);
  const isMoving = useRef(false);
  const queue = useRef<number[]>([]);

  // When target position changes, add to queue
  useEffect(() => {
    if (position !== visualPosition) {
        // Calculate path
        const path = calculatePath(visualPosition, position, moveType, jailSource);
        queue.current = [...queue.current, ...path];
        processQueue();
    }
  }, [position, moveType, jailSource]);

  const calculatePath = (start: number, end: number, type: 'forward' | 'backward' | 'jail', source?: number): number[] => {
    const path: number[] = [];
    let current = start;

    let isBackward = type === 'backward';
    
    if (type === 'jail') {
        if (source === 30) {
            // Real Go To Jail: Forward to 30, then backward to 10
            // Forward to 30
            while (current !== 30) {
                current = (current + 1) % 40;
                path.push(current);
            }
            // Backward to 10
            while (current !== 10) {
                current = (current - 1 + 40) % 40;
                path.push(current);
            }
            return path;
        }

        // Standard jail (3 doubles or card without source): Move in direction avoiding GO
        isBackward = end < current;
    } else if (type === 'forward') {
        isBackward = false;
    }

    if (isBackward) {
        while (current !== end) {
            current = (current - 1 + 40) % 40;
            path.push(current);
        }
    } else {
        while (current !== end) {
            current = (current + 1) % 40;
            path.push(current);
        }
    }
    
    return path;
  };

  const processQueue = async () => {
    if (isMoving.current || queue.current.length === 0) return;
    
    isMoving.current = true;
    
    while (queue.current.length > 0) {
        const next = queue.current.shift();
        if (next !== undefined) {
            setVisualPosition(next);
            await new Promise(resolve => setTimeout(resolve, 150)); 
        }
    }
    
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
    />
  );
};

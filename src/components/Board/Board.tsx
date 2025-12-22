import React from 'react';
import type { GameState } from '../../types';
import { BoardSpace } from './BoardSpace';
import styles from './Board.module.css';
// import { PlayerToken } from '../Player/PlayerToken';
import { Dice } from '../Dice/Dice';
import { PlayerToken } from '../Player/PlayerToken';

interface BoardProps {
  gameState: GameState;
  isRolling: boolean;
  displayDice?: [number, number];
  focusedPropertyId?: string | null;
}

export const Board: React.FC<BoardProps> = ({ gameState, isRolling, displayDice, focusedPropertyId }) => {
  const playerIndexMap = React.useMemo(() => {
    const map = new Map<string, number>();
    gameState.players.forEach((player, index) => {
      map.set(player.id, index);
    });
    return map;
  }, [gameState.players]);
  const [rotation, setRotation] = React.useState({ x: 25, z: 0 }); // Tilt X slightly, rotate Z

  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const lastMousePos = React.useRef({ x: 0, y: 0 });

  // Debug: Log initial player positions on mount
  React.useEffect(() => {
    gameState.players.forEach(player => {
      const space = gameState.board.find(s => s.position === player.position);
      console.log(`[INIT] Player ${player.name}: position=${player.position}, space=${space?.name || 'NOT FOUND'}, spaceId=${space?.id || 'NOT FOUND'}`);
    });
  }, []); // Only on mount

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey || e.button === 1 || e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
    } else if (e.button === 0) {
      setIsDragging(true);
    }
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setPan(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
    } else if (isDragging) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setRotation(prev => ({
        x: Math.min(Math.max(prev.x - deltaY * 0.5, 0), 60), // Clamp tilt 0-60
        z: prev.z + deltaX * 0.5
      }));
    }
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(zoom + zoomFactor, 0.5), 2);
    
    if (newZoom !== zoom) {
      const zoomRatio = newZoom / zoom;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      setPan(prev => ({
        x: prev.x - (mouseX - centerX) * (1 - zoomRatio) / newZoom,
        y: prev.y - (mouseY - centerY) * (1 - zoomRatio) / newZoom
      }));
      
      setZoom(newZoom);
    }
  };

  // We need to map linear 0-39 index to grid placement
  // Grid 11x11.
  // Row 11 (Bottom): 10, 9, 8... 0 (Right to Left) -> Wait, 0 is Bottom Right? 
  // Standard: 
  // 0 (GO) -> Bottom Right (Row 11/11, Col 11/11)
  // 1-9 -> Bottom Row (Row 11, Col 10...2)
  // 10 (Jail/Visit) -> Bottom Left (Row 11, Col 1)
  // 11-19 -> Left Col (Row 10...2, Col 1)
  // 20 (Free Parking) -> Top Left (Row 1, Col 1)
  // 21-29 -> Top Row (Row 1, Col 2...10)
  // 30 (Go To Jail) -> Top Right (Row 1, Col 11)
  // 31-39 -> Right Col (Row 2...10, Col 11)

  const getGridStyle = (space: { position: number, id?: string }) => {
    const index = space.position;
    
    // Position-based calculation is the source of truth
    // This ensures position 0 (GO) always maps to row 11, col 11
    let row = 1;
    let col = 1;

    if (index === 0) { 
      // GO - Bottom Right corner (row 11, col 11)
      row = 11; 
      col = 11; 
    } else if (index > 0 && index < 10) { 
      // Bottom row (positions 1-9) - moving left from GO
      row = 11; 
      col = 11 - index; 
    } else if (index === 10) { 
      // Jail - Bottom Left corner
      row = 11; 
      col = 1; 
    } else if (index > 10 && index < 20) { 
      // Left column (positions 11-19) - moving up from Jail
      row = 11 - (index - 10); 
      col = 1; 
    } else if (index === 20) { 
      // Free Parking - Top Left corner
      row = 1; 
      col = 1; 
    } else if (index > 20 && index < 30) { 
      // Top row (positions 21-29) - moving right from Free Parking
      row = 1; 
      col = 1 + (index - 20); 
    } else if (index === 30) { 
      // Go To Jail - Top Right corner
      row = 1; 
      col = 11; 
    } else if (index > 30 && index < 40) { 
      // Right column (positions 31-39) - moving down from Go To Jail
      // Position 31 -> row 2, Position 39 -> row 10
      row = 1 + (index - 30); 
      col = 11; 
    }

    return { gridRow: row, gridColumn: col };
  };

  return (
    <div 
        className={styles.scene}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className={styles.boardContainer}
        style={{
            transform: `translate(${pan.x}px, ${pan.y}px) rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg) scale(${zoom})`,
            transformOrigin: 'center center'
        }}
      >
      <div className={styles.board}>
        {gameState.board.map((space) => {
           // We'll pass players from the parent loop actually, or here? 
           // The original code passed no players here, but separated them? 
           // Wait, original map passed empty players? 
           // Ah, checking original code...
           // Original loop:
           // {gameState.board.map((space) => {
           //    return (
           //      <div key={space.id} style={getGridStyle(space.position)} className={styles.gridCellWrapper}>
           //         <BoardSpace space={space} />
           //      </div>
           //    );
           // })}
           //
           // Players were rendered separately.
           // So I just need to add isFocused.

           const gridStyle = getGridStyle(space);
           return (
             <BoardSpace 
                key={space.id}
                space={space} 
                isFocused={focusedPropertyId === space.id}
                gridRow={gridStyle.gridRow}
                gridColumn={gridStyle.gridColumn}
                playerIndexMap={playerIndexMap}
                playersList={gameState.players.map(p => ({ id: p.id, color: p.color, name: p.name }))}
             />
           );
        })}
        
        {/* Render Players Overlay (Smooth Path Following) */}
        {gameState.players.map((player, index) => (
          <PlayerToken 
            key={player.id}
            name={player.name}
            color={player.color}
            token={player.token}
            position={player.position}
            index={index}
            getGridStyle={getGridStyle}
            moveType={gameState.currentPlayerId === player.id ? gameState.lastMoveType : 'forward'}
            jailSource={gameState.currentPlayerId === player.id ? gameState.jailSource : undefined}
          />
        ))}
        
        <div className={styles.centerBoard}>
           <h1 className={styles.title}>MONOPOLY</h1>
            <div 
               className={styles.diceContainer}
               style={{
                   transform: `translateZ(50px) rotateZ(${-rotation.z}deg) rotateX(${-rotation.x}deg)`
               }}
            >
              <Dice value={displayDice?.[0] ?? gameState.dice[0]} isRolling={isRolling} />
              <Dice value={displayDice?.[1] ?? gameState.dice[1]} isRolling={isRolling} />
            </div>
           
           {/* Temporary Controls moved to App usually, but for debug maybe here or in center? */}
           {/* We leave center for Logo/Dice/Chest/Chance */}
        </div>
      </div>
      </div>
    </div>
  );
};

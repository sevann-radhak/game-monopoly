# Session Service Architecture

## Overview

The Session Service provides an abstraction layer for managing game sessions and lobby state. It supports both local (single-player with bots) and future online multiplayer implementations.

## Interface

### SessionService

The `SessionService` interface defines the contract for session management:

```typescript
interface SessionService {
  createSession(config: LobbyConfig): Promise<string>;
  joinSession(sessionId: string, playerId: string): Promise<void>;
  leaveSession(sessionId: string, playerId: string): Promise<void>;
  updateLobby(sessionId: string, config: LobbyConfig): Promise<void>;
  subscribeToLobby(sessionId: string, callback: (config: LobbyConfig) => void): () => void;
  getLobby(sessionId: string): Promise<LobbyConfig | null>;
}
```

## Implementations

### LocalSessionService

The `LocalSessionService` is the current implementation for local gameplay:

- Stores sessions in-memory using a `Map`
- Provides real-time updates via subscription callbacks
- Emits events for session lifecycle
- Suitable for single-player with bots

### WebSocketSessionService (Future)

A future implementation will use WebSockets for online multiplayer:

- Connects to a game server
- Synchronizes state across all clients
- Handles network errors and reconnection
- Implements conflict resolution

## Events

The Session Service emits the following events:

### Lobby Events

- `lobby_created`: A new lobby session was created
- `player_joined`: A player joined the session
- `player_left`: A player left the session
- `lobby_updated`: The lobby configuration was updated
- `game_started`: The game started from the lobby

### Event Structure

```typescript
type LobbyEvent =
  | { type: 'lobby_created'; sessionId: string; config: LobbyConfig }
  | { type: 'player_joined'; sessionId: string; playerId: string }
  | { type: 'player_left'; sessionId: string; playerId: string }
  | { type: 'lobby_updated'; sessionId: string; config: LobbyConfig }
  | { type: 'game_started'; sessionId: string; config: LobbyConfig };
```

## State Synchronization

### Local Mode

In local mode, state is synchronized immediately:

1. Client calls `updateLobby()`
2. LocalSessionService updates in-memory state
3. All subscribers are notified synchronously
4. Event is emitted

### Online Mode (Future)

In online mode, state synchronization follows this flow:

1. Client calls `updateLobby()`
2. Change is sent to server via WebSocket
3. Server validates and applies change
4. Server broadcasts update to all clients
5. Clients receive update and notify subscribers
6. Event is emitted

### Conflict Resolution

For online mode, conflicts are resolved using:

- **Last Write Wins**: Most recent update takes precedence
- **Server Authority**: Server validates all changes
- **Optimistic Updates**: UI updates immediately, rolls back on error

## Message Protocol (Future)

### WebSocket Message Format

```typescript
interface WebSocketMessage {
  type: string;
  sessionId: string;
  payload: unknown;
  timestamp: number;
  playerId?: string;
}
```

### Message Types

#### Client → Server

- `CREATE_SESSION`: Create a new lobby session
- `JOIN_SESSION`: Join an existing session
- `LEAVE_SESSION`: Leave the current session
- `UPDATE_LOBBY`: Update lobby configuration
- `START_GAME`: Start the game from lobby

#### Server → Client

- `SESSION_CREATED`: Confirmation of session creation
- `SESSION_JOINED`: Confirmation of joining session
- `SESSION_LEFT`: Confirmation of leaving session
- `LOBBY_UPDATED`: Lobby configuration was updated
- `GAME_STARTED`: Game has started
- `ERROR`: Error occurred processing request

### Example Messages

```typescript
// Client creates session
{
  type: 'CREATE_SESSION',
  sessionId: 'session_123',
  payload: { config: LobbyConfig },
  timestamp: 1234567890
}

// Server confirms
{
  type: 'SESSION_CREATED',
  sessionId: 'session_123',
  payload: { sessionId: 'session_123' },
  timestamp: 1234567891
}

// Client updates lobby
{
  type: 'UPDATE_LOBBY',
  sessionId: 'session_123',
  payload: { config: UpdatedLobbyConfig },
  timestamp: 1234567892,
  playerId: 'player_1'
}

// Server broadcasts update
{
  type: 'LOBBY_UPDATED',
  sessionId: 'session_123',
  payload: { config: UpdatedLobbyConfig },
  timestamp: 1234567893
}
```

## Usage

### Creating a Session

```typescript
import { localSessionService } from './LocalSessionService';
import { LobbyService } from '../lobby/LobbyService';

const lobbyService = new LobbyService(localSessionService);
const sessionId = await lobbyService.createLobby('local', 8);
```

### Subscribing to Updates

```typescript
const unsubscribe = lobbyService.subscribeToLobby(sessionId, (config) => {
  console.log('Lobby updated:', config);
});

// Later, unsubscribe
unsubscribe();
```

### Updating Lobby

```typescript
await lobbyService.addPlayerSlot(sessionId, 'human', 'Player 1');
await lobbyService.setPlayerReady(sessionId, slotId, true);
```

## Migration Path

To migrate from local to online:

1. Replace `LocalSessionService` with `WebSocketSessionService`
2. Update connection configuration
3. Handle network errors and reconnection
4. Implement conflict resolution
5. Add authentication if needed

The `LobbyService` class abstracts away the implementation details, so the migration should be transparent to the rest of the application.


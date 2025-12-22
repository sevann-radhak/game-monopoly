# Session Service Architecture

## Design Principles

### Separation of Concerns

1. **LobbyManager**: Pure functions for lobby state transformations
   - No side effects
   - No async operations
   - Testable in isolation

2. **LobbyService**: Business logic layer
   - Uses SessionService for persistence/sync
   - Handles async operations
   - Coordinates between LobbyManager and SessionService

3. **SessionService**: Abstraction for session management
   - Interface for different implementations
   - Handles subscriptions and events
   - Manages session lifecycle

### Dependency Injection

The `LobbyService` accepts a `SessionService` implementation via constructor:

```typescript
const localService = new LobbyService(localSessionService);
const webSocketService = new LobbyService(webSocketSessionService);
```

This allows easy swapping between implementations without changing business logic.

## State Flow

### Local Mode (Current)

```
User Action
  ↓
LobbyService (async)
  ↓
LocalSessionService (sync)
  ↓
In-Memory Map Update
  ↓
Notify Subscribers (sync)
  ↓
React State Update
```

### Online Mode (Future)

```
User Action
  ↓
LobbyService (async)
  ↓
WebSocketSessionService (async)
  ↓
WebSocket Message → Server
  ↓
Server Validates & Updates
  ↓
Server Broadcasts to All Clients
  ↓
WebSocketSessionService Receives Update
  ↓
Notify Subscribers (sync)
  ↓
React State Update (all clients)
```

## Event System

### Event Types

1. **lobby_created**: Emitted when a new session is created
2. **player_joined**: Emitted when a player joins a session
3. **player_left**: Emitted when a player leaves a session
4. **lobby_updated**: Emitted when lobby configuration changes
5. **game_started**: Emitted when game starts from lobby

### Event Handlers

Event handlers can be registered on the SessionService:

```typescript
sessionService.on('lobby_updated', (event) => {
  console.log('Lobby updated:', event.config);
});
```

## Subscription Model

### How It Works

1. Client calls `subscribeToLobby(sessionId, callback)`
2. SessionService stores the callback
3. When lobby updates, all callbacks are invoked
4. Returns unsubscribe function

### Benefits

- Real-time updates without polling
- Multiple subscribers per session
- Automatic cleanup via unsubscribe
- Works for both local and online modes

## Migration Strategy

### Phase 1: Current (Local Only)
- Uses `LocalSessionService`
- All state in-memory
- No network calls

### Phase 2: Hybrid (Future)
- Support both local and online
- User selects mode
- Same interface, different implementation

### Phase 3: Online Only (Future)
- WebSocketSessionService as default
- Server-side validation
- Multi-client synchronization

## Testing

### Unit Tests

- Test `LobbyManager` functions in isolation
- Mock `SessionService` for `LobbyService` tests
- Test event emission and subscription

### Integration Tests

- Test `LocalSessionService` with real `LobbyService`
- Test subscription callbacks
- Test state synchronization

### Future: E2E Tests

- Test WebSocket connection
- Test multi-client synchronization
- Test error handling and reconnection

## Error Handling

### Local Mode

- Immediate error propagation
- No network errors
- Validation errors from LobbyManager

### Online Mode (Future)

- Network errors (connection lost, timeout)
- Server validation errors
- Conflict resolution errors
- Automatic reconnection with exponential backoff

## Performance Considerations

### Local Mode

- Instant updates (synchronous)
- No network latency
- Minimal memory overhead

### Online Mode (Future)

- Optimistic updates for better UX
- Debouncing for rapid changes
- Compression for large payloads
- Connection pooling

## Security Considerations (Future)

### Authentication

- Player authentication before joining
- Session ownership validation
- Permission checks for lobby updates

### Authorization

- Only host can start game
- Players can only update their own slot
- Server validates all changes

### Data Validation

- Server-side validation of all updates
- Sanitization of user input
- Rate limiting to prevent abuse



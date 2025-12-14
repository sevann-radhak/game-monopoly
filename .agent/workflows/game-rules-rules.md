---
description: Game Rules Engine
---

### Game Rules Engine

Implement game rules as **pure, testable functions**:

- **Rule Validation**: Can player perform action?
- **Rule Execution**: Execute action and return new game state
- **Rule Queries**: Calculate rent, check monopoly, etc.

Rules should be:
- **Immutable**: Never mutate game state directly
- **Composable**: Combine rules for complex actions
- **Testable**: Each rule independently testable
- **Declarative**: Rules as data/configuration where possible

### Key Business Rules to Implement

1. **Movement Rules**:
   - Dice roll calculation
   - Doubles handling (extra turn, triple doubles → jail)
   - Passing GO ($200 collection)
   - Board wrapping (position 39 → 0)

2. **Property Rules**:
   - Purchase validation (sufficient funds, property available)
   - Auction mechanics (bidding, highest bidder wins)
   - Rent calculation (base, monopoly, houses, hotels)
   - Monopoly detection (all properties in color group owned)

3. **Building Rules**:
   - Monopoly requirement
   - Even building requirement
   - House/hotel limits
   - Building costs
   - Supply limits (32 houses, 12 hotels)

4. **Financial Rules**:
   - Mortgage calculation (50% of purchase price)
   - Unmortgage calculation (mortgage + 10%)
   - Bankruptcy detection and resolution
   - Trade validation

5. **Jail Rules**:
   - Entry conditions
   - Exit options (pay, card, doubles, wait)
   - Turn limit (3 turns max)

6. **Card Rules**:
   - Card drawing and execution
   - Card effects (movement, money, jail, etc.)
   - Card ownership (Get Out of Jail Free)

### Development Best Practices

#### Code Quality
- **Type Safety**: Use TypeScript or strong typing
- **Immutability**: Prefer immutable data structures
- **Pure Functions**: Business logic as pure functions
- **Single Responsibility**: Each class/function does one thing
- **DRY**: Don't repeat yourself, but don't over-abstract
- **SOLID Principles**: Apply consistently

#### Testing Strategy
- **Unit Tests**: Test each rule, entity method, use case
- **Integration Tests**: Test game flow, player interactions
- **Property-Based Tests**: Test game rules with random inputs
- **Scenario Tests**: Test complete game scenarios
- **Edge Cases**: Test boundary conditions (bankruptcy, triple doubles, etc.)

#### Error Handling
- **Validation**: Validate all inputs at boundaries
- **Domain Exceptions**: Use domain-specific exceptions
- **Graceful Degradation**: Handle errors without crashing
- **Logging**: Log all game events for debugging

#### Performance Considerations
- **State Management**: Efficient game state updates
- **Event Sourcing**: Consider for game history/undo
- **Caching**: Cache calculated values (rent, monopolies)
- **Optimization**: Profile before optimizing

### Implementation Phases

#### Phase 1: Core Domain
1. Implement basic entities (Player, Property, Game)
2. Implement board structure
3. Implement basic movement
4. Implement property purchase

#### Phase 2: Financial System
1. Implement money management
2. Implement rent calculation
3. Implement mortgages
4. Implement bankruptcy

#### Phase 3: Property Development
1. Implement monopoly detection
2. Implement house/hotel building
3. Implement building rules validation

#### Phase 4: Special Mechanics
1. Implement jail system
2. Implement card decks (Chance, Community Chest)
3. Implement auctions
4. Implement trading

#### Phase 5: Game Flow
1. Implement turn management
2. Implement game state transitions
3. Implement win condition
4. Implement game history/events

#### Phase 6: AI & Multiplayer
1. Implement AI players
2. Implement multiplayer (local/online)
3. Implement game persistence
4. Implement undo/redo

#### Phase 7: Polish
1. UI/UX improvements
2. Animations and effects
3. Sound effects (optional)
4. Performance optimization

### Important Considerations

#### Game State Management
- **Immutable State**: Use immutable updates for game state
- **Event Sourcing**: Consider for complete game history
- **State Validation**: Validate state transitions
- **State Serialization**: For save/load, network sync

#### Multiplayer Architecture
- **Authority**: Server is authoritative for game state
- **Client Prediction**: For smooth UI (with rollback if needed)
- **Network Sync**: Sync game state efficiently
- **Reconnection**: Handle player disconnections

#### AI Implementation
- **Decision Trees**: For property purchase decisions
- **Monte Carlo**: For evaluating move outcomes
- **Heuristics**: For quick decisions (property value, rent potential)
- **Difficulty Levels**: Easy, Medium, Hard AI strategies

### Testing Scenarios

Essential test cases to implement:

1. **Basic Movement**: Player moves correctly, passes GO
2. **Property Purchase**: Player buys property, property ownership
3. **Rent Payment**: Correct rent calculation and payment
4. **Monopoly**: Monopoly detection, rent doubling
5. **Building**: House/hotel building, even building rule
6. **Mortgage**: Mortgage/unmortgage mechanics
7. **Jail**: Jail entry/exit, turn limits
8. **Bankruptcy**: Bankruptcy detection, asset transfer
9. **Auction**: Auction mechanics, bidding
10. **Trading**: Property/cash/card trading
11. **Cards**: Card drawing and effects
12. **Doubles**: Extra turns, triple doubles → jail
13. **Game End**: Win condition, final scoring

### Documentation Requirements

- **API Documentation**: OpenAPI/Swagger for REST endpoints
- **Architecture Documentation**: System design, component interactions
- **Game Rules Documentation**: Complete rule reference
- **Developer Guide**: Setup, contribution guidelines
- **User Guide**: How to play the digital version

## Success Criteria

A successful implementation should:

1. ✅ **Faithfully implement all official Monopoly rules**
2. ✅ **Handle all edge cases and special situations**
3. ✅ **Support 2-8 players (human and/or AI)**
4. ✅ **Provide clear, intuitive user interface**
5. ✅ **Be fully testable with comprehensive test coverage**
6. ✅ **Follow clean architecture and SOLID principles**
7. ✅ **Be maintainable and extensible**
8. ✅ **Support multiplayer (local and/or online)**
9. ✅ **Handle game state persistence (save/load)**
10. ✅ **Provide smooth, responsive gameplay experience**
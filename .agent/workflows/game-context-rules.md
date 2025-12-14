---
description: Monopoly Game Development: Complete Contextual Rule
---

# Monopoly Game Development: Complete Contextual Rule

## Project Overview

This project involves developing a complete, professional implementation of the classic **Monopoly** board game. The goal is to create a digital version that faithfully represents the official game rules, mechanics, and player experience while adhering to modern software engineering principles, clean architecture, and best practices. Develop a complete digital Monopoly implementation following official rules, clean architecture, SOLID principles, and modern software engineering practices. Multiplayer economic strategy game where players accumulate wealth through property acquisition, development, and financial management. Winner is the last non-bankrupt player.

## Game Description

Monopoly is a multiplayer economic strategy board game where players compete to accumulate wealth through property acquisition, development, and strategic financial management. The game continues until all but one player are bankrupt, with the remaining player declared the winner.

## Core Game Components

### 1. Game Board
- **40 spaces** arranged in a square, including:
  - **28 Properties**: 22 colored property groups (8 color groups) + 4 railroads + 2 utilities
  - **Special Spaces**: GO, Jail/Just Visiting, Free Parking, Go to Jail, Income Tax, Luxury Tax
  - **Card Spaces**: Chance (3 spaces), Community Chest (3 spaces)

### 2. Property Groups
- **Brown Group** (2 properties): Mediterranean Avenue, Baltic Avenue
- **Light Blue Group** (3 properties): Oriental Avenue, Vermont Avenue, Connecticut Avenue
- **Pink Group** (3 properties): St. Charles Place, States Avenue, Virginia Avenue
- **Orange Group** (3 properties): St. James Place, Tennessee Avenue, New York Avenue
- **Red Group** (3 properties): Kentucky Avenue, Indiana Avenue, Illinois Avenue
- **Yellow Group** (3 properties): Atlantic Avenue, Ventnor Avenue, Marvin Gardens
- **Green Group** (3 properties): Pacific Avenue, North Carolina Avenue, Pennsylvania Avenue
- **Dark Blue Group** (2 properties): Park Place, Boardwalk
- **Railroads** (4 properties): Reading Railroad, Pennsylvania Railroad, B&O Railroad, Short Line
- **Utilities** (2 properties): Electric Company, Water Works

### 3. Game Pieces
- Player tokens (8 different tokens)
- Houses (32 per color group, max 4 per property)
- Hotels (12 total, replaces 4 houses)
- Money (bank notes in denominations: $1, $5, $10, $20, $50, $100, $500)
- Dice (2 six-sided dice)
- Chance cards (16 cards)
- Community Chest cards (16 cards)

## Official Game Rules

### Initial Setup

1. **Banker Selection**: One player acts as Banker, managing bank assets (money, properties, houses, hotels)
2. **Starting Capital**: Each player receives $1,500:
   - 2 × $500
   - 4 × $100
   - 1 × $50
   - 1 × $20
   - 2 × $10
   - 1 × $5
   - 5 × $1
3. **Turn Order**: Players roll dice; highest roll goes first. Play proceeds clockwise.
4. **Token Placement**: All tokens start on GO.

### Turn Mechanics

1. **Roll Dice**: Player rolls two six-sided dice
2. **Move Token**: Move clockwise by the sum of dice
3. **Land on Space**: Execute action based on space type
4. **Doubles Rule**: 
   - Rolling doubles grants another turn
   - Three consecutive doubles → Go to Jail (no $200 for passing GO)
5. **Passing GO**: Collect $200 from bank (unless going to Jail)

### Space Actions

#### Property Spaces
- **Unowned Property**: 
  - Player may buy at listed price
  - If declined, property goes to auction (highest bidder wins)
- **Owned Property**: 
  - Pay rent to owner
  - Rent varies by: property type, monopoly status, houses/hotels
  - Mortgaged properties collect no rent

#### Special Spaces
- **GO**: Collect $200 when passing or landing
- **Income Tax**: Pay $200 (or 10% of total assets, player's choice)
- **Luxury Tax**: Pay $100
- **Free Parking**: No action (house rules may vary)
- **Go to Jail**: Move directly to Jail (no $200 for passing GO)
- **Jail/Just Visiting**: 
  - If in Jail, follow jail exit rules
  - If just visiting, no action

#### Card Spaces
- **Chance**: Draw top card, follow instructions immediately
- **Community Chest**: Draw top card, follow instructions immediately.

### Property Development

#### Monopolies
- Owning all properties in a color group creates a **monopoly**
- Monopolies allow building houses and hotels
- Rent doubles for unmortgaged monopolies (even without houses)

#### Building Rules
- **Houses**: 
  - Must build evenly across monopoly properties
  - Maximum 4 houses per property
  - Cost varies by property group
  - Must have 4 houses before building hotel
- **Hotels**: 
  - Replaces 4 houses on a property
  - Only one hotel per property
  - Cost = house cost × 5 (4 houses + hotel)
- **Building Restrictions**:
  - Cannot build if any property in group is mortgaged
  - Must build evenly (cannot have 2 houses on one property and 0 on another in same group)
  - Limited supply: 32 houses and 12 hotels total

### Financial Transactions

#### Mortgaging
- Players can mortgage properties to bank for **half the purchase price**
- Mortgaged properties cannot collect rent
- To unmortgage: Pay mortgage value + 10% interest
- Cannot build on mortgaged properties or properties in mortgaged groups

#### Trading
- Players can trade: properties, cash, Get Out of Jail Free cards
- Trades can occur at any time (even during other players' turns)
- All trades must be agreed upon by both parties

#### Bankruptcy
- Player is bankrupt when unable to pay debts
- If bankrupt to another player: All assets (properties, cash, houses, hotels) go to creditor
- If bankrupt to bank: All assets return to bank, properties unmortgaged
- Bankrupt player is eliminated

### Jail Mechanics

#### Entering Jail
- Land on "Go to Jail" space
- Draw "Go to Jail" card
- Roll doubles three times consecutively

#### Exiting Jail (choose one per turn)
1. **Pay $50 fine**: Exit immediately, roll and move
2. **Use Get Out of Jail Free card**: Exit immediately, roll and move
3. **Roll doubles**: Exit immediately, move the rolled amount
4. **Wait**: After 3 turns, must pay $50 fine

**Note**: While in Jail, player still collects rent, can trade, and can build.

### Card Decks

#### Chance Cards (16 cards)
Examples: Advance to GO, Go to Jail, Pay $50, Collect $150, etc.

#### Community Chest Cards (16 cards)
Examples: Collect $200, Pay $100, Get Out of Jail Free, etc.

**Important**: Cards are returned to bottom of deck after use (except Get Out of Jail Free, held by player).

### Winning Condition

The game ends when all but one player are bankrupt. The remaining player wins.

## Technical Architecture & Design Principles

### Architecture Patterns

#### 1. Domain-Driven Design (DDD)
- **Core Domain**: Game rules, player actions, property management
- **Bounded Contexts**: Game State, Player Management, Property System, Financial System
- **Entities**: Player, Property, Game, Bank, Card
- **Value Objects**: Money, Position, DiceRoll, Rent
- **Aggregates**: Game (root aggregate), Player, Property
- **Domain Events**: PropertyPurchased, PlayerBankrupt, MonopolyFormed, etc.

#### 2. Clean Architecture Layers
```
┌─────────────────────────────────────┐
│   Presentation Layer (UI/API)       │
├─────────────────────────────────────┤
│   Application Layer (Use Cases)     │
├─────────────────────────────────────┤
│   Domain Layer (Business Logic)     │
├─────────────────────────────────────┤
│   Infrastructure Layer (Persistence)│
└─────────────────────────────────────┘
```

#### 3. Design Patterns

**State Pattern**: 
- Game states: WaitingForPlayers, PlayerTurn, Auction, Trading, GameOver
- Player states: Active, InJail, Bankrupt
- Property states: Unowned, Owned, Mortgaged

**Observer Pattern**:
- Game events: PropertyLanded, RentPaid, PlayerBankrupt
- UI updates react to domain events
- Decouple game logic from presentation

**Command Pattern**:
- Player actions: BuyProperty, BuildHouse, MortgageProperty, Trade
- Enables undo/redo, command history, validation

**Strategy Pattern**:
- AI player strategies: Aggressive, Conservative, Balanced
- Rent calculation strategies: Base, Monopoly, WithHouses, WithHotel
- Auction bidding strategies

**Factory Pattern**:
- Property creation: StandardProperty, Railroad, Utility
- Card creation: ChanceCard, CommunityChestCard
- Player creation: HumanPlayer, AIPlayer

**Singleton Pattern** (use sparingly):
- GameManager (single game instance)
- Bank (single bank instance)

**Repository Pattern**:
- Abstract data access: IGameRepository, IPlayerRepository
- Enable testing with in-memory implementations.

### Technology Stack Recommendations

#### Backend/Game Engine
- **Language**: TypeScript/JavaScript (Node.js) or Python
- **Framework**: 
  - Node.js: Express/Fastify for API, Socket.io for real-time
  - Python: FastAPI for API, WebSockets for real-time
- **State Management**: 
  - Event Sourcing (for game history/undo)
  - CQRS (separate read/write models)

#### Frontend
- **Web**: React/Vue.js/Angular with TypeScript
- **Game Board**: Canvas API or SVG for board rendering
- **State Management**: Redux/Zustand for client state
- **Real-time**: WebSockets for multiplayer

#### Database (if persistence needed)
- **In-Memory**: Redis for active games
- **Persistence**: PostgreSQL for game history, MongoDB for flexible game state
- **Consider**: Event store for complete game history

#### Testing
- **Unit Tests**: Jest (JS/TS), pytest (Python)
- **Integration Tests**: Supertest, Testcontainers
- **E2E Tests**: Playwright, Cypress
- **Property-Based Testing**: Fast-check, Hypothesis.

### Code Organization

```
monopoly-game/
├── src/
│   ├── domain/              # Core business logic
│   │   ├── entities/        # Player, Property, Game, etc.
│   │   ├── value-objects/   # Money, Position, DiceRoll
│   │   ├── events/          # Domain events
│   │   ├── services/        # Domain services
│   │   └── rules/           # Game rules engine
│   ├── application/         # Use cases
│   │   ├── commands/        # Command handlers
│   │   ├── queries/         # Query handlers
│   │   └── services/        # Application services
│   ├── infrastructure/      # External concerns
│   │   ├── persistence/     # Repositories implementation
│   │   ├── events/          # Event bus implementation
│   │   └── ai/              # AI player implementations
│   └── presentation/        # UI/API
│       ├── api/             # REST/GraphQL endpoints
│       ├── websocket/        # Real-time handlers
│       └── ui/              # Frontend components
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
```

### Core Domain Models

#### Game Entity
```typescript
interface Game {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  board: Board;
  bank: Bank;
  state: GameState;
  turnNumber: number;
  history: GameEvent[];
}
```

#### Player Entity
```typescript
interface Player {
  id: string;
  name: string;
  token: Token;
  position: number;
  money: Money;
  properties: Property[];
  getOutOfJailCards: number;
  isInJail: boolean;
  jailTurns: number;
  isBankrupt: boolean;
}
```

#### Property Entity
```typescript
interface Property {
  id: string;
  name: string;
  position: number;
  type: PropertyType; // Standard, Railroad, Utility
  colorGroup: ColorGroup;
  purchasePrice: Money;
  rent: RentSchedule;
  owner: Player | null;
  houses: number; // 0-4, 5 = hotel
  isMortgaged: boolean;
}
```
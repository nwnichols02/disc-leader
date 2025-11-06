# 🎯 Populate Database with Sample Data

**Status**: Core functions implemented, ready to seed database

## ✅ What's Been Created

### Backend Functions (Convex)

1. **`convex/games.ts`** - Query functions (206 lines)
   - `getGame` - Get single game with teams and state
   - `getGameState` - Real-time game state subscription
   - `getGameEvents` - Play-by-play log with player details
   - `listGames` - Filter games by status
   - `getLiveGames` - Optimized query for dashboard
   - `getTeam` / `listTeams` - Team queries
   - `getTeamPlayers` - Player roster queries
   - `getUserByClerkId` - User authentication

2. **`convex/gameMutations.ts`** - Mutation functions (385 lines)
   - `createGame` - Create new game with authentication
   - `recordGoal` - Atomic score updates with events
   - `updateClock` - Game timing control
   - `updateGameStatus` - Status transitions
   - `updatePossession` - Possession changes
   - `recordTurnover` - Turnover tracking
   - `createTeam` - Team management
   - `createUser` - User registration

3. **`convex/seed.ts`** - Seed data script (300+ lines)
   - `seedData` - Creates sample teams, users, games, players
   - `clearAllData` - Reset database (development only)

---

## 🚀 Populate the Database

### Option 1: Use Convex Dashboard (Recommended)

1. **Open Convex Dashboard**
   ```bash
   # Dashboard URL shown when you ran `npx convex dev`
   # Or visit: https://dashboard.convex.dev
   ```

2. **Navigate to Functions**
   - Click "Functions" in the left sidebar
   - Find `seed:seedData` in the list

3. **Run the Seed Function**
   - Click on `seedData`
   - Click "Run" button (no arguments needed)
   - Wait for success response

4. **Verify Data Created**
   - Go to "Data" tab
   - You should see:
     - ✅ 4 teams
     - ✅ 2 users
     - ✅ 4 players
     - ✅ 2 games (1 upcoming, 1 live)
     - ✅ 2 game states
     - ✅ 3 events

### Option 2: Use Terminal

```bash
# From your project directory
npx convex run seed:seedData
```

---

## 📊 Sample Data Created

### Teams
1. **San Francisco Revolver** (Open)
   - Colors: Red/Black
   - Players: Jimmy Mickle, Beau Kittredge

2. **Seattle Sockeye** (Open)
   - Colors: Blue/White
   - Players: Dylan Freechild, Mark Burton

3. **Boston Brute Squad** (Women's)
   - Colors: Navy/Gold

4. **Portland Rhino Slam** (Mixed)
   - Colors: Green/Gold

### Games

**Upcoming Game** (Professional format)
- SF Revolver vs Seattle Sockeye
- Format: Professional (4 quarters, 12 min each)
- Starts in 1 hour
- Venue: Breese Stevens Field, Madison, WI

**Live Game** (Tournament format)
- Boston Brute Squad vs Portland Rhino Slam
- Format: Tournament (first to 15)
- Current Score: 7-5
- 70 minutes elapsed
- Mixed division with gender ratios

### Users

**Admin User**
- Email: admin@discleader.com
- Can manage games and teams
- Clerk ID: sample_admin_123

**Scorekeeper User**
- Email: scorekeeper@discleader.com
- Can update scores
- Clerk ID: sample_scorekeeper_456

---

## 🧪 Test the Functions

### 1. Test Query Functions

In Convex Dashboard → Functions:

**Get Live Games**
```typescript
// Function: games:getLiveGames
// Args: {} (empty)
// Should return: 1 game (Boston vs Portland)
```

**Get Game Details**
```typescript
// Function: games:getGame
// Args: { "gameId": "[copy ID from Data tab]" }
// Should return: Full game with teams and state
```

**Get Game Events**
```typescript
// Function: games:getGameEvents
// Args: { "gameId": "[live game ID]", "limit": 10 }
// Should return: 3 events (goals and turnover)
```

### 2. Test Mutation Functions

**Record a Goal** (you'll need actual user auth for this to work)
```typescript
// Function: gameMutations:recordGoal
// Args: {
//   "gameId": "[live game ID]",
//   "scoringTeam": "home",
//   "scoredBy": "[player ID - optional]"
// }
// Should update: homeScore from 7 to 8
```

**Update Game Status**
```typescript
// Function: gameMutations:updateGameStatus
// Args: {
//   "gameId": "[upcoming game ID]",
//   "status": "live"
// }
// Should change: status from "upcoming" to "live"
```

---

## 🔍 Verify in Convex Dashboard

### Data Tab
Navigate to each table and verify:

✅ **games** - 2 rows
- 1 upcoming (SF Revolver vs Seattle)
- 1 live (Boston vs Portland)

✅ **gameState** - 2 rows
- One with 0-0 score (upcoming)
- One with 7-5 score (live)

✅ **events** - 3 rows
- 2 goals
- 1 turnover (block)

✅ **teams** - 4 rows
- SF Revolver, Seattle, Boston, Portland

✅ **players** - 4 rows
- 2 for SF Revolver
- 2 for Seattle

✅ **users** - 2 rows
- Admin
- Scorekeeper

✅ **subscriptions** - 0 rows (none created yet)

---

## 🧹 Reset Database (if needed)

If you need to start over:

```typescript
// In Convex Dashboard → Functions
// Function: seed:clearAllData
// Args: { "confirm": true }
// WARNING: This deletes EVERYTHING!
```

Then run `seedData` again.

---

## 🎯 Next Steps

Once data is populated:

### 1. Test Queries from Frontend
```typescript
// In a React component
import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "../convex/_generated/api"

function GameList() {
  const { data: liveGames } = useQuery(
    convexQuery(api.games.getLiveGames, {})
  )
  
  return <div>{liveGames?.length} live games</div>
}
```

### 2. Build Public Game Page
- Route: `/games/[gameId]`
- Component: `LiveScoreboard`
- Real-time subscriptions working

### 3. Create Admin Dashboard
- Protected routes with Clerk
- Game management interface
- Scorekeeper controls

---

## 📚 Function Reference

### Query Functions (`convex/games.ts`)
- `getGame(gameId)` - Full game details
- `getGameState(gameId)` - Real-time state
- `getGameEvents(gameId, limit?)` - Play-by-play
- `listGames(status?, limit?)` - Filtered list
- `getLiveGames()` - Dashboard view
- `getTeam(teamId)` - Team info
- `listTeams()` - All teams
- `getTeamPlayers(teamId, activeOnly?)` - Roster
- `getUserByClerkId(clerkId)` - User lookup

### Mutation Functions (`convex/gameMutations.ts`)
- `createGame(...)` - New game
- `recordGoal(gameId, scoringTeam, ...)` - Score
- `updateClock(gameId, clockSeconds, clockRunning)` - Timer
- `updateGameStatus(gameId, status)` - Status change
- `updatePossession(gameId, possession)` - Possession
- `recordTurnover(gameId, turnoverType, ...)` - Turnover
- `createTeam(...)` - New team
- `createUser(...)` - New user

---

## ✅ Success Criteria

After seeding:
- ✅ Can query live games
- ✅ Can get full game details
- ✅ Can see events in chronological order
- ✅ Data is properly linked (teams → players, games → gameState)
- ✅ All indices working (fast queries)
- ✅ TypeScript types working (auto-complete in IDE)

---

**Status**: Ready to build frontend! 🎉


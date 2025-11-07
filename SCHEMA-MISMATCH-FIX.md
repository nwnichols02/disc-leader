# 🔧 Schema Mismatch Fix - Browse Games

**Date**: November 7, 2025  
**Issue**: Games showing "0" or empty data  
**Root Cause**: Field names didn't match schema  
**Status**: ✅ Fixed

---

## 🐛 The Problem

The Browse Games page was displaying games but showing:
- "0" for all scores
- Empty or missing team names
- Missing game information

The data was loading, but the **field names didn't match the actual database schema**.

---

## 🔍 Root Cause

### What Browse Games Was Using (WRONG ❌)

```tsx
// Team names
game.team1Name
game.team2Name

// Scores
game.team1Score
game.team2Score

// Colors
game.team1Color
game.team2Color

// Other fields
game.scheduledTime
game.location
game.division
game.status === "scheduled"
```

### What the Actual Schema Has (CORRECT ✅)

```tsx
// Team names
game.homeTeam.name
game.awayTeam.name

// Scores
game.state?.homeScore
game.state?.awayScore

// Colors
game.homeTeam.primaryColor
game.awayTeam.primaryColor

// Other fields
game.scheduledStart
game.venue
game.genderRatioRequired
game.status === "upcoming"
```

---

## ✅ The Fix

Updated all field references to match the actual schema:

### Teams

```tsx
// ❌ Before
{game.team1Name}
{game.team2Name}

// ✅ After
{game.homeTeam?.name || "Home Team"}
{game.awayTeam?.name || "Away Team"}
```

### Scores

```tsx
// ❌ Before
{game.team1Score || 0}
{game.team2Score || 0}

// ✅ After
{game.state?.homeScore ?? 0}
{game.state?.awayScore ?? 0}
```

### Colors

```tsx
// ❌ Before
style={{ backgroundColor: game.team1Color || "#3b82f6" }}
style={{ backgroundColor: game.team2Color || "#ef4444" }}

// ✅ After
style={{ backgroundColor: game.homeTeam?.primaryColor || "#3b82f6" }}
style={{ backgroundColor: game.awayTeam?.primaryColor || "#ef4444" }}
```

### Other Fields

```tsx
// ❌ Before
formatDate(game.scheduledTime)
{game.location}
{game.division}
game.status === "scheduled"

// ✅ After
formatDate(game.scheduledStart)
{game.venue}
{game.genderRatioRequired && "Mixed"}
game.status === "upcoming"
```

---

## 📊 Schema Structure

### How Data is Organized

**Games Table**:
```typescript
{
  _id: Id<"games">,
  format: "professional" | "tournament" | "recreational",
  status: "upcoming" | "live" | "completed" | "cancelled",
  homeTeamId: Id<"teams">,    // Reference to team
  awayTeamId: Id<"teams">,    // Reference to team
  scheduledStart: number,      // Unix timestamp
  venue: string,
  genderRatioRequired: boolean,
  // ... other fields
}
```

**What listGames Returns** (enriched):
```typescript
{
  ...game,                     // All game fields
  homeTeam: {                  // Populated team data
    name: string,
    primaryColor: string,
    // ... other team fields
  },
  awayTeam: {                  // Populated team data
    name: string,
    primaryColor: string,
    // ... other team fields
  },
  state: {                     // Current game state
    homeScore: number,
    awayScore: number,
    period: number,
    // ... other state fields
  }
}
```

---

## 🎯 Why This Happened

The Browse Games page was created based on **assumed field names** rather than checking the actual schema.

The schema uses:
- **Home/Away** terminology (not Team1/Team2)
- **Separate entities** for teams and game state
- **Different field names** for timestamps and locations

---

## ✅ Testing Checklist

After the fix:

- [x] Games display with actual team names
- [x] Scores show correctly for live/completed games
- [x] Team colors display properly
- [x] Date and time show correctly
- [x] Venue displays if present
- [x] Mixed division indicator works
- [x] Status filtering works (upcoming/live/completed)
- [x] No TypeScript errors
- [x] No linter errors

---

## 📝 Files Changed

**Modified**: `/src/routes/games.index.tsx`

**Changes**:
1. ✅ Updated team name references
2. ✅ Updated score references
3. ✅ Updated color references
4. ✅ Fixed timestamp field name
5. ✅ Fixed location field name
6. ✅ Fixed division field logic
7. ✅ Fixed status filter value

**Lines changed**: ~15 lines across GameCard component

---

## 🎓 Lessons Learned

### Always Check the Schema First

Before building UI components:
1. ✅ Read the actual schema definition
2. ✅ Check what query functions return
3. ✅ Look at existing working examples
4. ✅ Don't assume field names

### Check Existing Patterns

The individual game page (`games.$gameId.tsx`) was already using the correct field names:
- It accessed `game.homeTeam.name`
- It used `state?.homeScore`
- These patterns should have been followed

### Use TypeScript Properly

TypeScript would have caught these errors if the types were more strictly enforced. Consider:
- Using stricter type checking
- Avoiding optional chaining without checking types
- Validating field names against schema types

---

## 📊 Field Name Reference

For future development, here's the complete mapping:

| UI Concept | Schema Field Path |
|------------|-------------------|
| Home team name | `game.homeTeam.name` |
| Away team name | `game.awayTeam.name` |
| Home score | `game.state?.homeScore` |
| Away score | `game.state?.awayScore` |
| Home color | `game.homeTeam.primaryColor` |
| Away color | `game.awayTeam.primaryColor` |
| Game time | `game.scheduledStart` |
| Location | `game.venue` |
| Mixed division | `game.genderRatioRequired` |
| Format | `game.format` |
| Status | `game.status` |

---

## 🎉 Result

The Browse Games page now:
- ✅ Displays actual team names
- ✅ Shows correct scores
- ✅ Uses proper team colors
- ✅ Displays all game information
- ✅ Filters by correct status values
- ✅ Matches the actual schema structure

**Your games should now display correctly with all the data from your seed!**

---

**Fix Applied**: November 7, 2025  
**Result**: ✅ Success - Games now display with correct data


# 🚀 Quick Start - Next Steps

## ✅ What's Working Now

- Authentication (Clerk ✅)
- Database (Convex ✅)  
- Real-time updates ✅
- User sync ✅
- Admin dashboard ✅
- Basic scorekeeper UI ✅

---

## 🎯 Do This RIGHT NOW

### 1. Test That Everything Works

```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start frontend
bun run dev
```

Then:
1. **Go to**: http://localhost:3000
2. **Sign in** with Clerk
3. **Check console**: Should see "User synced with Convex"
4. **Go to**: http://localhost:3000/admin
5. **Verify**: No errors, dashboard loads

### 2. Create Test Data

You need some test data to use the app. Two options:

**Option A: Run Seed Script** (Easiest)
```bash
npx convex run seed:seedData
```

**Option B: Manual via Dashboard**
1. Go to: https://dashboard.convex.dev
2. Click on your project
3. Go to "Data" tab
4. Create 2 teams, 4 players, 1 game manually

### 3. Test the Scorekeeper

After creating test data:
1. Go to `/admin/games`
2. Find your test game
3. Click "Scorekeeper"
4. Try recording a goal
5. Check if it works!

---

## 🛠️ What to Build Next

### Priority 1: Game Creation Form ⭐

**Why**: You need this to create games without using Convex dashboard

**File**: `src/routes/admin.games.new.tsx` (already exists as placeholder)

**Time**: 2-3 hours

**What to add**:
- Form fields for all game properties
- Team selection dropdowns
- Date/time picker
- Submit handler

### Priority 2: Team Management 👥

**Why**: You need this to add teams and players

**Files to create**:
- `src/routes/admin.teams.new.tsx`
- `src/routes/admin.teams.$teamId.tsx`

**Time**: 3-4 hours

**What to add**:
- Create team form
- Add players to team
- Edit team details

### Priority 3: Polish Scorekeeper ⚡

**Why**: Core feature, needs testing and refinement

**File**: `src/routes/admin.scorekeeper.$gameId.tsx`

**Time**: 2-3 hours

**What to improve**:
- Test all buttons
- Add clock controls
- Add undo button
- Improve UX

---

## 📝 Commands Cheat Sheet

```bash
# Development
bun run dev              # Start frontend
npx convex dev          # Start Convex backend

# Convex
npx convex logs         # View backend logs
npx convex dashboard    # Open Convex dashboard
npx convex run seed:seedData  # Seed test data

# Environment
npx convex env set KEY value   # Set env variable
npx convex env list            # List env variables

# Code Quality
bun run lint            # Run linter
bun run format          # Format code
bun run check           # Check everything
```

---

## 🐛 Troubleshooting

### "Not authenticated" error?
- Check `CLERK_ISSUER_URL` is set in Convex dashboard
- Sign out and sign in again
- Check `npx convex logs` for errors

### "User not found" error?
- Sign out and sign in again to trigger user sync
- Check console for "User synced with Convex"
- Verify user exists in Convex dashboard → Data → users

### No games showing?
- You need to create test data
- Run: `npx convex run seed:seedData`
- Or create manually in Convex dashboard

### Page not loading?
- Check browser console for errors
- Check `npx convex logs` for backend errors
- Verify both dev servers are running

---

## 🎨 Recommended First Feature

I recommend building the **Game Creation Form** first because:

1. ✅ Most useful immediate feature
2. ✅ Relatively straightforward to build
3. ✅ You already have a placeholder file
4. ✅ You have a `createGame` mutation ready to use
5. ✅ Will let you test the full flow

### Quick Implementation Guide

1. **Open**: `src/routes/admin.games.new.tsx`

2. **Add form with**:
   - Team selection (home/away)
   - Date/time picker
   - Format selection (professional/tournament/recreational)
   - Venue
   - Rule config (stall count, timeouts, etc.)

3. **Use the mutation**:
   ```typescript
   import { useMutation } from 'convex/react'
   import { api } from '../../convex/_generated/api'
   
   const createGame = useMutation(api.gameMutations.createGame)
   
   const handleSubmit = async (formData) => {
     const gameId = await createGame({
       format: formData.format,
       homeTeamId: formData.homeTeamId,
       awayTeamId: formData.awayTeamId,
       scheduledStart: new Date(formData.date).getTime(),
       venue: formData.venue,
       ruleConfig: { /* ... */ },
     })
     
     // Redirect to scorekeeper
     router.navigate({ to: `/admin/scorekeeper/${gameId}` })
   }
   ```

4. **Test it**:
   - Fill out form
   - Submit
   - Should redirect to scorekeeper
   - Should see new game in games list

---

## 📊 Success Checklist

Before moving to next feature, verify:

- [ ] Can sign in/out
- [ ] Dashboard shows live games (if any)
- [ ] Can view games list
- [ ] Can view teams list
- [ ] Can access scorekeeper page
- [ ] Can record a goal (if test data exists)
- [ ] No errors in console
- [ ] No errors in Convex logs

---

## 💬 Questions?

Common questions:

**Q: Do I need to restart servers after changes?**
A: Usually no - Vite and Convex both hot reload. Restart only if you see weird caching issues.

**Q: How do I reset my database?**
A: Convex Dashboard → Data → Click table → Delete all documents. Or redeploy.

**Q: Can I change the default user role?**
A: Yes! Edit `src/components/UserSync.tsx` line 34.

**Q: Where are the Convex mutations?**
A: `convex/gameMutations.ts` and `convex/games.ts` (queries)

**Q: How do I add a new route?**
A: Create file in `src/routes/` following TanStack Router naming convention.

---

*Ready to build? Start with testing, then pick your first feature!* 🚀


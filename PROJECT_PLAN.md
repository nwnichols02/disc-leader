# 🥏 Disc Leader - Project Plan & Roadmap

## 📊 Current Status

### ✅ Completed
- [x] Basic project setup with TanStack Start + Convex
- [x] Clerk authentication integration
- [x] Database schema for games, teams, players, events
- [x] Real-time data subscriptions via Convex
- [x] Admin dashboard with live games overview
- [x] Games list and filtering
- [x] Teams list management
- [x] Live scorekeeper interface (partial)
- [x] Public game scoreboard with SSR
- [x] Convex + Clerk auth integration
- [x] Automatic user sync on sign-in
- [x] Fixed all query/mutation errors

### ⚠️ Partially Complete
- [ ] Scorekeeper interface (UI exists, needs testing)
- [ ] Game creation form (placeholder exists)
- [ ] Player management
- [ ] Team management forms
- [ ] User role management

### ❌ Not Started
- [ ] Game clock management
- [ ] Timeout tracking
- [ ] Substitution tracking
- [ ] Gender ratio enforcement (mixed division)
- [ ] Statistics and analytics
- [ ] Notifications system
- [ ] Mobile responsive optimizations

---

## 🎯 Immediate Next Steps (Today)

### 1. Test Core Functionality ✅ Priority: HIGH

**Goal**: Verify everything works end-to-end

1. **Sign In/Out Test**
   ```bash
   # Run the app
   bun run dev
   ```
   - Sign in with Clerk
   - Check console for "User synced with Convex"
   - Verify no authentication errors

2. **View Live Games**
   - Go to `/admin`
   - Should see dashboard with live games
   - No errors in console

3. **Test Scorekeeper** (if you have test data)
   - Go to `/admin/scorekeeper/{gameId}`
   - Try recording a goal
   - Check if score updates in real-time

4. **Create Test Data** (if needed)
   - Use the seed script or create via Convex dashboard
   - Need at least: 2 teams, 1 game, 2 players per team

### 2. Set Up Test Data 🎲 Priority: HIGH

**Option A: Manual (Convex Dashboard)**
1. Go to your Convex dashboard
2. Navigate to Data → teams
3. Click "Insert Document"
4. Add two test teams
5. Add a test game with those teams

**Option B: Automated (Recommended)**
Let's check if you have a seed script:
```bash
npx convex run seed:seedData
```

### 3. Create Environment File 📝 Priority: MEDIUM

Create `.env.local` with:
```bash
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_CONVEX_URL=your_convex_url
VITE_SENTRY_DSN=your_sentry_dsn_optional
```

---

## 📅 Short-Term Goals (This Week)

### 1. Complete Game Creation Form 🏗️

**File**: `src/routes/admin.games.new.tsx`

**Tasks**:
- [ ] Add form with all game fields
- [ ] Team selection dropdowns
- [ ] Date/time picker for scheduled start
- [ ] Format selection (professional/tournament/recreational)
- [ ] Rule configuration inputs
- [ ] Submit handler to create game + initial game state
- [ ] Redirect to scorekeeper page after creation

**Estimated Time**: 2-3 hours

### 2. Complete Team Management 👥

**Files to Create**:
- `src/routes/admin.teams.new.tsx` - Create team form
- `src/routes/admin.teams.$teamId.tsx` - Edit team + manage players

**Tasks**:
- [ ] Create team form (name, abbreviation, colors, logo)
- [ ] Edit team form
- [ ] Add players to team
- [ ] Edit player details
- [ ] Activate/deactivate players

**Estimated Time**: 3-4 hours

### 3. Complete Scorekeeper Features ⚡

**File**: `src/routes/admin.scorekeeper.$gameId.tsx`

**Tasks**:
- [ ] Test goal recording
- [ ] Test player selection for goals
- [ ] Add assist tracking
- [ ] Implement clock controls (start/stop/adjust)
- [ ] Add period transitions
- [ ] Add timeout controls
- [ ] Test turnover recording
- [ ] Add "Undo last event" feature

**Estimated Time**: 4-5 hours

---

## 🚀 Medium-Term Goals (Next 2 Weeks)

### 1. Enhanced Statistics 📊

**Files to Create**:
- `src/routes/admin.games.$gameId.stats.tsx`
- `src/routes/players.$playerId.tsx`
- `convex/stats.ts`

**Features**:
- [ ] Player statistics (goals, assists, turnovers)
- [ ] Team statistics (possession %, turnover ratio)
- [ ] Game statistics dashboard
- [ ] Season statistics
- [ ] Leaderboards

**Estimated Time**: 1 week

### 2. Live Game Features 📡

**Enhancements**:
- [ ] Real-time event feed (already partially done)
- [ ] Live possession indicator
- [ ] Quarter/half time tracking
- [ ] Timeout countdown timer
- [ ] Live commentary/notes
- [ ] Share game link

**Estimated Time**: 3-4 days

### 3. Mobile Optimization 📱

**Tasks**:
- [ ] Optimize scorekeeper for tablets
- [ ] Improve touch targets
- [ ] Add landscape mode support
- [ ] Test on various devices
- [ ] Add offline support for scorekeeper

**Estimated Time**: 3-4 days

---

## 🎨 Long-Term Goals (Next Month+)

### 1. Advanced Features ⭐

- [ ] Video integration (link plays to video timestamps)
- [ ] Play diagrams/field visualization
- [ ] Weather integration
- [ ] Field conditions tracking
- [ ] Injury/substitution tracking
- [ ] Gender ratio enforcement UI (mixed division)

### 2. Public Features 🌐

- [ ] Public game listings
- [ ] Team pages with rosters
- [ ] Player profiles
- [ ] Historical game data
- [ ] Season schedules
- [ ] Standings/rankings

### 3. Notifications & Subscriptions 🔔

- [ ] Subscribe to team updates
- [ ] Subscribe to game updates
- [ ] Email notifications
- [ ] SMS notifications (optional)
- [ ] Push notifications

### 4. Analytics & Reporting 📈

- [ ] Export game data (CSV/PDF)
- [ ] Print-friendly scoresheets
- [ ] Advanced analytics dashboard
- [ ] Comparison tools
- [ ] Heat maps (disc movement)

---

## 🛠️ Technical Improvements

### Performance
- [ ] Add loading skeletons
- [ ] Optimize bundle size
- [ ] Add service worker for offline support
- [ ] Implement virtual scrolling for large lists
- [ ] Add image optimization

### Developer Experience
- [ ] Add more TypeScript types
- [ ] Create reusable form components
- [ ] Add E2E tests (Playwright)
- [ ] Set up CI/CD pipeline
- [ ] Add pre-commit hooks

### Security
- [ ] Implement proper role-based access control
- [ ] Add rate limiting
- [ ] Add input validation
- [ ] Add CSRF protection
- [ ] Audit dependencies

---

## 📋 Suggested Development Order

### Phase 1: Core Functionality (Week 1)
1. Test current setup thoroughly
2. Complete game creation form
3. Complete team/player management
4. Test scorekeeper end-to-end

### Phase 2: Polish & Features (Week 2-3)
1. Add statistics tracking
2. Improve mobile responsiveness
3. Add clock management
4. Add undo functionality

### Phase 3: Public Features (Week 4+)
1. Public game pages
2. Team/player profiles
3. Notifications system
4. Advanced analytics

---

## 🎯 Today's Action Items

1. **Test Authentication** ✅
   - Sign in/out
   - Check user sync
   - Verify no errors

2. **Create Test Data** 🎲
   - 2 teams minimum
   - 1 game
   - 4+ players

3. **Test Scorekeeper** ⚡
   - Record a test goal
   - Check real-time updates
   - Verify it works on `/games/{gameId}` public page

4. **Pick Next Feature** 🎨
   - Game creation form? (recommended)
   - Team management?
   - Statistics?

---

## 💡 Recommendations

### Start Here (Highest Value):
1. **Game Creation Form** - You need this to create real games
2. **Team Management** - You need this to add teams/players
3. **Test Scorekeeper Thoroughly** - Core feature

### Quick Wins:
- Add loading states to all pages
- Add error boundaries
- Improve form validation
- Add success/error toasts instead of alerts

### Nice to Have:
- Dark mode
- Keyboard shortcuts for scorekeeper
- Game templates for quick setup
- Export game data

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check `npx convex logs` for backend errors
3. Verify environment variables are set
4. Check that Clerk and Convex are properly connected

---

## 🎉 Success Metrics

You'll know you're ready to launch when:
- [x] Users can sign in/out
- [ ] Users can create games
- [ ] Users can create teams/players
- [ ] Scorekeepers can record goals in real-time
- [ ] Public can view live games
- [ ] No critical errors in console
- [ ] Mobile-responsive
- [ ] Basic statistics work

---

*Last Updated: After fixing all authentication and query errors*


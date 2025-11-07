# 🧪 DiscLeader Testing Guide

*Last Updated: 2025-11-07*

## 📋 Overview

This guide walks through testing all major features of DiscLeader now that the backend is populated with seed data and the frontend foundation is complete.

## 🚀 Getting Started

### Prerequisites
- ✅ Convex backend deployed with schema
- ✅ Database populated with seed data
- ✅ Development server running (`bun run dev`)
- ✅ Clerk authentication configured

### Test Environment
- **Local Dev URL**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Sample Game URL**: http://localhost:3000/games/[gameId] (get from seed data)

---

## 🧪 Test Suites

### Suite 1: Public Game Pages (No Auth Required)

**Priority**: P0 - Critical  
**Time Estimate**: 15 minutes

#### Test 1.1: View Live Game
```
1. Navigate to `/games/[gameId]` (use a game ID from seed data)
2. Verify scoreboard displays:
   - Team names and colors
   - Current score (e.g., "12 - 10")
   - Game status (live/scheduled/completed)
   - Period/quarter/half info
   - Time remaining (if applicable)
3. Check mobile responsiveness:
   - Open on mobile device or resize browser
   - Verify touch-friendly layout
   - Confirm text is readable
```

**Expected Result**: 
- ✅ Scoreboard loads within 2 seconds
- ✅ All game info displayed correctly
- ✅ Responsive on mobile and desktop
- ✅ Format-specific fields shown (quarters for professional, points for tournament)

#### Test 1.2: Real-Time Updates
```
1. Open game page in Browser A
2. Open same game page in Browser B (different tab/window)
3. In another tab, go to admin scorekeeper (test later)
4. Update score in scorekeeper
5. Verify both Browser A and B update automatically
```

**Expected Result**:
- ✅ Score updates appear in < 1 second
- ✅ No page reload required
- ✅ Both browsers stay in sync
- ✅ Optimistic update shows immediately

#### Test 1.3: Play-by-Play Log
```
1. Scroll down to play log section
2. Verify events are listed:
   - Goals with scorer name
   - Turnovers with type
   - Timestamps for each event
   - Events in reverse chronological order
3. Check if new events appear at top when added
```

**Expected Result**:
- ✅ Event log displays properly
- ✅ Timestamps are accurate
- ✅ Player names appear correctly
- ✅ New events appear at top in real-time

#### Test 1.4: Team Rosters
```
1. Find roster section on game page
2. Verify both teams' rosters display
3. Check player numbers and names
4. Look for gender indicators (mixed division only)
```

**Expected Result**:
- ✅ All players listed for both teams
- ✅ Player info accurate (name, number)
- ✅ Gender indicators for mixed (if applicable)
- ✅ Clean, readable layout

#### Test 1.5: SEO & Sharing
```
1. View page source (right-click → View Page Source)
2. Look for meta tags:
   - <title> with game info
   - <meta name="description">
   - Open Graph tags (og:title, og:description)
3. Copy URL and open in new incognito window
4. Verify page loads without login
```

**Expected Result**:
- ✅ Meta tags present with game info
- ✅ Page works in incognito (no auth required)
- ✅ URL is clean and shareable
- ✅ Page loads with SSR (fast initial paint)

---

### Suite 2: Admin Authentication

**Priority**: P0 - Critical  
**Time Estimate**: 10 minutes

#### Test 2.1: Sign In Flow
```
1. Navigate to `/admin`
2. If not signed in, should redirect to Clerk sign-in
3. Sign in with test account
4. Verify redirect back to admin dashboard
```

**Expected Result**:
- ✅ Redirects to Clerk sign-in page
- ✅ Sign-in completes successfully
- ✅ Redirects to `/admin` after sign-in
- ✅ User info visible in header

#### Test 2.2: Protected Routes
```
1. Sign out (if signed in)
2. Try to navigate directly to:
   - /admin
   - /admin/games
   - /admin/scorekeeper/[gameId]
3. Verify each redirects to sign-in
4. Sign back in
5. Verify can access all admin pages
```

**Expected Result**:
- ✅ Unsigned users redirected to sign-in
- ✅ After sign-in, can access all admin pages
- ✅ No errors in console
- ✅ User session persists on refresh

---

### Suite 3: Admin Dashboard

**Priority**: P0 - Critical  
**Time Estimate**: 15 minutes

#### Test 3.1: Dashboard Home
```
1. Navigate to `/admin`
2. Verify stats cards display:
   - Live Games count
   - Total Games count
   - Total Teams count
3. Check quick actions:
   - "View All Games" link
   - "Manage Teams" link
   - Other navigation links
4. Verify navigation menu works
```

**Expected Result**:
- ✅ Stats cards show correct counts from database
- ✅ Quick action links navigate properly
- ✅ Navigation menu highlights active page
- ✅ Layout is clean and organized

#### Test 3.2: Games Management
```
1. Navigate to `/admin/games`
2. Verify games list displays:
   - All games from seed data
   - Team names
   - Status (scheduled/live/completed)
   - Date/time
3. Test filtering (if implemented):
   - Filter by status
   - Filter by date range
4. Click on various action buttons
```

**Expected Result**:
- ✅ All games listed from database
- ✅ Game info accurate
- ✅ Status badges colored correctly
- ✅ Action buttons work (View, Score, etc.)

#### Test 3.3: Teams Management
```
1. Navigate to `/admin/teams`
2. Verify teams grid displays:
   - All teams from seed data
   - Team names
   - Color swatches
   - Roster counts
3. Try hovering over teams (if interactive)
4. Click on team (if clickable)
```

**Expected Result**:
- ✅ All teams displayed
- ✅ Color previews show correct hex colors
- ✅ Roster counts accurate
- ✅ Grid layout responsive

---

### Suite 4: Scorekeeper Interface

**Priority**: P0 - Critical  
**Time Estimate**: 30 minutes  
**Note**: This is the most complex and important test suite

#### Test 4.1: Access Scorekeeper
```
1. From games list, click "Score" button on a live game
2. Verify navigation to `/admin/scorekeeper/[gameId]`
3. Check that game loads correctly
4. Verify scorekeeper UI displays:
   - Current score
   - Team buttons
   - Control buttons
   - Play log
```

**Expected Result**:
- ✅ Scorekeeper page loads
- ✅ Game data populates correctly
- ✅ UI is mobile-friendly
- ✅ All controls visible and accessible

#### Test 4.2: Score a Goal (Team A)
```
1. Click "Team A Goal" button
2. Observe UI behavior:
   - Score increments immediately (optimistic)
   - Loading state appears briefly
   - Score confirms after server update
3. Check play log for new goal event
4. Open public game page in another tab
5. Verify score updated there too
```

**Expected Result**:
- ✅ Score updates in < 100ms (optimistic)
- ✅ Server confirms update
- ✅ Play log shows new goal
- ✅ Public page updates in real-time
- ✅ No errors in console

#### Test 4.3: Score with Player Selection
```
1. Click "Team B Goal" button
2. If player modal appears:
   - Select a player from roster
   - Confirm selection
3. Verify goal recorded with player name
4. Check play log shows scorer
```

**Expected Result**:
- ✅ Player selection modal works
- ✅ Goal attributed to selected player
- ✅ Play log shows "Goal by [Player Name]"
- ✅ Modal dismisses after selection

#### Test 4.4: Record Turnovers
```
1. Find turnover buttons/dropdown
2. Try each turnover type:
   - Drop
   - Throwaway
   - Block (defensive play)
   - Stall
   - Out of bounds
   - Other
3. Verify possession switches
4. Check play log for turnover events
```

**Expected Result**:
- ✅ All turnover types recordable
- ✅ Possession indicator updates
- ✅ Play log shows turnover type
- ✅ Can attribute to player (optional)

#### Test 4.5: Update Possession
```
1. Click possession toggle/button
2. Verify possession indicator switches teams
3. Check visual feedback (color change, etc.)
4. Confirm in play log if event recorded
```

**Expected Result**:
- ✅ Possession switches instantly
- ✅ Clear visual indicator
- ✅ Updates optimistically
- ✅ Server confirms change

#### Test 4.6: Optimistic Updates Error Handling
```
1. Open Network tab in DevTools
2. Throttle to "Slow 3G" or "Offline"
3. Try to score a goal
4. Observe behavior:
   - Optimistic update shows
   - Loading state appears
   - Error message if fails
   - Score rolls back if server rejects
5. Restore network
6. Try again and verify success
```

**Expected Result**:
- ✅ Optimistic update still shows
- ✅ Error message displays if fails
- ✅ Score rolls back on error
- ✅ User can retry
- ✅ Success works when network restored

#### Test 4.7: Mobile Scorekeeper
```
1. Open scorekeeper on actual mobile device (or responsive mode)
2. Test all controls:
   - Goal buttons (large, touch-friendly?)
   - Possession toggle
   - Turnover recording
   - Player selection
3. Test in "outdoor" conditions:
   - High brightness
   - Contrast sufficient?
   - Text readable in sunlight?
4. Try with gloves (thick fingers)
```

**Expected Result**:
- ✅ Buttons large enough for field use
- ✅ High contrast for outdoor visibility
- ✅ Text readable in bright light
- ✅ Touch targets at least 44x44px
- ✅ No accidental clicks

#### Test 4.8: Concurrent Updates
```
1. Open scorekeeper in Browser A
2. Open same scorekeeper in Browser B
3. Score goal in Browser A
4. Immediately score goal in Browser B
5. Check both browsers and public page
6. Verify final score is correct (both goals counted)
```

**Expected Result**:
- ✅ Both goals recorded
- ✅ No goals lost
- ✅ Final score accurate on all pages
- ✅ Convex handles race conditions
- ✅ No duplicate events

---

### Suite 5: Game Format Support

**Priority**: P0 - Critical  
**Time Estimate**: 20 minutes

#### Test 5.1: Professional Format (AUDL)
```
1. Find a professional format game in seed data
2. Open public game page
3. Verify displays:
   - Four quarters (Q1, Q2, Q3, Q4)
   - Game clock with minutes:seconds
   - Current period indicator
4. Open scorekeeper
5. Verify quarter-specific controls work
```

**Expected Result**:
- ✅ Shows 4 quarters
- ✅ Game clock displays properly
- ✅ Period transitions work
- ✅ Quarter time tracked independently

#### Test 5.2: Tournament Format (USA Ultimate)
```
1. Find a tournament format game
2. Open public game page
3. Verify displays:
   - Points-based (e.g., "First to 15")
   - Current point number
   - No game clock (continuous play)
4. Check for soft cap / hard cap indicators
5. Test scorekeeper for tournament rules
```

**Expected Result**:
- ✅ Shows point-based scoring
- ✅ No time display (continuous)
- ✅ Point target displayed (e.g., "First to 15")
- ✅ Cap indicators if relevant

#### Test 5.3: Recreational Format
```
1. Find a recreational format game
2. Open public game page
3. Verify displays:
   - Halves (1st Half, 2nd Half)
   - Game clock or point target (flexible)
4. Check scorekeeper adapts to format
```

**Expected Result**:
- ✅ Shows halves (if timed)
- ✅ Or shows point target (if untimed)
- ✅ More relaxed rules reflected
- ✅ Format clearly indicated

#### Test 5.4: Mixed Division (Gender Ratios)
```
1. Find a mixed division game
2. Open game page
3. Check for gender ratio display:
   - Current ratio (4M-3F or 3M-4F)
   - Gender indicators on roster
4. If in scorekeeper, check ratio tracking
```

**Expected Result**:
- ✅ Gender ratio displayed
- ✅ Updates with line changes
- ✅ Players marked with gender
- ✅ Ratio validation (4-3 or 3-4)

---

### Suite 6: Performance & Edge Cases

**Priority**: P1 - High  
**Time Estimate**: 20 minutes

#### Test 6.1: Load Performance
```
1. Open DevTools Network tab
2. Hard reload public game page (Cmd+Shift+R)
3. Measure metrics:
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)
4. Target: Page load < 2 seconds
```

**Expected Result**:
- ✅ TTFB < 500ms (SSR working)
- ✅ FCP < 1 second
- ✅ TTI < 2 seconds
- ✅ No large bundle sizes

#### Test 6.2: Real-Time Latency
```
1. Open game page
2. Have another person update score
3. Measure time until update appears
4. Target: < 1 second
```

**Expected Result**:
- ✅ Update appears in < 1 second
- ✅ Smooth transition (no flash)
- ✅ Consistent latency

#### Test 6.3: Error Handling
```
1. Try invalid URLs:
   - /games/invalid-id
   - /admin/scorekeeper/fake-id
2. Verify error pages display
3. Try actions without auth (if possible)
4. Check console for errors
```

**Expected Result**:
- ✅ Friendly error messages
- ✅ No app crashes
- ✅ Proper error boundaries
- ✅ Helpful error text

#### Test 6.4: Data Integrity
```
1. Score 10 goals rapidly (stress test)
2. Check final score matches event count
3. Verify no duplicate events
4. Check all events have timestamps
5. Verify play log order correct
```

**Expected Result**:
- ✅ Score matches event log
- ✅ No duplicates (atomic writes)
- ✅ All events timestamped
- ✅ Correct chronological order

---

## 📊 Test Results Checklist

### Critical (Must Pass)
- [ ] Public game page loads and displays correctly
- [ ] Real-time updates work (< 1 sec latency)
- [ ] Scorekeeper can record goals
- [ ] Optimistic updates work (< 100ms)
- [ ] Mobile responsive on all pages
- [ ] Authentication protects admin routes
- [ ] All three game formats display correctly
- [ ] Data integrity maintained under load

### High Priority (Should Pass)
- [ ] Player selection works in scorekeeper
- [ ] All turnover types recordable
- [ ] Possession tracking works
- [ ] Play log displays all events
- [ ] Error handling graceful
- [ ] Concurrent updates handled correctly
- [ ] Gender ratios display (mixed division)

### Medium Priority (Nice to Have)
- [ ] Page load < 2 seconds
- [ ] Mobile scorekeeper field-ready
- [ ] SEO meta tags present
- [ ] No console errors
- [ ] Smooth animations/transitions

---

## 🐛 Bug Reporting Template

If you find issues, document them like this:

```
**Bug Title**: [Short description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. Step one
2. Step two
3. Expected vs Actual

**Environment**:
- Browser: [Chrome/Safari/Firefox]
- Device: [Desktop/Mobile]
- URL: [Exact URL]

**Screenshots/Videos**: [If applicable]
**Console Errors**: [Any JS errors]
```

---

## 🎯 Next Steps After Testing

1. **Document Issues**: Create a list of bugs found
2. **Prioritize Fixes**: Critical bugs first
3. **Update Features**: Add missing features identified during testing
4. **Performance Optimization**: Address any slow areas
5. **Deploy to Production**: Once tests pass

---

## 🔗 Related Documentation

- **Scorekeeper Guide**: `/SCOREKEEPER.md`
- **Admin Dashboard**: `/ADMIN-DASHBOARD.md`
- **Database Population**: `/POPULATE-DATABASE.md`
- **SSR Fix**: `/SSR-FIX.md`
- **Implementation Plan**: `/memory-bank/implementation-plan.md`

---

## ✅ Sign-Off

**Tester Name**: ________________  
**Date**: ________________  
**Overall Status**: ⏳ In Progress / ✅ Passed / ❌ Failed  

**Notes**:
_[Add any additional observations or recommendations]_


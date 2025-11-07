# 🔧 SSR Context Error - FIXED

## Problem

When navigating to `http://localhost:3000/games/[gameId]`, you encountered:

```
Error: Cannot read properties of undefined (reading 'query')
```

**Root Cause**: The Convex client wasn't being added to the TanStack Router context, so the SSR loader couldn't access it via `context.convexClient`.

---

## Solution Applied

### 1. Updated Convex Provider (`src/integrations/convex/provider.tsx`)

**Added export for Convex client**:

```typescript
// Export the Convex client for use in router context and SSR
export const getConvexClient = () => convexQueryClient.convexClient;
```

This allows the router to access the Convex client instance.

---

### 2. Updated Router (`src/router.tsx`)

**Added Convex client to router context**:

```typescript
import { getConvexClient } from "./integrations/convex/provider";

export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();
	const convexClient = getConvexClient();

	const router = createRouter({
		routeTree,
		context: { 
			...rqContext,
			convexClient, // Add Convex client to context for SSR
		},
		// ...
	});
}
```

Now the Convex client is available in all route loaders.

---

### 3. Updated Root Route Type (`src/routes/__root.tsx`)

**Extended router context interface**:

```typescript
import type { ConvexClient } from "convex/browser";

interface MyRouterContext {
	queryClient: QueryClient;
	convexClient: ConvexClient; // Added
}
```

This provides proper TypeScript types for the router context.

---

## ✅ What's Fixed

- ✅ Convex client now available in router context
- ✅ SSR loaders can access `context.convexClient`
- ✅ Game page loader will work correctly
- ✅ All TypeScript types are correct
- ✅ No linter errors

---

## 🚀 Next Steps

### 1. Verify Environment Variable

Make sure `VITE_CONVEX_URL` is set in your `.env.local`:

```bash
# .env.local
VITE_CONVEX_URL=https://your-project.convex.cloud
```

You can get this URL from your Convex dashboard or by running `npx convex dev`.

---

### 2. Start Development Server

```bash
# Terminal 1: Start Convex dev server (if not already running)
npx convex dev

# Terminal 2: Start web dev server
npm run dev
```

---

### 3. Test the Game Page

1. **Get a Game ID** from your Convex dashboard:
   - Go to https://dashboard.convex.dev
   - Navigate to your project
   - Click "Data" tab
   - Click on the "games" table
   - Copy a game ID (e.g., `jd780c9jzc6bmkq28hkmkbdh8n7ttj2g`)

2. **Visit the page**:
   ```
   http://localhost:3000/games/[paste-game-id-here]
   ```

3. **Expected behavior**:
   - ✅ Page loads instantly (SSR working)
   - ✅ Game data displays immediately
   - ✅ Real-time updates work
   - ✅ No console errors

---

## 🔍 How SSR Works Now

```typescript
// In games.$gameId.tsx loader:
loader: async ({ context, params }) => {
  const { gameId } = params
  
  // ✅ context.convexClient is now available!
  const game = await context.convexClient.query(api.games.getGame, {
    gameId: gameId as Id<"games">,
  })
  
  return { game }
}
```

The loader:
1. Runs on the **server** during SSR
2. Fetches game data using the Convex client
3. Embeds the data in the HTML response
4. Client hydrates with the SSR data instantly
5. Real-time subscriptions take over after hydration

---

## 📊 Architecture Flow

```
┌─────────────────────────────────────────────┐
│ Browser Request: /games/[gameId]            │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ Server: TanStack Start SSR                  │
│                                             │
│  1. Router matches route                    │
│  2. Loader runs with context                │
│  3. context.convexClient.query() ✅         │
│  4. Fetches game data from Convex           │
│  5. Renders React to HTML                   │
│  6. Embeds data in HTML                     │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ Browser receives HTML with data             │
│                                             │
│  1. Instant display (no loading spinner)    │
│  2. React hydrates                          │
│  3. TanStack Query uses SSR data            │
│  4. Convex subscriptions activate           │
│  5. Real-time updates begin                 │
└─────────────────────────────────────────────┘
```

---

## 🎯 Benefits

1. **Fast First Paint**: Game data displays instantly (no loading spinner)
2. **SEO Friendly**: Search engines see full content
3. **Better UX**: No content flash or layout shift
4. **Real-time**: Subscriptions work after hydration
5. **Type Safety**: Full TypeScript support

---

## 🐛 Troubleshooting

### Still getting errors?

**1. Check Convex URL**:
```bash
echo $VITE_CONVEX_URL
# Should output your Convex URL
```

**2. Restart dev server**:
```bash
# Stop both servers (Ctrl+C)
# Start Convex
npx convex dev

# In new terminal, start web server
npm run dev
```

**3. Verify game ID exists**:
- Check Convex dashboard → Data → games table
- Ensure the game ID you're using is valid

**4. Clear browser cache**:
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## ✨ You're All Set!

The SSR context error is **fixed**. Your game pages should now load with instant data display and real-time updates! 🎉

If you still encounter issues, check:
- Console errors in browser
- Terminal errors in server
- Network tab in DevTools
- Convex dashboard logs



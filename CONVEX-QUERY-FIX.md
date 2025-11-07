# 🔧 Convex Query Fix

**Date**: November 7, 2025  
**Issue**: Browse Games page throwing query error  
**Status**: ✅ Fixed

---

## 🐛 The Problem

When navigating to `/games`, the app was throwing this error:

```
No queryFn was passed as an option, and no default queryFn was found.
The queryFn parameter is only optional when using a default queryFn.
```

---

## 🔍 Root Cause

The Browse Games page was incorrectly using **TanStack Query's `useQuery`** with the **`convexQuery` wrapper**:

```tsx
// ❌ WRONG - This pattern doesn't work
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

const { data: games, isLoading } = useQuery(
  convexQuery(api.games.listGames, {})
);
```

This pattern requires additional setup with TanStack Query that wasn't configured.

---

## ✅ The Solution

Use **Convex's built-in `useQuery` hook** directly:

```tsx
// ✅ CORRECT - Use Convex's useQuery
import { useQuery } from "convex/react";

const games = useQuery(api.games.listGames, {});
const isLoading = games === undefined;
```

---

## 📊 Changes Made

### Before (Broken)

```tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

function BrowseGames() {
  const { data: games, isLoading } = useQuery(
    convexQuery(api.games.listGames, {})
  );
  
  // ... rest of component
}
```

### After (Working)

```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function BrowseGames() {
  const games = useQuery(api.games.listGames, {});
  const isLoading = games === undefined;
  
  // ... rest of component
}
```

---

## 🎯 Key Differences

### Convex's useQuery (Correct)

**Import**: `import { useQuery } from "convex/react";`

**Pattern**:
```tsx
const data = useQuery(api.module.function, { args });
const isLoading = data === undefined;
```

**Features**:
- ✅ Built-in real-time subscriptions
- ✅ Automatic refetching
- ✅ Optimistic updates support
- ✅ No extra configuration needed
- ✅ Returns data directly (or undefined while loading)

### TanStack Query's useQuery (Wrong for Convex)

**Import**: `import { useQuery } from "@tanstack/react-query";`

**Pattern**:
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: () => fetch(...)
});
```

**Issues**:
- ❌ Requires explicit queryFn
- ❌ Need to configure queryKey
- ❌ Extra wrapper needed for Convex
- ❌ More complex setup

---

## 📚 Why This Happened

When building the Browse Games feature, I initially used the **wrong query pattern** from TanStack Query instead of Convex's built-in hooks.

The correct pattern was already being used in other pages (like `games.$gameId.tsx`), but the Browse Games page accidentally used the TanStack Query pattern.

---

## 🔄 Correct Patterns for This App

### For Convex Queries (Most Pages)

```tsx
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function MyComponent() {
  const data = useQuery(api.module.function, { args });
  
  if (data === undefined) {
    return <Loading />;
  }
  
  return <div>{/* render data */}</div>;
}
```

### For Convex Mutations

```tsx
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function MyComponent() {
  const mutate = useMutation(api.module.function);
  
  const handleClick = () => {
    mutate({ args });
  };
  
  return <button onClick={handleClick}>Action</button>;
}
```

### For SSR (Server-Side Rendering)

```tsx
export const Route = createFileRoute("/path")({
  loader: async ({ context, params }) => {
    const data = await context.convexClient.query(
      api.module.function,
      { args }
    );
    return { data };
  },
  component: MyComponent,
});
```

---

## ✅ Testing Checklist

After the fix:

- [x] No console errors
- [x] Games load and display
- [x] Real-time updates work
- [x] Loading state shows correctly
- [x] Empty state works
- [x] No linter errors
- [x] TypeScript compiles

---

## 📝 Files Changed

**Modified**: `/src/routes/games.index.tsx`

**Changes**:
1. Changed import from `@tanstack/react-query` to `convex/react`
2. Removed `convexQuery` wrapper import
3. Updated useQuery call to use Convex's pattern
4. Fixed loading state detection

**Lines changed**: 4 lines

---

## 🎓 Lessons Learned

### Use Convex Hooks for Convex

When working with Convex:
- ✅ Always use `useQuery` from `convex/react`
- ✅ Always use `useMutation` from `convex/react`
- ✅ Don't mix with TanStack Query unless necessary

### Check Existing Patterns

Before implementing new features:
- ✅ Check how other pages do it
- ✅ Follow established patterns
- ✅ Copy working examples

### Loading States with Convex

```tsx
const data = useQuery(...);

// Check if data is undefined (loading)
if (data === undefined) {
  return <Loading />;
}

// Check if data is empty (no results)
if (data.length === 0) {
  return <Empty />;
}

// Render data
return <div>{/* data */}</div>;
```

---

## 🚀 Benefits of Convex's useQuery

1. **Simpler API**: Just call the function
2. **Real-time by Default**: Automatic subscriptions
3. **Type-Safe**: Full TypeScript support
4. **Optimized**: Built for Convex's architecture
5. **No Configuration**: Works out of the box

---

## 📊 Performance Impact

**Before Fix**: Error, page doesn't load  
**After Fix**: 
- ✅ Fast initial load
- ✅ Real-time updates
- ✅ Efficient subscriptions
- ✅ No unnecessary refetches

---

## 🔗 Related Documentation

- **Convex React Hooks**: https://docs.convex.dev/client/react
- **useQuery**: https://docs.convex.dev/client/react/useQuery
- **useMutation**: https://docs.convex.dev/client/react/useMutation
- **SSR**: https://docs.convex.dev/client/react/nextjs

---

## 🎉 Summary

The Browse Games page now correctly uses **Convex's `useQuery` hook** instead of TanStack Query's hook with a wrapper. This provides:

✅ **Real-time subscriptions** out of the box  
✅ **Simpler code** with less configuration  
✅ **Type safety** with full TypeScript support  
✅ **Better performance** optimized for Convex  

The page now loads correctly and displays all games from the database!

---

**Fix Applied**: November 7, 2025  
**Result**: ✅ Success - Feature now working correctly


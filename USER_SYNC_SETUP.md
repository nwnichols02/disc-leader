# User Sync Setup Complete ✅

## What Was Fixed

The "User not found" error occurred because when you signed in with Clerk, your user record didn't exist in Convex's database yet.

## Solution Implemented

I've created an automatic user sync system:

### 1. `src/components/UserSync.tsx` (New)

This component automatically:
- Detects when a user signs in with Clerk
- Creates their user record in Convex if it doesn't exist
- Runs once per session to avoid duplicate calls

### 2. Updated `src/routes/__root.tsx`

Added the `UserSync` component so it runs on every page, ensuring users are always synced.

## How It Works

```
User signs in with Clerk
        ↓
UserSync component detects authentication
        ↓
Checks if user exists in Convex
        ↓
Creates user record if missing
        ↓
Mutations now work! ✅
```

## Default User Role

By default, new users are created with the **admin** role. You can change this in `src/components/UserSync.tsx` line 34:

```typescript
role: 'admin', // Change to 'scorekeeper' or 'viewer' if needed
```

## Testing It

1. **Sign out** if you're currently signed in
2. **Sign in again**
3. Check your browser console - you should see: `User synced with Convex`
4. Try creating a game or recording a goal - it should work now!

## Customizing User Roles

You can add logic to assign different roles based on email, domain, etc.:

```typescript
// Example: Make certain emails admins
const role = user.primaryEmailAddress?.emailAddress?.endsWith('@yourcompany.com')
  ? 'admin'
  : 'viewer'
```

## Troubleshooting

### Still getting "User not found"?

1. **Check the console** for any sync errors
2. **Sign out and sign in again** to trigger the sync
3. **Check Convex logs**: Run `npx convex logs` to see if the user was created
4. **Verify the mutation**: Make sure `createUser` mutation exists in `convex/gameMutations.ts`

### How to verify users are being created

You can query the users table using Convex dashboard or add this test component:

```typescript
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

function UserDebug() {
  const user = useQuery(api.gameMutations.getCurrentUser) // You'd need to create this query
  return <pre>{JSON.stringify(user, null, 2)}</pre>
}
```

## Next Steps

Your app should now work end-to-end:
- ✅ Clerk authentication
- ✅ Convex auth integration
- ✅ Automatic user sync
- ✅ Mutations working

Try recording a goal or creating a game!


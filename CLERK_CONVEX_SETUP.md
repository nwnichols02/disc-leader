# Clerk + Convex Authentication Setup

This guide will help you configure Clerk authentication with Convex so that mutations work properly.

## The Problem

You're getting `Uncaught Error: Not authenticated` because your Convex backend doesn't know how to validate Clerk JWT tokens yet.

## The Solution

Follow these steps to connect Clerk with Convex:

### Step 1: Create a Clerk JWT Template

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Configure** → **JWT Templates**
4. Click **New template**
5. Choose **Convex** from the template list (or create a blank one)
6. Name it exactly: `convex`
7. Click **Save**
8. Copy the **Issuer** URL (it looks like: `https://YOUR_DOMAIN.clerk.accounts.dev`)

### Step 2: Configure Convex with Clerk Issuer

You have two options:

#### Option A: Using Convex Dashboard (Recommended)

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Name**: `CLERK_ISSUER_URL`
   - **Value**: The Issuer URL you copied from Clerk (e.g., `https://your-domain.clerk.accounts.dev`)
5. Click **Save**

#### Option B: Using Convex CLI

Run this command in your terminal (replace with your actual issuer URL):

```bash
npx convex env set CLERK_ISSUER_URL "https://your-domain.clerk.accounts.dev"
```

### Step 3: Verify the Setup

1. Make sure you're signed in to your app (check that Clerk authentication is working)
2. Try creating a game or performing any mutation
3. The `Not authenticated` error should be gone!

## What Changed in Your Code

I've already updated these files for you:

### 1. `src/integrations/convex/provider.tsx`

Changed from:
```typescript
<ConvexProvider client={convexQueryClient.convexClient}>
```

To:
```typescript
<ConvexProviderWithClerk client={convexQueryClient.convexClient} useAuth={useAuth}>
```

This tells Convex to use Clerk's authentication tokens.

### 2. `convex/auth.config.js` (New File)

This file configures Convex to accept and validate Clerk JWT tokens.

## Troubleshooting

### Still getting "Not authenticated"?

1. **Check you're signed in**: Make sure you can see your user profile in the app
2. **Verify the issuer URL**: Make sure it matches exactly what's in Clerk (including `https://` and no trailing slash)
3. **Restart your dev server**: After setting the env variable, restart both:
   - Your frontend dev server: `bun run dev`
   - Your Convex dev deployment: `npx convex dev`
4. **Check Convex logs**: Run `npx convex logs` to see if there are any authentication errors

### How to verify it's working:

Add this test query to check if authentication is working:

```typescript
// In convex/test.ts
import { query } from "./_generated/server"

export const testAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    return {
      isAuthenticated: !!identity,
      userId: identity?.subject,
      email: identity?.email,
    }
  },
})
```

Then call it from your app to see if it returns your user info.

## Additional Resources

- [Convex + Clerk Documentation](https://docs.convex.dev/auth/clerk)
- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)


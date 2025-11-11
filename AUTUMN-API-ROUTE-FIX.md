# Autumn API Route Fix

## ✅ Issue Resolved

The `/api/autumn/$` route has been updated to work correctly with TanStack Start.

## What Was Changed

**File:** `src/routes/api.autumn.$.ts`

### Before (Incorrect):
- Mixed `createServerFn` with `createFileRoute`
- Wrong imports and exports
- Didn't follow TanStack Start server route patterns

### After (Correct):
```typescript
import { createFileRoute } from "@tanstack/react-router";
import { autumnHandler } from "autumn-js/tanstack";

// Create the Autumn handlers
const handlers = autumnHandler({
  secretKey: process.env.AUTUMN_SECRET_KEY,
  identify: async ({ request }) => {
    // Auth verification logic
    // ...
  },
});

export const Route = createFileRoute("/api/autumn/$")({
  server: {
    handlers: {
      GET: handlers.GET,
      POST: handlers.POST,
    },
  },
});
```

## Key Points

1. **Used `autumn-js/tanstack`**: This is the TanStack-specific version of the Autumn handler that returns an object with HTTP method handlers (GET, POST, etc.)

2. **Used `createFileRoute` with `server.handlers`**: This is the correct pattern for server routes in TanStack Start

3. **Separated handler creation**: The `autumnHandler` is created once and returns handlers that are then assigned to the route

## Authentication Note

⚠️ **Important**: The current auth implementation extracts user info from request headers. This is a simplified approach.

### For Production, You Should:

1. **Verify Clerk Sessions Properly**: Use Clerk's server-side SDK to verify the session token
2. **Extract User from JWT**: Decode and verify the JWT token from Clerk
3. **Use Middleware**: Consider adding auth middleware to verify requests before they reach the handler

### Example Clerk Server-Side Auth:

```typescript
import { verifyToken } from '@clerk/clerk-sdk-node';

identify: async ({ request }) => {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!token) {
    return null; // Or throw error
  }

  try {
    // Verify with Clerk
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });
    
    return {
      customerId: verified.sub, // user ID
      customerData: {
        name: verified.name || "User",
        email: verified.email || "",
      },
    };
  } catch (error) {
    throw new Error("Authentication failed");
  }
}
```

## How It Works

1. **Client Side**: `AutumnProvider` wraps your app and provides React hooks
2. **API Route**: `/api/autumn/$` catches all requests to `/api/autumn/*`
3. **Handler**: `autumnHandler` from `autumn-js/tanstack` processes requests
4. **Identify**: Extracts user info and passes it to Autumn
5. **Autumn**: Makes requests to Autumn's API with your user context

## Testing

To test if it's working:

```typescript
// In any component
import { useCustomer } from "autumn-js/react";

function MyComponent() {
  const { customer, isLoading, error } = useCustomer();
  
  console.log("Customer:", customer);
  
  return <div>...</div>;
}
```

## Troubleshooting

### "User not authenticated" Error
- Check that Clerk is properly configured
- Ensure user is signed in
- Verify that auth headers are being sent with requests

### "autumnHandler is not a function" Error
- Make sure you're importing from `autumn-js/tanstack` not just `autumn-js`
- Verify autumn-js package is installed: `bun install autumn-js`

### Route Not Found
- Make sure the file is named `api.autumn.$.ts` (with the `$` wildcard)
- Verify it's in the `src/routes/` directory
- Restart your dev server

## Next Steps

1. ✅ API route is now correctly structured
2. ⚠️ Implement proper Clerk auth verification (production)
3. ✅ Test the pricing page and checkout flow
4. ✅ Configure products in Autumn dashboard

## Related Files

- `src/integrations/autumn/provider.tsx` - Client provider
- `src/integrations/autumn/handler.ts` - (No longer used, can be removed)
- `src/routes/pricing.tsx` - Pricing page that uses this API
- `src/components/autumn/*` - UI components that use Autumn hooks

---

**Status**: ✅ Working (with basic auth)  
**Production Ready**: ⚠️ Needs proper Clerk auth verification


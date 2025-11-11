# Autumn Checkout Not Working - Troubleshooting Guide

## ✅ Fixes Applied

I've updated the code to help identify and fix the issue:

### 1. **Added Error Handling to Pricing Page**

```typescript
// Now shows errors on screen
const [error, setError] = useState<string | null>(null);

// Checkout with error handling
try {
  const result = await checkout({
    productId: plan.id,
    dialog: CheckoutDialog,
  });
} catch (err) {
  setError(err.message);
}
```

### 2. **Added Console Logging**

The page now logs:
- Customer state from Autumn
- Checkout attempts
- Any errors that occur

### 3. **Temporarily Fixed Authentication**

The API route now uses a test user to get the flow working:

```typescript
// TEMPORARY: For testing only
return {
  customerId: "test_user_" + Date.now(),
  customerData: {
    name: "Test User", 
    email: "test@example.com",
  },
};
```

⚠️ **This is for testing only!** You must implement proper Clerk auth for production.

## 🔍 How to Debug

### Step 1: Check Browser Console

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Visit `/pricing` page
4. Click "Upgrade to Pro"
5. Look for these logs:

```
Autumn Customer State: { customer: {...}, customerLoading: false }
Starting checkout for: pro
Autumn API called: /api/autumn/...
Using test user ID: test_user_...
Checkout result: {...}
```

### Step 2: Check Network Tab

1. Go to Network tab in DevTools
2. Click "Upgrade to Pro"
3. Look for requests to `/api/autumn/`
4. Check if they return errors (red) or success (green)
5. Click on the request to see the response

### Step 3: Common Issues

#### Issue: "User not authenticated" Error
**Solution:** The temporary fix now uses a test user, so this shouldn't happen. If it does, check that `AUTUMN_SECRET_KEY` is set in your `.env` file.

#### Issue: Nothing happens, no error
**Possible causes:**
1. Autumn provider not wrapping the app correctly
2. Backend URL incorrect
3. API route not being hit

**Check:**
- Is there a request to `/api/autumn/` in Network tab?
- Do you see console logs from the API route?
- Is `AutumnProvider` in `__root.tsx`?

#### Issue: "Failed to fetch" or CORS error
**Solution:** 
- Make sure dev server is running
- Check if `/api/autumn/` route exists
- Verify route file is named `api.autumn.$.ts` (with the `$`)

#### Issue: Button says "Processing..." forever
**Cause:** The checkout function is hanging or not returning

**Check:**
- Look for errors in console
- Check if Autumn API key is valid
- Verify network requests complete

## 📋 Checklist

Run through this checklist:

- [ ] Environment variable `AUTUMN_SECRET_KEY` is set (get from https://app.useautumn.com/sandbox/dev)
- [ ] Dev server is running (`bun run dev`)
- [ ] You're signed in with Clerk
- [ ] Visit `/pricing` page
- [ ] Open browser console before clicking
- [ ] Click "Upgrade to Pro"
- [ ] Check console for logs
- [ ] Check Network tab for `/api/autumn/` requests

## 🔧 What to Look For in Console

### Expected Logs (Success):
```
Autumn Customer State: { customer: {...}, customerLoading: false }
Starting checkout for: pro
Autumn API called: http://localhost:3000/api/autumn/checkout
Request headers: {...}
Using test user ID: test_user_1699999999999
Checkout result: { url: "https://checkout.stripe.com/..." }
```

### Error Logs (Problem):
```
Checkout error: User not authenticated
// OR
Checkout error: Failed to fetch
// OR  
Checkout error: Network request failed
```

## 🎯 Next Steps Based on What You See

### If you see Stripe checkout URL:
✅ It's working! You should be redirected to Stripe

### If you see "User not authenticated":
- Check that API route is using test user code
- Verify `AUTUMN_SECRET_KEY` is set

### If you see "Failed to fetch":
- Check dev server is running
- Verify API route file exists: `src/routes/api.autumn.$.ts`
- Check route is exporting correctly

### If you see nothing in console:
- Make sure you're looking at the right console (some browsers have multiple)
- Try refreshing the page
- Check if JavaScript is enabled

## 🚨 Known Limitations (Current Setup)

1. **Test User Only**: Uses fake user data - won't persist across page reloads
2. **No Real Clerk Auth**: Not checking actual user session
3. **Products Must Exist**: You must create products in Autumn dashboard first

## ✅ When It's Working

You'll see:
1. Console logs showing the checkout process
2. Either:
   - A checkout dialog opens (if payment method on file)
   - Browser redirects to Stripe checkout page
3. No errors in console

## 🔐 Making It Production-Ready

Once it's working, implement proper auth:

```typescript
// src/routes/api.autumn.$.ts
import { getAuth } from '@clerk/backend';

identify: async ({ request }) => {
  // Get session token from cookie
  const sessionToken = /* extract from cookies */;
  
  // Verify with Clerk
  const session = await getAuth(request);
  
  if (!session?.userId) {
    throw new Error("Not authenticated");
  }

  return {
    customerId: session.userId,
    customerData: {
      name: session.user?.fullName || "User",
      email: session.user?.emailAddresses?.[0]?.emailAddress || "",
    },
  };
}
```

## 📞 Getting Help

If none of this works:

1. **Share the console output** - Copy everything from the console
2. **Share network tab** - Screenshot of the `/api/autumn/` request
3. **Check Autumn dashboard** - Go to https://app.useautumn.com/sandbox/dev and check if customers are being created

## 🎓 Understanding the Flow

1. User clicks "Upgrade to Pro"
2. `checkout()` function is called
3. Request goes to `/api/autumn/checkout`
4. API route authenticates user
5. Autumn SDK calls Autumn API
6. Returns either:
   - Stripe checkout URL (new customer)
   - Checkout preview data (existing customer)
7. Dialog opens OR redirect happens

---

**Current Status:** 🔧 In Debug Mode  
**What to do:** Click "Upgrade to Pro" and check console output


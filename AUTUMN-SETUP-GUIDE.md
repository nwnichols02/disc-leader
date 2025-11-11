# 🚀 Autumn Pricing Setup - Quick Start Guide

## ✅ What's Already Done

All code has been implemented! Here's what's ready:

- ✅ Autumn provider integrated
- ✅ Pricing page created at `/pricing`
- ✅ Checkout dialog component
- ✅ Feature gating utilities
- ✅ Payment alerts
- ✅ Admin dashboard integration
- ✅ Navigation updated with pricing link
- ✅ Environment variable configured

## 📋 What You Need to Do Next

### Step 1: Configure Autumn Dashboard (5 minutes)

1. **Go to Autumn Dashboard**
   - Visit: https://app.useautumn.com/sandbox/dev
   - Sign in with your account

2. **Create Products**
   
   Create three products with these exact IDs:
   
   **Free Tier:**
   - Product ID: `free`
   - Name: "Free"
   - Price: $0
   - Set as default product
   
   **Pro Tier:**
   - Product ID: `pro`
   - Name: "Pro"
   - Price: $10/month
   - Billing interval: monthly
   
   **Premium Tier:**
   - Product ID: `premium`
   - Name: "Premium"
   - Price: $25/month
   - Billing interval: monthly

3. **Add Features (Optional)**
   
   If you want to enforce limits on the free tier:
   
   - Feature ID: `games` - Limit: 5 for free, unlimited for pro/premium
   - Feature ID: `teams` - Limit: 2 for free, unlimited for pro/premium

### Step 2: Connect Stripe (5 minutes)

1. **Get Stripe Test Keys**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your **Test Secret Key** (starts with `sk_test_`)

2. **Add to Autumn**
   - In Autumn dashboard, go to Settings → Integrations
   - Paste your Stripe test secret key
   - Save

3. **Verify in .env**
   ```bash
   AUTUMN_SECRET_KEY=am_sk_... # Your Autumn key (already set)
   ```

### Step 3: Test the Integration (10 minutes)

1. **Start your dev server**
   ```bash
   bun run dev
   ```

2. **Test the pricing page**
   - Navigate to `http://localhost:3000/pricing`
   - You should see all three tiers displayed

3. **Test checkout flow**
   - Sign in with Clerk
   - Click "Upgrade to Pro"
   - You'll be redirected to Stripe checkout
   - Use test card: `4242 4242 4242 4242`
   - Any future date and any CVC

4. **Verify subscription**
   - After successful checkout, you should be redirected back
   - Go to `/admin` dashboard
   - You should see a "Pro Member" badge
   - The upgrade banner should disappear

5. **Test feature gating**
   - Try the admin dashboard
   - Notice the upgrade prompts appear as you near limits (on free tier)
   - As a Pro member, you should have unlimited access

## 🧪 Stripe Test Cards

For testing different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires authentication |
| `4000 0000 0000 9995` | Declined |
| `4000 0000 0000 0002` | Charge succeeds, subscription fails |

Use any:
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

## 🎯 What Users Will See

### Free Tier Users (Default)
- Access to 5 games max
- Access to 2 teams max
- Basic scorekeeping
- Upgrade prompts when nearing limits
- Banner in admin dashboard showing usage

### Pro Users ($10/month)
- Unlimited games
- Unlimited teams
- Live scoreboard
- Advanced analytics
- Green "Pro Member" badge in dashboard

### Premium Users ($25/month)
- Everything in Pro
- Tournament management
- Custom branding
- Priority support
- Green "Premium Member" badge

## 🔧 Customization Options

### Change Pricing
1. Update prices in Autumn dashboard
2. Update the pricing page copy if needed (`src/routes/pricing.tsx`)

### Add More Features
1. Define features in Autumn dashboard
2. Add feature checks in `src/utils/feature-gates.ts`
3. Use `useFeatureAccess()` hook to gate features

### Modify Limits
Change limits in `src/utils/feature-gates.ts`:
```typescript
maxGames: isPro || isPremium ? Infinity : 5,  // Change 5 to your limit
maxTeams: isPro || isPremium ? Infinity : 2,  // Change 2 to your limit
```

### Customize Checkout Dialog
Edit `src/components/autumn/checkout-dialog.tsx` to match your brand.

## 📱 Customer Self-Service

Users can manage their subscription via Stripe's billing portal:

```typescript
const { openBillingPortal } = useCustomer();

await openBillingPortal({ 
  returnUrl: window.location.href 
});
```

This allows users to:
- Update payment methods
- View invoices
- Cancel subscriptions
- Update billing information

## 🚨 Important Notes

1. **Test Mode**: You're currently in test mode. No real charges will be made.

2. **Production**: When ready for production:
   - Get Stripe live keys
   - Update Autumn to production mode
   - Update environment variables
   - Test thoroughly before launch

3. **Webhooks**: Autumn handles all Stripe webhooks automatically. No configuration needed!

4. **PCI Compliance**: All payment data is handled by Stripe. You never touch card data.

## 🆘 Troubleshooting

### "Customer not authenticated" error
- Make sure Clerk is properly configured
- User must be signed in to access pricing features

### Checkout not working
- Verify AUTUMN_SECRET_KEY is set correctly
- Check Stripe keys are added in Autumn dashboard
- Look at browser console for errors

### Subscription not showing
- Check that product IDs match exactly (`free`, `pro`, `premium`)
- Verify checkout completed successfully
- Check Autumn dashboard for customer record

### Features not gating properly
- Ensure user is on correct subscription tier
- Check `useFeatureAccess()` hook is being called
- Verify product status is "active"

## 📚 Resources

- **Autumn Docs**: https://docs.useautumn.com
- **Autumn Dashboard**: https://app.useautumn.com
- **Stripe Docs**: https://stripe.com/docs
- **Test Cards**: https://stripe.com/docs/testing

## ✨ Next Steps After Setup

1. **Add more feature gates** where needed
2. **Customize pricing page** with your branding
3. **Add usage tracking** if using metered billing
4. **Set up email notifications** for subscription events
5. **Add analytics** to track conversion rates
6. **Consider free trials** to boost conversions

---

**Need Help?** Check the full implementation details in `AUTUMN-PRICING-SETUP.md`

**Ready to go live?** Switch to production mode in Autumn dashboard and update your Stripe keys!


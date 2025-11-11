import { useCustomer } from "autumn-js/react";

export function useFeatureAccess() {
  const { customer } = useCustomer();

  const isPro = customer?.products?.find((p) => p.id === "pro" && p.status === "active");
  const isPremium = customer?.products?.find((p) => p.id === "premium" && p.status === "active");

  return {
    // Free tier limits
    isFree: !isPro && !isPremium,
    
    // Pro features
    isPro: !!isPro,
    canCreateUnlimitedGames: !!isPro || !!isPremium,
    canCreateUnlimitedTeams: !!isPro || !!isPremium,
    canAccessLiveScoreboard: !!isPro || !!isPremium,
    hasAdvancedAnalytics: !!isPro || !!isPremium,
    
    // Premium features
    isPremium: !!isPremium,
    canManageTournaments: !!isPremium,
    hasCustomBranding: !!isPremium,
    hasPrioritySupport: !!isPremium,
    
    // Usage limits for free tier
    maxGames: isPro || isPremium ? Infinity : 5,
    maxTeams: isPro || isPremium ? Infinity : 2,
  };
}

export function useHasFailedPayment() {
  const { customer } = useCustomer();
  return customer?.products?.some((p) => p.status === "past_due") ?? false;
}


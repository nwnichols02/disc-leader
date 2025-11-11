import { createFileRoute } from "@tanstack/react-router";
import { autumnHandler } from "autumn-js/tanstack";

// Create the Autumn handlers
const handlers = autumnHandler({
  secretKey: process.env.AUTUMN_SECRET_KEY,
  identify: async ({ request }) => {
    // TEMPORARY: For testing, we'll create a test user
    // In production, you MUST verify the Clerk session token here
    
    console.log("Autumn API called:", request.url);
    console.log("Request headers:", Object.fromEntries(request.headers.entries()));
    
    // Try to get Clerk session from cookie
    const cookies = request.headers.get("cookie") || "";
    console.log("Cookies:", cookies);
    
    // For now, return a test user to get the flow working
    // TODO: Replace with proper Clerk authentication
    const testUserId = "test_user_" + Date.now();
    
    console.log("Using test user ID:", testUserId);
    
    return {
      customerId: testUserId,
      customerData: {
        name: "Test User",
        email: "test@example.com",
      },
    };
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

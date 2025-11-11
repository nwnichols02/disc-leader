import { createFileRoute } from "@tanstack/react-router";
import { autumnHandler } from "autumn-js/tanstack";

// Create the Autumn handlers
const handlers = autumnHandler({
  secretKey: process.env.AUTUMN_SECRET_KEY,
  identify: async ({ request }) => {
    // For server-side auth in TanStack Start, we need to extract the auth token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    // This is a simplified approach - you may need to verify the token properly
    if (!token) {
      throw new Error("User not authenticated");
    }

    // Extract user info from request or session
    // Note: This is a placeholder - you'll need to implement proper auth verification
    const userId = request.headers.get("x-clerk-user-id");
    if (!userId) {
      throw new Error("User ID not found");
    }

    return {
      customerId: userId,
      customerData: {
        name: request.headers.get("x-clerk-user-name") || "User",
        email: request.headers.get("x-clerk-user-email") || "",
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

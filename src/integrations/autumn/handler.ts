import { autumnHandler } from "autumn-js";
import { getAuth } from "@clerk/tanstack-start/server";

export function createAutumnHandler() {
  return autumnHandler({
    secretKey: process.env.AUTUMN_SECRET_KEY,
    identify: async (req: Request) => {
      const auth = await getAuth(req);
      
      if (!auth?.userId) {
        throw new Error("User not authenticated");
      }

      return {
        customerId: auth.userId,
        customerData: {
          name: auth.user?.fullName || auth.user?.username || "User",
          email: auth.user?.emailAddresses?.[0]?.emailAddress || "",
        },
      };
    },
  });
}


/**
 * UserSync Component
 *
 * Automatically creates a Convex user record when a user signs in with Clerk.
 * This ensures that the user exists in the Convex database before they try
 * to perform any mutations.
 */

import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
	const { user, isSignedIn } = useUser();
	const createUser = useMutation(api.gameMutations.createUser);
	const syncedRef = useRef(false);

	useEffect(() => {
		// Only run once per session and only if signed in
		if (!isSignedIn || !user || syncedRef.current) {
			return;
		}

		// Mark as synced to prevent duplicate calls
		syncedRef.current = true;

		// Create or update user in Convex
		const syncUser = async () => {
			try {
				await createUser({
					clerkId: user.id,
					email: user.primaryEmailAddress?.emailAddress || "",
					name: user.fullName || user.firstName || "User",
					role: "admin", // Default to admin, you can change this logic
				});
				console.log("User synced with Convex");
			} catch (error) {
				console.error("Failed to sync user with Convex:", error);
				// Reset sync flag to retry on next render
				syncedRef.current = false;
			}
		};

		syncUser();
	}, [isSignedIn, user, createUser]);

	// This component doesn't render anything
	return null;
}

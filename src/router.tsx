import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { ConvexClient } from "convex/browser";
import { env } from "@/env";
import { getConvexClient } from "@/integrations/convex/provider";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();
	const convexClient = getConvexClient();

	const router = createRouter({
		routeTree,
		context: {
			...rqContext,
			convexClient: convexClient as unknown as ConvexClient, // Add Convex client to context for SSR
		},
		defaultPreload: "intent",
		defaultViewTransition: {
			types: (locationChangeInfo) => {
				// Skip transitions for hash changes only
				if (locationChangeInfo.hashChanged && !locationChangeInfo.pathChanged) {
					return false;
				}
				// Use different transition types based on route depth
				const toDepth = locationChangeInfo.toLocation.pathname
					.split("/")
					.filter(Boolean).length;
				const fromDepth =
					locationChangeInfo.fromLocation?.pathname.split("/").filter(Boolean)
						.length || 0;

				// Determine transition direction based on depth change
				if (toDepth > fromDepth) {
					// Going deeper - slide in from right
					return ["slide-right"];
				} else if (toDepth < fromDepth) {
					// Going back - slide in from left
					return ["slide-left"];
				} else {
					// Same depth - fade
					return ["fade"];
				}
			},
		},
		Wrap: (props: { children: React.ReactNode }) => {
			return (
				<TanstackQuery.Provider {...rqContext}>
					{props.children}
				</TanstackQuery.Provider>
			);
		},
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	// Initialize Sentry for client-side error tracking
	if (!router.isServer && env.VITE_SENTRY_DSN) {
		Sentry.init({
			dsn: env.VITE_SENTRY_DSN,
			environment: import.meta.env.MODE || "development",
			// Error collection is automatic with @sentry/tanstackstart-react
			integrations: [
				Sentry.replayIntegration({
					// Disable all masking - no PII or sensitive data
					mask: [],
					block: [],
					maskAllText: false,
					maskAllInputs: false,
				}),
			],
			// Capture Replay for 10% of all sessions,
			// plus for 100% of sessions with an error.
			replaysSessionSampleRate: 1.0,
			replaysOnErrorSampleRate: 1.0,
			// Adds request headers and IP for users, for more info visit:
			// https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
			sendDefaultPii: false,
		});
	}

	return router;
};

import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { ConvexClient } from "convex/browser";
import { getConvexClient } from "./integrations/convex/provider";
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

	// if (!router.isServer) {
	// 	Sentry.init({
	// 		dsn: import.meta.env.VITE_SENTRY_DSN,
	// 		integrations: [],
	// 	});
	// }

	return router;
};

import { useAuth } from "@clerk/clerk-react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { env } from "../../env";
import { getContext } from "../tanstack-query/root-provider";

const CONVEX_URL = env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
	throw new Error("missing envar VITE_CONVEX_URL");
}

const convex = new ConvexReactClient(CONVEX_URL, {
	unsavedChangesWarning: false,
});

const convexQueryClient = new ConvexQueryClient(convex);

// Export the Convex client for use in router context and SSR
export const getConvexClient = () => convexQueryClient.convexClient;
convexQueryClient.connect(getContext().queryClient);

export default function AppConvexProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ConvexProviderWithClerk
			client={convexQueryClient.convexClient}
			useAuth={useAuth}
		>
			{children}
		</ConvexProviderWithClerk>
	);
}

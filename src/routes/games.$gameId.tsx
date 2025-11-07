/**
 * Public Game Page - Server-Side Rendered
 *
 * This page displays a live scoreboard for a specific game.
 * Features:
 * - SSR for fast initial load and SEO
 * - Real-time updates via Convex subscriptions
 * - Mobile-responsive design for field-side viewing
 */

import { useQuery } from "convex/react"; // Changed to Convex's useQuery
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LiveScoreboard } from "../components/LiveScoreboard";

// Server-side data loader for SSR
export const Route = createFileRoute("/games/$gameId")({
	loader: async ({ context, params }) => {
		const { gameId } = params;

		// Fetch initial game data server-side for fast first paint
		// This data will be embedded in the HTML for instant display
		const game = await context.convexClient.query(api.games.getGame, {
			gameId: gameId as Id<"games">,
		});

		return { game };
	},

	// Enable SSR for this route
	ssr: true,

	// Component that renders on both server and client
	component: GamePage,

	// Pending component while loading
	pendingComponent: () => (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-lg">Loading game...</div>
		</div>
	),

	// Error component
	errorComponent: ({ error }) => (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-lg text-red-600">
				Error loading game: {error.message}
			</div>
		</div>
	),
});

function GamePage() {
	const { gameId } = Route.useParams();
	const { game: initialGame } = Route.useLoaderData();

	// Real-time subscription to game data
	// Convex handles SSR hydration automatically
	const game = useQuery(api.games.getGame, {
		gameId: gameId as Id<"games">,
	});

	// Subscribe to real-time game state updates
	const gameState = useQuery(api.games.getGameState, {
		gameId: gameId as Id<"games">,
	});

	// Subscribe to game events (play-by-play)
	const events = useQuery(api.games.getGameEvents, {
		gameId: gameId as Id<"games">,
		limit: 20,
	}) ?? [];

	// Use SSR data as fallback while real-time subscription loads
	const displayGame = game ?? initialGame;

	// Show loading only if we have no data at all
	if (!displayGame) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg">Loading game...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 px-4 py-3">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-xl font-bold text-gray-900">
						{displayGame.homeTeam?.name} vs {displayGame.awayTeam?.name}
					</h1>
					<p className="text-sm text-gray-600 mt-1">
						{displayGame.venue || "Venue TBA"}
					</p>
				</div>
			</header>

			{/* Live Scoreboard */}
			<main className="max-w-4xl mx-auto px-4 py-6">
				<LiveScoreboard game={displayGame} gameState={gameState} className="mb-6" />

				{/* Play-by-Play */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900">
							Play-by-Play
						</h2>
					</div>

					<div className="divide-y divide-gray-200">
						{events.length > 0 ? (
							events.map((event) => (
								<div
									key={event._id}
									className="px-6 py-3 hover:bg-gray-50 transition-colors"
								>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<p className="text-sm text-gray-900">
												{event.description}
											</p>
											<p className="text-xs text-gray-500 mt-1">
												{formatTimestamp(event.timestamp)}
											</p>
										</div>
										{event.type === "goal" && (
											<div className="ml-4 text-xs font-medium text-green-600 whitespace-nowrap">
												{event.scoringTeam === "home" ? "🏠" : "✈️"} GOAL
											</div>
										)}
									</div>
								</div>
							))
						) : (
							<div className="px-6 py-8 text-center text-gray-600">
								No events yet
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

// Helper function

function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

	if (diffMinutes < 1) return "Just now";
	if (diffMinutes < 60) return `${diffMinutes}m ago`;

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h ago`;

	return date.toLocaleDateString();
}

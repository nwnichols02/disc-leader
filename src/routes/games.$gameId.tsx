/**
 * Public Game Page - Server-Side Rendered
 *
 * This page displays a live scoreboard for a specific game.
 * Features:
 * - SSR for fast initial load and SEO
 * - Real-time updates via Convex subscriptions
 * - Mobile-responsive design for field-side viewing
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react"; // Changed to Convex's useQuery
import { useMemo, useState } from "react";
import { Video, VideoOff } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LiveScoreboard } from "../components/LiveScoreboard";
import { StreamPlayer } from "../components/StreamPlayer";

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
	const [showVideo, setShowVideo] = useState(true);

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
	const events =
		useQuery(api.games.getGameEvents, {
			gameId: gameId as Id<"games">,
			limit: 20,
		}) ?? [];

	// Use SSR data as fallback while real-time subscription loads
	const displayGame = game ?? initialGame;

	// Calculate score at the time of each event
	// Start with current gameState and work backwards through events
	const eventsWithScores = useMemo(() => {
		if (!events.length || !gameState) return [];

		// Start with the current game state score
		let homeScore = gameState.homeScore;
		let awayScore = gameState.awayScore;

		// Process events from newest to oldest (they're already in reverse chronological order)
		// For each event, we store the score AFTER that event occurred, then decrement if it's a goal
		const eventsWithScoresReversed = events.map((event) => {
			// Store the current score (score after this event occurred)
			const scoreAtEvent = {
				homeScore,
				awayScore,
			};

			// If this is a goal, decrement the score (working backwards)
			if (event.type === "goal" && event.scoringTeam) {
				if (event.scoringTeam === "home") {
					homeScore--;
				} else {
					awayScore--;
				}
			}

			return {
				...event,
				scoreAtEvent,
			};
		});

		// Reverse to get chronological order (oldest first) for display
		return eventsWithScoresReversed.reverse();
	}, [events, gameState]);

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
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold text-gray-900">
							{displayGame.homeTeam?.name} vs {displayGame.awayTeam?.name}
						</h1>
						<p className="text-sm text-gray-600 mt-1">
							{displayGame.venue || "Venue TBA"}
						</p>
					</div>
					{/* Video Toggle Button */}
					{(displayGame.streamId || displayGame.webRtcPlaybackUrl) && (
						<button
							onClick={() => setShowVideo(!showVideo)}
							className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
							title={showVideo ? "Hide video" : "Show video"}
						>
							{showVideo ? (
								<>
									<VideoOff className="w-4 h-4" />
									<span className="hidden sm:inline">Hide Video</span>
								</>
							) : (
								<>
									<Video className="w-4 h-4" />
									<span className="hidden sm:inline">Show Video</span>
								</>
							)}
						</button>
					)}
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-4xl mx-auto px-4 py-6">
				{/* Stream Player - Toggleable */}
				{showVideo && (
					<div className="mb-6">
						<StreamPlayer
							streamId={displayGame.streamId}
							streamUrl={displayGame.streamUrl}
							webRtcPlaybackUrl={displayGame.webRtcPlaybackUrl}
							streamStatus={displayGame.streamStatus}
							autoPlay={displayGame.streamStatus === "live"}
							className="w-full"
						/>
					</div>
				)}

				{/* Live Scoreboard */}
				<LiveScoreboard
					game={displayGame}
					gameState={gameState}
					gameId={gameId as Id<"games">}
					className="mb-6"
				/>

				{/* Play-by-Play */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900">
							Play-by-Play
						</h2>
					</div>

					<div className="divide-y divide-gray-200">
						{eventsWithScores.length > 0 ? (
							// Display in reverse chronological order (newest first)
							// eventsWithScores is already in chronological order, so reverse it
							[...eventsWithScores]
								.reverse()
								.map((event) => {
									const teamName =
										event.scoringTeam === "home"
											? displayGame.homeTeam?.name || "Home Team"
											: event.scoringTeam === "away"
												? displayGame.awayTeam?.name || "Away Team"
												: null;

									return (
										<div
											key={event._id}
											className="px-6 py-3 hover:bg-gray-50 transition-colors"
										>
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1 min-w-0">
													<div className="flex items-start gap-2">
														{event.type === "goal" && (
															<span className="text-lg leading-none mt-0.5">
																🥏
															</span>
														)}
														<div className="flex-1 min-w-0">
															<p className="text-sm text-gray-900">
																{formatEventDescription(event, teamName)}
															</p>
															<div className="flex items-center gap-2 mt-1.5">
																<p className="text-xs text-gray-500">
																	{formatGameTime(
																		event,
																		displayGame.format,
																		event.scoreAtEvent,
																	)}
																</p>
																<span className="text-xs text-gray-300">•</span>
																<p className="text-xs text-gray-500">
																	{formatTimestamp(event.timestamp)}
																</p>
															</div>
														</div>
													</div>
												</div>
												{event.type === "goal" && (
													<div className="ml-4 text-xs font-semibold text-green-600 whitespace-nowrap">
														GOAL
													</div>
												)}
											</div>
										</div>
									);
								})
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

// Helper functions

/**
 * Format timestamp to a user-friendly time display
 * Shows time of day for today, or date + time for older events
 */
function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const eventDate = new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);

	// If event is today, show time only
	if (eventDate.getTime() === today.getTime()) {
		return date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	}

	// If event is yesterday
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	if (eventDate.getTime() === yesterday.getTime()) {
		return `Yesterday ${date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		})}`;
	}

	// For older events, show date and time
	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

/**
 * Format game time (period and clock) for display
 */
function formatGameTime(
	event: {
		period: number;
		clockSeconds: number;
	},
	gameFormat?: string,
	scoreAtEvent?: { homeScore: number; awayScore: number },
): string {
	// Format period based on game format
	let periodStr: string;
	switch (gameFormat) {
		case "professional":
			periodStr = `Q${event.period}`;
			// Professional format uses clock - show time
			const minutes = Math.floor(event.clockSeconds / 60);
			const seconds = event.clockSeconds % 60;
			const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
			return `${periodStr} ${timeStr}`;
		case "tournament":
			// Tournament format: show score at the time of the event
			if (scoreAtEvent) {
				return `${scoreAtEvent.homeScore}-${scoreAtEvent.awayScore}`;
			}
			// Fallback if score not available
			return `Point ${event.period}`;
		case "recreational":
			periodStr = event.period === 1 ? "1st Half" : "2nd Half";
			// Recreational may or may not use clock - only show if clockSeconds > 0
			if (event.clockSeconds > 0) {
				const minutes = Math.floor(event.clockSeconds / 60);
				const seconds = event.clockSeconds % 60;
				const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
				return `${periodStr} ${timeStr}`;
			}
			return periodStr;
		default:
			periodStr = `Period ${event.period}`;
			// Show time if available
			if (event.clockSeconds > 0) {
				const minutes = Math.floor(event.clockSeconds / 60);
				const seconds = event.clockSeconds % 60;
				const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
				return `${periodStr} ${timeStr}`;
			}
			return periodStr;
	}
}

/**
 * Format event description with team names instead of "home" or "away"
 */
function formatEventDescription(
	event: {
		type: string;
		description: string;
		scoringTeam?: "home" | "away";
	},
	teamName: string | null,
): string {
	if (!teamName || !event.scoringTeam) {
		return event.description;
	}

	// Replace "home team" or "away team" with actual team name
	let description = event.description.replace(
		/\b(home|away)\s+team/gi,
		teamName,
	);

	// Also handle cases where it just says "home" or "away" in context
	// Only replace if it's clearly referring to a team (not in other contexts)
	if (event.type === "goal") {
		description = description.replace(
			/\b(Goal scored by|scored by)\s+(home|away)\b/gi,
			(_match, prefix) => {
				return `${prefix} ${teamName}`;
			},
		);
	}

	return description;
}

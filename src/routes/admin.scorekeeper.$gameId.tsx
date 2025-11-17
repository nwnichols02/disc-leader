/**
 * Scorekeeper Interface
 *
 * Mobile-optimized interface for recording game events in real-time.
 * Features optimistic UI updates with automatic rollback on errors.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LiveScoreboard } from "../components/LiveScoreboard";
import { BrowserStream } from "../components/BrowserStream";
import { Video, VideoOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/scorekeeper/$gameId")({
	component: ScorekeeperPage,
});

function ScorekeeperPage() {
	const { gameId } = Route.useParams();
	const [showPlayerSelect, setShowPlayerSelect] = useState(false);
	const [pendingGoal, setPendingGoal] = useState<{
		team: "home" | "away";
	} | null>(null);
	const [showRulesEditor, setShowRulesEditor] = useState(false);

	// Rules editor state (for upcoming games)
	const [stallCount, setStallCount] = useState<6 | 7 | 10>(10);
	const [targetScore, setTargetScore] = useState(15);
	const [quarterLength, setQuarterLength] = useState(12);
	const [halfLength, setHalfLength] = useState(30);
	const [timeoutsPerHalf, setTimeoutsPerHalf] = useState(2);
	const [timeoutDuration, setTimeoutDuration] = useState(70);
	const [useSoftCap, setUseSoftCap] = useState(false);
	const [softCapTime, setSoftCapTime] = useState(75);
	const [hardCapTime, setHardCapTime] = useState(90);

	// Fetch game data with real-time updates
	const game = useQuery(api.games.getGame, {
		gameId: gameId as Id<"games">,
	});
	const isGamePending = game === undefined;

	const gameState = useQuery(api.games.getGameState, {
		gameId: gameId as Id<"games">,
	});

	// Get team players for assist selection
	const homePlayers =
		useQuery(
			api.games.getTeamPlayers,
			game?.homeTeamId
				? {
						teamId: game.homeTeamId,
						activeOnly: true,
					}
				: "skip",
		) ?? [];

	const awayPlayers =
		useQuery(
			api.games.getTeamPlayers,
			game?.awayTeamId
				? {
						teamId: game.awayTeamId,
						activeOnly: true,
					}
				: "skip",
		) ?? [];

	// Mutations - Convex handles optimistic updates automatically
	const recordGoalMutation = useMutation(api.gameMutations.recordGoal);
	const updatePossessionMutation = useMutation(
		api.gameMutations.updatePossession,
	);
	const recordTurnoverMutation = useMutation(api.gameMutations.recordTurnover);
	const startGameMutation = useMutation(api.gameMutations.startGame);
	const endGameMutation = useMutation(api.gameMutations.endGame);
	const updateGameRulesMutation = useMutation(
		api.gameMutations.updateGameRules,
	);

	// Stream management
	const streamInfo = useQuery(api.streams.getGameStream, {
		gameId: gameId as Id<"games">,
	});
	const activeStreamGameId = useQuery(api.streams.getActiveStream);
	const updateStreamMutation = useMutation(api.streams.updateGameStream);
	const createLiveInputAction = useAction(api.streams.createLiveInput);
	const [isStreamLoading, setIsStreamLoading] = useState(false);

	// Initialize rules editor state when game loads
	useEffect(() => {
		if (game && game.status === "upcoming") {
			const rules = game.ruleConfig;
			setStallCount(rules.stallCount);
			setTargetScore(rules.targetScore ?? 15);
			setQuarterLength(rules.quarterLength ?? 12);
			setHalfLength(rules.halfLength ?? 30);
			setTimeoutsPerHalf(rules.timeoutsPerHalf);
			setTimeoutDuration(rules.timeoutDuration);
			setUseSoftCap(!!rules.capRules);
			setSoftCapTime(rules.capRules?.softCapTime ?? 75);
			setHardCapTime(rules.capRules?.hardCapTime ?? 90);
		}
	}, [game]);

	// Handle goal - Convex provides real-time updates automatically
	const handleGoal = async (
		team: "home" | "away",
		scoredBy?: Id<"players">,
	) => {
		if (!gameState) return;

		try {
			await recordGoalMutation({
				gameId: gameId as Id<"games">,
				scoringTeam: team,
				scoredBy,
			});
			setShowPlayerSelect(false);
			setPendingGoal(null);
		} catch (err: any) {
			alert(`Failed to record goal: ${err.message}`);
		}
	};

	// Handle possession change
	const handlePossession = async (newPossession: "home" | "away") => {
		try {
			await updatePossessionMutation({
				gameId: gameId as Id<"games">,
				possession: newPossession,
			});
		} catch (err: any) {
			alert(`Failed to update possession: ${err.message}`);
		}
	};

	// Handle turnover
	const handleTurnover = async (
		turnoverType:
			| "drop"
			| "throwaway"
			| "block"
			| "stall"
			| "out-of-bounds"
			| "other",
	) => {
		try {
			await recordTurnoverMutation({
				gameId: gameId as Id<"games">,
				turnoverType,
			});
		} catch (err: any) {
			alert(`Failed to record turnover: ${err.message}`);
		}
	};

	if (isGamePending || !game) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg text-gray-600">Loading game...</div>
			</div>
		);
	}

	// Handle start game
	const handleStartGame = async () => {
		try {
			await startGameMutation({ gameId: gameId as Id<"games"> });
		} catch (err: any) {
			alert(`Failed to start game: ${err.message}`);
		}
	};

	// Handle end game
	const handleEndGame = async () => {
		if (!confirm("Are you sure you want to end this game?")) {
			return;
		}
		try {
			await endGameMutation({ gameId: gameId as Id<"games"> });
		} catch (err: any) {
			alert(`Failed to end game: ${err.message}`);
		}
	};

	// Handle save rules
	const handleSaveRules = async () => {
		if (!game) return;

		try {
			const ruleConfig =
				game.format === "professional"
					? {
							stallCount,
							quarterLength,
							timeoutsPerHalf,
							timeoutDuration,
						}
					: game.format === "tournament"
						? {
								stallCount,
								targetScore,
								timeoutsPerHalf,
								timeoutDuration,
								...(useSoftCap && {
									capRules: {
										softCapTime,
										hardCapTime,
									},
								}),
							}
						: {
								stallCount,
								halfLength,
								timeoutsPerHalf,
								timeoutDuration,
							};

			await updateGameRulesMutation({
				gameId: gameId as Id<"games">,
				ruleConfig,
			});

			setShowRulesEditor(false);
			alert("Rules updated successfully!");
		} catch (err: any) {
			alert(`Failed to update rules: ${err.message}`);
		}
	};

	// Handle start stream
	const handleStartStream = async () => {
		// Check if another game already has a live stream
		if (activeStreamGameId && activeStreamGameId !== gameId) {
			alert(
				"Another game is already streaming. Only one stream can be active at a time.",
			);
			return;
		}

		// Check if this game already has a live stream
		if (streamInfo?.streamStatus === "live") {
			alert("Stream is already running for this game.");
			return;
		}

		setIsStreamLoading(true);
		try {
			// If no stream key exists, create a live input first
			if (!game.streamKey) {
				const liveInput = await createLiveInputAction({});
				await updateStreamMutation({
					gameId: gameId as Id<"games">,
					streamKey: liveInput.streamKey,
					streamId: liveInput.uid, // Use the live input UID as streamId
					streamStatus: "upcoming",
					streamStartTime: Date.now(),
				});
			}

			// Start the stream
			await updateStreamMutation({
				gameId: gameId as Id<"games">,
				streamStatus: "live",
				streamStartTime: Date.now(),
			});
		} catch (err: any) {
			alert(`Failed to start stream: ${err.message}`);
		} finally {
			setIsStreamLoading(false);
		}
	};

	// Handle stop stream
	const handleStopStream = async () => {
		// Check if stream is actually running
		if (streamInfo?.streamStatus !== "live") {
			alert("No active stream to stop.");
			return;
		}

		if (!confirm("Are you sure you want to stop the stream?")) {
			return;
		}

		setIsStreamLoading(true);
		try {
			await updateStreamMutation({
				gameId: gameId as Id<"games">,
				streamStatus: "completed",
				streamEndTime: Date.now(),
			});
		} catch (err: any) {
			alert(`Failed to stop stream: ${err.message}`);
		} finally {
			setIsStreamLoading(false);
		}
	};

	// Check if stream can be started/stopped
	const canStartStream =
		!isStreamLoading &&
		streamInfo?.streamStatus !== "live" &&
		(!activeStreamGameId || activeStreamGameId === gameId);
	const canStopStream = !isStreamLoading && streamInfo?.streamStatus === "live";

	const isUpcoming = game?.status === "upcoming";
	const isLive = game?.status === "live";

	return (
		<div className="min-h-screen bg-gray-50 pb-20">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
				<div className="max-w-4xl mx-auto flex justify-between items-center">
					<div>
						<h1 className="text-lg font-bold text-gray-900">Scorekeeper</h1>
						<p className="text-sm text-gray-600">
							{game.homeTeam?.name} vs {game.awayTeam?.name}
						</p>
					</div>
					<div className="flex gap-2">
						{/* Stream Controls */}
						{canStartStream && (
							<button
								onClick={handleStartStream}
								disabled={isStreamLoading}
								className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
							>
								{isStreamLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Video className="h-4 w-4" />
								)}
								Start Stream
							</button>
						)}
						{canStopStream && (
							<button
								onClick={handleStopStream}
								disabled={isStreamLoading}
								className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
							>
								{isStreamLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<VideoOff className="h-4 w-4" />
								)}
								Stop Stream
							</button>
						)}
						{streamInfo?.streamStatus === "live" && (
							<div className="px-3 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg flex items-center gap-1">
								<div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
								Live
							</div>
						)}
						{isUpcoming && (
							<button
								onClick={() => setShowRulesEditor(!showRulesEditor)}
								className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
							>
								{showRulesEditor ? "Hide" : "Edit"} Rules
							</button>
						)}
						{isUpcoming ? (
							<button
								onClick={handleStartGame}
								className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 inline mr-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Start Game
							</button>
						) : isLive ? (
							<button
								onClick={handleEndGame}
								className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 inline mr-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 10h6m-6 4h6"
									/>
								</svg>
								End Game
							</button>
						) : null}
					</div>
				</div>
			</header>

			{/* Live Scoreboard */}
			<div className="max-w-4xl mx-auto px-4 py-4">
				<LiveScoreboard
					game={game}
					gameState={gameState}
					gameId={gameId as Id<"games">}
				/>
			</div>

			{/* Browser Stream - Show when stream is active or can be started */}
			{(streamInfo?.streamStatus === "live" || canStartStream) && (
				<div className="max-w-4xl mx-auto px-4 pb-4">
					<BrowserStream
						streamKey={game.streamKey || ""}
						rtmpUrl="rtmps://live.cloudflare.com:443/live/"
						onStreamStart={() => {
							// Stream started from browser
							if (streamInfo?.streamStatus !== "live") {
								handleStartStream();
							}
						}}
						onStreamStop={() => {
							// Stream stopped from browser
							if (streamInfo?.streamStatus === "live") {
								handleStopStream();
							}
						}}
						onError={(error) => {
							console.error("Browser stream error:", error);
						}}
					/>
				</div>
			)}

			{/* Rules Editor for Upcoming Games */}
			{isUpcoming && showRulesEditor && (
				<div className="max-w-4xl mx-auto px-4 mb-4">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Game Rules
						</h3>
						<div className="space-y-4">
							{/* Stall Count */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Stall Count
								</label>
								<select
									value={stallCount}
									onChange={(e) =>
										setStallCount(Number(e.target.value) as 6 | 7 | 10)
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg"
								>
									<option value={6}>6</option>
									<option value={7}>7</option>
									<option value={10}>10</option>
								</select>
							</div>

							{/* Format-specific rules */}
							{game.format === "tournament" && (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Target Score
										</label>
										<input
											type="number"
											value={targetScore}
											onChange={(e) => setTargetScore(Number(e.target.value))}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg"
											min={1}
											max={25}
										/>
									</div>
									<div>
										<label className="flex items-center">
											<input
												type="checkbox"
												checked={useSoftCap}
												onChange={(e) => setUseSoftCap(e.target.checked)}
												className="mr-2"
											/>
											<span className="text-sm font-medium text-gray-700">
												Use Soft Cap
											</span>
										</label>
										{useSoftCap && (
											<div className="mt-2 grid grid-cols-2 gap-2">
												<div>
													<label className="block text-xs text-gray-600 mb-1">
														Soft Cap (min)
													</label>
													<input
														type="number"
														value={softCapTime}
														onChange={(e) =>
															setSoftCapTime(Number(e.target.value))
														}
														className="w-full px-2 py-1 border border-gray-300 rounded"
													/>
												</div>
												<div>
													<label className="block text-xs text-gray-600 mb-1">
														Hard Cap (min)
													</label>
													<input
														type="number"
														value={hardCapTime}
														onChange={(e) =>
															setHardCapTime(Number(e.target.value))
														}
														className="w-full px-2 py-1 border border-gray-300 rounded"
													/>
												</div>
											</div>
										)}
									</div>
								</>
							)}

							{game.format === "professional" && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Quarter Length (minutes)
									</label>
									<input
										type="number"
										value={quarterLength}
										onChange={(e) => setQuarterLength(Number(e.target.value))}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg"
										min={1}
										max={20}
									/>
								</div>
							)}

							{game.format === "recreational" && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Half Length (minutes)
									</label>
									<input
										type="number"
										value={halfLength}
										onChange={(e) => setHalfLength(Number(e.target.value))}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg"
										min={10}
										max={60}
									/>
								</div>
							)}

							{/* Common rules */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Timeouts Per Half
									</label>
									<input
										type="number"
										value={timeoutsPerHalf}
										onChange={(e) => setTimeoutsPerHalf(Number(e.target.value))}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg"
										min={0}
										max={10}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Timeout Duration (seconds)
									</label>
									<input
										type="number"
										value={timeoutDuration}
										onChange={(e) => setTimeoutDuration(Number(e.target.value))}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg"
										min={30}
										max={180}
									/>
								</div>
							</div>

							{/* Save button */}
							<button
								onClick={handleSaveRules}
								className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
							>
								Save Rules
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Scoring Controls - Mobile Optimized (only show for live games) */}
			{isLive && (
				<div className="max-w-4xl mx-auto px-4 space-y-4">
					{/* Goal Buttons */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
						<h3 className="text-sm font-semibold text-gray-700 mb-3">
							Record Goal
						</h3>
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => {
									setPendingGoal({ team: "home" });
									setShowPlayerSelect(true);
								}}
								className="py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl rounded-lg transition-colors active:scale-95"
							>
								{game.homeTeam?.abbreviation || "HOME"} Goal
							</button>
							<button
								onClick={() => {
									setPendingGoal({ team: "away" });
									setShowPlayerSelect(true);
								}}
								className="py-6 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition-colors active:scale-95"
							>
								{game.awayTeam?.abbreviation || "AWAY"} Goal
							</button>
						</div>
					</div>

					{/* Possession Control */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
						<h3 className="text-sm font-semibold text-gray-700 mb-3">
							Possession
						</h3>
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => handlePossession("home")}
								className={`py-4 font-semibold rounded-lg transition-colors ${
									gameState?.possession === "home"
										? "bg-blue-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								{game.homeTeam?.abbreviation || "HOME"}
							</button>
							<button
								onClick={() => handlePossession("away")}
								className={`py-4 font-semibold rounded-lg transition-colors ${
									gameState?.possession === "away"
										? "bg-red-600 text-white"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								{game.awayTeam?.abbreviation || "AWAY"}
							</button>
						</div>
					</div>

					{/* Turnover Buttons */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
						<h3 className="text-sm font-semibold text-gray-700 mb-3">
							Turnovers
						</h3>
						<div className="grid grid-cols-3 gap-2">
							<button
								onClick={() => handleTurnover("drop")}
								className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg transition-colors text-sm"
							>
								Drop
							</button>
							<button
								onClick={() => handleTurnover("throwaway")}
								className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg transition-colors text-sm"
							>
								Throwaway
							</button>
							<button
								onClick={() => handleTurnover("block")}
								className="py-3 bg-green-100 hover:bg-green-200 text-green-800 font-medium rounded-lg transition-colors text-sm"
							>
								Block
							</button>
							<button
								onClick={() => handleTurnover("stall")}
								className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg transition-colors text-sm"
							>
								Stall
							</button>
							<button
								onClick={() => handleTurnover("out-of-bounds")}
								className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 font-medium rounded-lg transition-colors text-sm"
							>
								Out
							</button>
							<button
								onClick={() => handleTurnover("other")}
								className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
							>
								Other
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Player Selection Modal */}
			{showPlayerSelect && pendingGoal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
					<div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[80vh] overflow-auto">
						<div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
							<h3 className="text-lg font-semibold text-gray-900">
								Who scored?
							</h3>
							<p className="text-sm text-gray-600 mt-1">
								{pendingGoal.team === "home"
									? game.homeTeam?.name
									: game.awayTeam?.name}
							</p>
						</div>

						<div className="p-4 space-y-2">
							{/* Quick record without player */}
							<button
								onClick={() => handleGoal(pendingGoal.team)}
								className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
							>
								Record Goal (No Player)
							</button>

							<div className="border-t border-gray-200 my-4"></div>

							{/* Player list */}
							{(pendingGoal.team === "home" ? homePlayers : awayPlayers).map(
								(player) => (
									<button
										key={player._id}
										onClick={() => handleGoal(pendingGoal.team!, player._id)}
										className="w-full py-3 px-4 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-left"
									>
										<div className="font-medium text-gray-900">
											#{player.jerseyNumber} {player.firstName}{" "}
											{player.lastName}
										</div>
										{player.position && (
											<div className="text-sm text-gray-600 capitalize">
												{player.position}
											</div>
										)}
									</button>
								),
							)}

							{(pendingGoal.team === "home" ? homePlayers : awayPlayers)
								.length === 0 && (
								<div className="text-center py-4 text-gray-600">
									No players available
								</div>
							)}
						</div>

						<div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
							<button
								onClick={() => {
									setShowPlayerSelect(false);
									setPendingGoal(null);
								}}
								className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

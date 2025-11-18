/**
 * Scorekeeper Interface
 *
 * Mobile-optimized interface for recording game events in real-time.
 * Features optimistic UI updates with automatic rollback on errors.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LiveScoreboard } from "../components/LiveScoreboard";
import { BrowserStream } from "../components/BrowserStream";

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
	const [isActuallyStreaming, setIsActuallyStreaming] = useState(false);

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

	// Memoize the canvas stream ready callback to prevent infinite loops
	// BrowserStream handles its own preview, so we don't need to track the stream
	const handleCanvasStreamReady = useCallback((_stream: MediaStream | null) => {
		// Callback is required by BrowserStream but we don't need to do anything with it
		// The BrowserStream component handles its own preview display
	}, []);

	if (isGamePending || !game) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<span className="loading loading-spinner loading-lg text-primary"></span>
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

	// Handle start stream - called when BrowserStream starts streaming
	const handleStartStream = async () => {
		setIsStreamLoading(true);

		try {
			// Validate states first (these are synchronous checks)
			if (activeStreamGameId && activeStreamGameId !== gameId) {
				alert(
					"Another game is already streaming. Only one stream can be active at a time.",
				);
				return;
			}

			if (streamInfo?.streamStatus === "live") {
				// Already live, no need to update
				return;
			}

			if (!game) {
				throw new Error("Game data not available");
			}

			// Prepare all operations that can run in parallel
			const operations: Promise<unknown>[] = [];

			// If no stream key exists, create a live input first
			if (!game.streamKey || !streamInfo?.webRtcPublishUrl) {
				// Create live input and update stream in sequence (update depends on live input)
				const liveInput = await createLiveInputAction({});

				// Update stream with all data at once
				operations.push(
					updateStreamMutation({
						gameId: gameId as Id<"games">,
						streamKey: liveInput.streamKey,
						streamId: liveInput.uid,
						streamUrl: liveInput.rtmpUrl,
						webRtcPublishUrl: liveInput.webRtcPublishUrl,
						webRtcPlaybackUrl: liveInput.webRtcPlaybackUrl,
						streamStatus: "upcoming",
						streamStartTime: Date.now(),
					}),
				);
			}

			// Update stream status to live (can run in parallel with other updates)
			operations.push(
				updateStreamMutation({
					gameId: gameId as Id<"games">,
					streamStatus: "live",
					streamStartTime: Date.now(),
				}),
			);

			// Execute all operations in parallel
			await Promise.all(operations);
		} catch (err: any) {
			console.error("Failed to start stream:", err);
			alert(`Failed to start stream: ${err.message || "Unknown error"}`);
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

	// Check if stream can be started
	const canStartStream =
		!isStreamLoading &&
		streamInfo?.streamStatus !== "live" &&
		(!activeStreamGameId || activeStreamGameId === gameId);

	// Check if we should show the BrowserStream component
	const shouldShowBrowserStream =
		!!streamInfo?.webRtcPublishUrl &&
		(streamInfo?.streamStatus === "live" || canStartStream);

	const isUpcoming = game?.status === "upcoming";
	const isLive = game?.status === "live";

	return (
		<div className="min-h-screen bg-base-100 pb-20">
			{/* Header */}
			<header className="navbar bg-base-200 border-b border-base-300 px-4 py-3 sticky top-0 z-10">
				<div className="max-w-4xl mx-auto flex justify-between items-center w-full">
					<div>
						<h1 className="text-lg font-bold text-base-content">Scorekeeper</h1>
						<p className="text-sm text-base-content/70">
							{game.homeTeam?.name} vs {game.awayTeam?.name}
						</p>
					</div>
					<div className="flex gap-2">
						{/* Stream Status Indicator - Only show when actually streaming */}
						{streamInfo?.streamStatus === "live" && isActuallyStreaming && (
							<div className="badge badge-error gap-2">
								<span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
								Live Streaming
							</div>
						)}
						{isUpcoming && (
							<button
								onClick={() => setShowRulesEditor(!showRulesEditor)}
								className="btn btn-ghost btn-sm"
							>
								{showRulesEditor ? "Hide" : "Edit"} Rules
							</button>
						)}
						{isUpcoming ? (
							<button
								onClick={handleStartGame}
								className="btn btn-success btn-sm"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
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
								className="btn btn-error btn-sm"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
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

			{/* Browser Stream - Compact view when stream is available */}
			{shouldShowBrowserStream && streamInfo.webRtcPublishUrl && (
				<div className="max-w-2xl mx-auto px-4 pb-4">
					<BrowserStream
						webRtcPublishUrl={streamInfo.webRtcPublishUrl}
						useCanvas={true}
						onCanvasStreamReady={handleCanvasStreamReady}
						onStreamingStateChange={(streaming) => {
							// Update local state to track actual streaming status
							setIsActuallyStreaming(streaming);
						}}
						onStreamStart={() => {
							// Stream started from browser - update status
							if (streamInfo?.streamStatus !== "live") {
								handleStartStream();
							}
						}}
						onStreamStop={() => {
							// Stream stopped from browser - update status
							if (streamInfo?.streamStatus === "live") {
								handleStopStream();
							}
						}}
						onError={(error) => {
							console.error("Browser stream error:", error);
							alert(`Stream error: ${error}`);
						}}
					/>
				</div>
			)}

			{/* Rules Editor for Upcoming Games */}
			{isUpcoming && showRulesEditor && (
				<div className="max-w-4xl mx-auto px-4 mb-4">
					<div className="card bg-base-200 shadow-lg p-4">
						<h3 className="card-title text-base-content mb-4">
							Game Rules
						</h3>
						<div className="space-y-4">
							{/* Stall Count */}
							<div>
								<label className="label">
									<span className="label-text">Stall Count</span>
								</label>
								<select
									value={stallCount}
									onChange={(e) =>
										setStallCount(Number(e.target.value) as 6 | 7 | 10)
									}
									className="select select-bordered w-full"
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
										<label className="label">
											<span className="label-text">Target Score</span>
										</label>
										<input
											type="number"
											value={targetScore}
											onChange={(e) => setTargetScore(Number(e.target.value))}
											className="input input-bordered w-full"
											min={1}
											max={25}
										/>
									</div>
									<div>
										<label className="label cursor-pointer">
											<span className="label-text">Use Soft Cap</span>
											<input
												type="checkbox"
												checked={useSoftCap}
												onChange={(e) => setUseSoftCap(e.target.checked)}
												className="checkbox checkbox-primary"
											/>
										</label>
										{useSoftCap && (
											<div className="mt-2 grid grid-cols-2 gap-2">
												<div>
													<label className="label">
														<span className="label-text-alt">Soft Cap (min)</span>
													</label>
													<input
														type="number"
														value={softCapTime}
														onChange={(e) =>
															setSoftCapTime(Number(e.target.value))
														}
														className="input input-bordered input-sm w-full"
													/>
												</div>
												<div>
													<label className="label">
														<span className="label-text-alt">Hard Cap (min)</span>
													</label>
													<input
														type="number"
														value={hardCapTime}
														onChange={(e) =>
															setHardCapTime(Number(e.target.value))
														}
														className="input input-bordered input-sm w-full"
													/>
												</div>
											</div>
										)}
									</div>
								</>
							)}

							{game.format === "professional" && (
								<div>
									<label className="label">
										<span className="label-text">Quarter Length (minutes)</span>
									</label>
									<input
										type="number"
										value={quarterLength}
										onChange={(e) => setQuarterLength(Number(e.target.value))}
										className="input input-bordered w-full"
										min={1}
										max={20}
									/>
								</div>
							)}

							{game.format === "recreational" && (
								<div>
									<label className="label">
										<span className="label-text">Half Length (minutes)</span>
									</label>
									<input
										type="number"
										value={halfLength}
										onChange={(e) => setHalfLength(Number(e.target.value))}
										className="input input-bordered w-full"
										min={10}
										max={60}
									/>
								</div>
							)}

							{/* Common rules */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="label">
										<span className="label-text">Timeouts Per Half</span>
									</label>
									<input
										type="number"
										value={timeoutsPerHalf}
										onChange={(e) => setTimeoutsPerHalf(Number(e.target.value))}
										className="input input-bordered w-full"
										min={0}
										max={10}
									/>
								</div>
								<div>
									<label className="label">
										<span className="label-text">Timeout Duration (seconds)</span>
									</label>
									<input
										type="number"
										value={timeoutDuration}
										onChange={(e) => setTimeoutDuration(Number(e.target.value))}
										className="input input-bordered w-full"
										min={30}
										max={180}
									/>
								</div>
							</div>

							{/* Save button */}
							<button
								onClick={handleSaveRules}
								className="btn btn-primary w-full"
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
					<div className="card bg-base-200 shadow-lg p-4">
						<h3 className="card-title text-base-content mb-3 text-sm">
							Record Goal
						</h3>
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => {
									setPendingGoal({ team: "home" });
									setShowPlayerSelect(true);
								}}
								className="btn btn-primary btn-lg py-6 text-xl font-bold active:scale-95"
							>
								{game.homeTeam?.abbreviation || "HOME"} Goal
							</button>
							<button
								onClick={() => {
									setPendingGoal({ team: "away" });
									setShowPlayerSelect(true);
								}}
								className="btn btn-error btn-lg py-6 text-xl font-bold active:scale-95"
							>
								{game.awayTeam?.abbreviation || "AWAY"} Goal
							</button>
						</div>
					</div>

					{/* Possession Control */}
					<div className="card bg-base-200 shadow-lg p-4">
						<h3 className="card-title text-base-content mb-3 text-sm">
							Possession
						</h3>
						<div className="grid grid-cols-2 gap-3">
							<button
								onClick={() => handlePossession("home")}
								className={`btn py-4 font-semibold ${
									gameState?.possession === "home"
										? "btn-primary"
										: "btn-ghost"
								}`}
							>
								{game.homeTeam?.abbreviation || "HOME"}
							</button>
							<button
								onClick={() => handlePossession("away")}
								className={`btn py-4 font-semibold ${
									gameState?.possession === "away"
										? "btn-error"
										: "btn-ghost"
								}`}
							>
								{game.awayTeam?.abbreviation || "AWAY"}
							</button>
						</div>
					</div>

					{/* Turnover Buttons */}
					<div className="card bg-base-200 shadow-lg p-4">
						<h3 className="card-title text-base-content mb-3 text-sm">
							Turnovers
						</h3>
						<div className="grid grid-cols-3 gap-2">
							<button
								onClick={() => handleTurnover("drop")}
								className="btn btn-warning btn-sm"
							>
								Drop
							</button>
							<button
								onClick={() => handleTurnover("throwaway")}
								className="btn btn-warning btn-sm"
							>
								Throwaway
							</button>
							<button
								onClick={() => handleTurnover("block")}
								className="btn btn-success btn-sm"
							>
								Block
							</button>
							<button
								onClick={() => handleTurnover("stall")}
								className="btn btn-warning btn-sm"
							>
								Stall
							</button>
							<button
								onClick={() => handleTurnover("out-of-bounds")}
								className="btn btn-warning btn-sm"
							>
								Out
							</button>
							<button
								onClick={() => handleTurnover("other")}
								className="btn btn-ghost btn-sm"
							>
								Other
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Player Selection Modal */}
			{showPlayerSelect && pendingGoal && (
				<div className="modal modal-open">
					<div className="modal-box max-w-md max-h-[80vh] overflow-auto">
						<div className="sticky top-0 bg-base-100 border-b border-base-300 px-6 py-4 -mx-6 -mt-6 mb-4">
							<h3 className="text-lg font-semibold text-base-content">
								Who scored?
							</h3>
							<p className="text-sm text-base-content/70 mt-1">
								{pendingGoal.team === "home"
									? game.homeTeam?.name
									: game.awayTeam?.name}
							</p>
						</div>

						<div className="space-y-2">
							{/* Quick record without player */}
							<button
								onClick={() => handleGoal(pendingGoal.team)}
								className="btn btn-ghost w-full"
							>
								Record Goal (No Player)
							</button>

							<div className="divider"></div>

							{/* Player list */}
							{(pendingGoal.team === "home" ? homePlayers : awayPlayers).map(
								(player) => (
									<button
										key={player._id}
										onClick={() => handleGoal(pendingGoal.team!, player._id)}
										className="btn btn-outline w-full justify-start text-left h-auto py-3 px-4"
									>
										<div>
											<div className="font-medium text-base-content">
												#{player.jerseyNumber} {player.firstName}{" "}
												{player.lastName}
											</div>
											{player.position && (
												<div className="text-sm text-base-content/60 capitalize">
													{player.position}
												</div>
											)}
										</div>
									</button>
								),
							)}

							{(pendingGoal.team === "home" ? homePlayers : awayPlayers)
								.length === 0 && (
								<div className="text-center py-4 text-base-content/60">
									No players available
								</div>
							)}
						</div>

						<div className="modal-action sticky bottom-0 bg-base-100 border-t border-base-300 -mx-6 -mb-6 px-6 py-4">
							<button
								onClick={() => {
									setShowPlayerSelect(false);
									setPendingGoal(null);
								}}
								className="btn btn-ghost w-full"
							>
								Cancel
							</button>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button
							onClick={() => {
								setShowPlayerSelect(false);
								setPendingGoal(null);
							}}
							className="hidden"
						>
							close
						</button>
					</form>
				</div>
			)}
		</div>
	);
}

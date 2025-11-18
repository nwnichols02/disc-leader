/**
 * LiveScoreboard Component
 *
 * Reusable component for displaying live game scoreboards
 * Supports all three game formats:
 * - Professional (quarters with game clock)
 * - Tournament (first to target score)
 * - Recreational (halves)
 *
 * Features:
 * - Real-time score updates
 * - Possession indicator
 * - Game clock (professional format)
 * - Gender ratio display (mixed divisions)
 * - Timeout tracking
 * - Team colors
 * - Confetti effect on goals
 */

import type { FC } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useGoalConfetti } from "./useGoalConfetti";

export interface LiveScoreboardProps {
	game: Doc<"games"> & {
		homeTeam?: Doc<"teams"> | null;
		awayTeam?: Doc<"teams"> | null;
	};
	gameState: Doc<"gameState"> | null | undefined;
	gameId: Id<"games">;
	className?: string;
}

export const LiveScoreboard: FC<LiveScoreboardProps> = ({
	game,
	gameState,
	className = "",
	gameId,
}) => {
	// Trigger confetti when goals are scored
	useGoalConfetti({
		gameState,
		gameId: gameId as Id<"games">,
		homeTeamColor: game.homeTeam?.colors.primary,
		awayTeamColor: game.awayTeam?.colors.primary,
	});

	if (!gameState) {
		return (
			<div className={`card bg-base-200 shadow-lg p-6 ${className}`}>
				<div className="text-center py-8 text-base-content/60">
					Game not started yet
				</div>
			</div>
		);
	}

	return (
		<div className={`card bg-base-200 shadow-lg p-6 ${className}`}>
			<div className="space-y-6">
				{/* Score Display */}
				<div className="grid grid-cols-3 gap-4 text-center">
					{/* Home Team */}
					<div className="space-y-2">
						<div
							className="text-sm font-medium truncate"
							style={{ color: game.homeTeam?.colors.primary || "#000000" }}
						>
							{game.homeTeam?.abbreviation || "HOME"}
						</div>
						<div className="text-5xl font-bold tabular-nums text-base-content">
							{gameState.homeScore}
						</div>
						{gameState.possession === "home" && (
							<div className="text-xs text-base-content/60">● Possession</div>
						)}
					</div>

					{/* Clock & Period */}
					<div className="flex flex-col items-center justify-center space-y-2">
						<div className="text-sm font-medium text-base-content/70">
							{formatPeriod(game.format, gameState.period, gameState)}
						</div>
						{game.format === "professional" && (
							<div className="text-2xl font-mono tabular-nums text-base-content">
								{formatTime(gameState.clockSeconds)}
							</div>
						)}
						{game.status === "live" && (
							<div className="badge badge-error gap-2">
								<span className="animate-pulse">●</span>
								LIVE
							</div>
						)}
						{game.status === "upcoming" && (
							<div className="badge badge-info">UPCOMING</div>
						)}
						{game.status === "completed" && (
							<div className="badge badge-success">FINAL</div>
						)}
					</div>

					{/* Away Team */}
					<div className="space-y-2">
						<div
							className="text-sm font-medium truncate"
							style={{ color: game.awayTeam?.colors.primary || "#000000" }}
						>
							{game.awayTeam?.abbreviation || "AWAY"}
						</div>
						<div className="text-5xl font-bold tabular-nums text-base-content">
							{gameState.awayScore}
						</div>
						{gameState.possession === "away" && (
							<div className="text-xs text-base-content/60">● Possession</div>
						)}
					</div>
				</div>

				{/* Gender Ratio (Mixed divisions) */}
				{game.genderRatioRequired && (
					<div className="pt-4 border-t border-base-300">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="text-center">
								<div className="text-base-content/60 text-xs mb-1">
									Gender Ratio
								</div>
								<div className="font-medium text-base-content">
									{gameState.homeGenderRatio?.male || 0}M /{" "}
									{gameState.homeGenderRatio?.female || 0}F
								</div>
							</div>
							<div className="text-center">
								<div className="text-base-content/60 text-xs mb-1">
									Gender Ratio
								</div>
								<div className="font-medium text-base-content">
									{gameState.awayGenderRatio?.male || 0}M /{" "}
									{gameState.awayGenderRatio?.female || 0}F
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Game Info Row */}
				<div className="pt-4 border-t border-base-300">
					<div className="grid grid-cols-2 gap-4 text-sm text-center">
						{/* Timeouts */}
						<div>
							<div className="text-base-content/60 text-xs mb-1">
								Timeouts Remaining
							</div>
							<div className="font-medium text-base-content">
								{gameState.homeTimeoutsRemaining} -{" "}
								{gameState.awayTimeoutsRemaining}
							</div>
						</div>

						{/* Target Score (Tournament format) */}
						{game.format === "tournament" && game.ruleConfig.targetScore && (
							<div>
								<div className="text-base-content/60 text-xs mb-1">
									Target Score
								</div>
								<div className="font-medium text-base-content">
									{game.ruleConfig.targetScore}
								</div>
							</div>
						)}

						{/* Quarter Length (Professional format) */}
						{game.format === "professional" &&
							game.ruleConfig.quarterLength && (
								<div>
									<div className="text-base-content/60 text-xs mb-1">
										Quarter Length
									</div>
									<div className="font-medium text-base-content">
										{game.ruleConfig.quarterLength} min
									</div>
								</div>
							)}

						{/* Stall Count */}
						{game.ruleConfig.stallCount && (
							<div>
								<div className="text-base-content/60 text-xs mb-1">
									Stall Count
								</div>
								<div className="font-medium text-base-content">
									{game.ruleConfig.stallCount}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Field Info (if available) */}
				{game.fieldInfo && (
					<div className="pt-4 border-t border-base-300 text-xs text-base-content/60 text-center">
						Field: {game.fieldInfo.length}yd × {game.fieldInfo.width}yd
						{" • "}
						End zones: {game.fieldInfo.endZoneDepth}yd
						{" • "}
						{game.fieldInfo.surface}
					</div>
				)}
			</div>
		</div>
	);
};

// Helper functions

function formatTime(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatPeriod(
	format: string,
	period: number,
	gameState: Doc<"gameState">,
): string {
	switch (format) {
		case "professional":
			return `Q${period}`;
		case "tournament":
			// Show current point number in tournament format
			return `Point ${gameState.homeScore + gameState.awayScore + 1}`;
		case "recreational":
			return period === 1 ? "1st Half" : "2nd Half";
		default:
			return `Period ${period}`;
	}
}

/**
 * useGoalConfetti Hook
 *
 * Detects when a goal is scored and triggers confetti effect.
 * Works by watching for score increases in the game state.
 */

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface UseGoalConfettiProps {
	gameState: Doc<"gameState"> | null | undefined;
	gameId: Id<"games">;
	homeTeamColor?: string;
	awayTeamColor?: string;
}

export function useGoalConfetti({
	gameState,
	gameId,
	homeTeamColor,
	awayTeamColor,
}: UseGoalConfettiProps) {
	const previousScoresRef = useRef<{
		homeScore: number;
		awayScore: number;
	} | null>(null);

	useEffect(() => {
		if (!gameState) {
			// Initialize ref when game state first loads
			if (previousScoresRef.current === null) {
				previousScoresRef.current = {
					homeScore: 0,
					awayScore: 0,
				};
			}
			return;
		}

		// Initialize on first load
		if (previousScoresRef.current === null) {
			previousScoresRef.current = {
				homeScore: gameState.homeScore,
				awayScore: gameState.awayScore,
			};
			return;
		}

		const previous = previousScoresRef.current;
		const current = {
			homeScore: gameState.homeScore,
			awayScore: gameState.awayScore,
		};

		// Check if home team scored
		if (current.homeScore > previous.homeScore) {
			triggerConfetti("home", homeTeamColor);
		}

		// Check if away team scored
		if (current.awayScore > previous.awayScore) {
			triggerConfetti("away", awayTeamColor);
		}

		// Update ref for next comparison
		previousScoresRef.current = current;
	}, [
		gameState?.homeScore,
		gameState?.awayScore,
		homeTeamColor,
		awayTeamColor,
	]);
}

function triggerConfetti(team: "home" | "away", teamColor?: string) {
	// Default colors
	const defaultColors = {
		home: "#3B82F6", // Blue
		away: "#EF4444", // Red
	};

	const color = teamColor || defaultColors[team];

	// Create confetti with team color
	const count = 200;
	const defaults = {
		origin: { y: 0.7 },
		colors: [color, "#FFFFFF", "#FFD700"], // Team color, white, gold
	};

	// Burst from center
	confetti({
		...defaults,
		particleCount: count,
		spread: 70,
		startVelocity: 55,
	});

	// Burst from sides
	confetti({
		...defaults,
		particleCount: count / 2,
		angle: 60,
		spread: 55,
		origin: { x: 0 },
		startVelocity: 45,
	});

	confetti({
		...defaults,
		particleCount: count / 2,
		angle: 120,
		spread: 55,
		origin: { x: 1 },
		startVelocity: 45,
	});
}

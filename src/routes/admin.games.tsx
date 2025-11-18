/**
 * Admin Games Management Page
 *
 * List and manage all games with filtering and quick actions
 */

import {
	createFileRoute,
	Link,
	Outlet,
	useMatches,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/admin/games")({
	component: AdminGamesPage,
});

/**
 * Renders the admin "Games" management page with filters, a games list table, and action links.
 *
 * When a child route (e.g., "/admin/games/new") is active, only the nested <Outlet /> is rendered.
 *
 * The page provides:
 * - A header with a "Create Game" link.
 * - Filters for "all", "live", "upcoming", and "completed" games.
 * - A games table showing status, teams, score, format, venue, date, and actions.
 * - Per-game actions: a "View" link to the public game page and a conditional "Score"/"Start" link to the admin scorekeeper for live/upcoming games.
 *
 * @returns The page's React element (JSX) to display the admin games UI or the nested route Outlet.
 *
 * @example
 * // In route definitions:
 * <Route path="/admin/games" element={<AdminGamesPage />}>
 *   <Route path="new" element={<CreateGameForm />} />
 * </Route>
 */
function AdminGamesPage() {
	const matches = useMatches();
	const isOnChildRoute = matches.some(
		(match) => match.id === "/admin/games/new",
	);

	const [statusFilter, setStatusFilter] = useState<
		"all" | "live" | "upcoming" | "completed"
	>("all");

	// Fetch games based on filter
	const games =
		useQuery(
			api.games.listGames,
			statusFilter === "all"
				? { limit: 50 }
				: { status: statusFilter, limit: 50 },
		) ?? [];

	const isPending = games === undefined;

	// If on a child route (like /new), only render the Outlet
	if (isOnChildRoute) {
		return <Outlet />;
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-base-content">Games</h2>
					<p className="text-base-content/70 mt-1">
						Manage all games and scorekeeping
					</p>
				</div>
				<Link to="/admin/games/new" className="btn btn-primary">
					+ Create Game
				</Link>
			</div>

			{/* Filters */}
			<div className="card bg-base-200 shadow-lg">
				<div className="card-body p-4">
					<div className="flex items-center space-x-2">
						<span className="text-sm font-medium text-base-content/70">
							Filter:
						</span>
						<FilterButton
							active={statusFilter === "all"}
							onClick={() => setStatusFilter("all")}
						>
							All Games
						</FilterButton>
						<FilterButton
							active={statusFilter === "live"}
							onClick={() => setStatusFilter("live")}
						>
							Live
						</FilterButton>
						<FilterButton
							active={statusFilter === "upcoming"}
							onClick={() => setStatusFilter("upcoming")}
						>
							Upcoming
						</FilterButton>
						<FilterButton
							active={statusFilter === "completed"}
							onClick={() => setStatusFilter("completed")}
						>
							Completed
						</FilterButton>
					</div>
				</div>
			</div>

			{/* Games List */}
			<div className="card bg-base-200 shadow-lg">
				<div className="card-header px-6 py-4 border-b border-base-300">
					<h3 className="card-title text-base-content">
						{statusFilter === "all"
							? "All Games"
							: `${capitalize(statusFilter)} Games`}
						<span className="ml-2 text-sm font-normal text-base-content/60">
							({games.length} total)
						</span>
					</h3>
				</div>

				{isPending ? (
					<div className="px-6 py-8 text-center text-base-content/60">
						<span className="loading loading-spinner loading-lg text-primary"></span>
					</div>
				) : games.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>Status</th>
									<th>Game</th>
									<th>Score</th>
									<th>Format</th>
									<th>Venue</th>
									<th>Date</th>
									<th className="text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{games.map((game) => (
									<tr key={game._id} className="hover">
										<td>
											<span
												className={`badge ${getStatusBadgeClass(game.status)}`}
											>
												{game.status === "live" && (
													<span className="animate-pulse mr-1">●</span>
												)}
												{game.status.toUpperCase()}
											</span>
										</td>
										<td>
											<div className="text-sm font-medium text-base-content">
												{game.homeTeam?.abbreviation || "HOME"} vs{" "}
												{game.awayTeam?.abbreviation || "AWAY"}
											</div>
											<div className="text-sm text-base-content/60">
												{game.homeTeam?.name} vs {game.awayTeam?.name}
											</div>
										</td>
										<td>
											{game.state ? (
												<div className="text-sm font-mono tabular-nums text-base-content">
													{game.state.homeScore} - {game.state.awayScore}
												</div>
											) : (
												<div className="text-sm text-base-content/40">-</div>
											)}
										</td>
										<td>
											<div className="text-sm text-base-content capitalize">
												{game.format}
											</div>
										</td>
										<td>
											<div className="text-sm text-base-content max-w-xs truncate">
												{game.venue || "TBA"}
											</div>
										</td>
										<td>
											<div className="text-sm text-base-content">
												{formatDateTime(game.scheduledStart)}
											</div>
										</td>
										<td className="text-right">
											<div className="flex justify-end items-center gap-2">
												<Link
													to="/games/$gameId"
													params={{ gameId: game._id }}
													className="btn btn-primary btn-sm"
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
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
													View
												</Link>
												{(game.status === "live" ||
													game.status === "upcoming") && (
													<Link
														to="/admin/scorekeeper/$gameId"
														params={{ gameId: game._id }}
														className={`btn btn-sm ${
															game.status === "live"
																? "btn-success"
																: "btn-secondary"
														}`}
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
																d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
															/>
														</svg>
														Score
													</Link>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="px-6 py-8 text-center text-base-content/60">
						No {statusFilter !== "all" && statusFilter} games found.
						{statusFilter === "all" && (
							<div className="mt-4">
								<Link
									to="/admin/games/new"
									className="link link-primary font-medium"
								>
									Create your first game →
								</Link>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

// Helper Components

function FilterButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			className={`btn btn-sm ${active ? "btn-active" : "btn-ghost"}`}
		>
			{children}
		</button>
	);
}

// Helper Functions

function getStatusBadgeClass(status: string): string {
	switch (status) {
		case "live":
			return "badge-error";
		case "upcoming":
			return "badge-info";
		case "completed":
			return "badge-success";
		case "cancelled":
			return "badge-ghost";
		default:
			return "badge-ghost";
	}
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateTime(timestamp: number): string {
	const date = new Date(timestamp);
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const isToday = date.toDateString() === today.toDateString();
	const isTomorrow = date.toDateString() === tomorrow.toDateString();

	if (isToday)
		return `Today ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
	if (isTomorrow)
		return `Tomorrow ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

	return date.toLocaleDateString([], {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

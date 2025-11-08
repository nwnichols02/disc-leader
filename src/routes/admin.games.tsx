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
					<h2 className="text-2xl font-bold text-gray-900">Games</h2>
					<p className="text-gray-600 mt-1">
						Manage all games and scorekeeping
					</p>
				</div>
				<Link
					to="/admin/games/new"
					className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
				>
					+ Create Game
				</Link>
			</div>

			{/* Filters */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
				<div className="flex items-center space-x-2">
					<span className="text-sm font-medium text-gray-700">Filter:</span>
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

			{/* Games List */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">
						{statusFilter === "all"
							? "All Games"
							: `${capitalize(statusFilter)} Games`}
						<span className="ml-2 text-sm font-normal text-gray-600">
							({games.length} total)
						</span>
					</h3>
				</div>

				{isPending ? (
					<div className="px-6 py-8 text-center text-gray-600">
						Loading games...
					</div>
				) : games.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Game
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Score
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Format
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Venue
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{games.map((game) => (
									<tr key={game._id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(game.status)}`}
											>
												{game.status === "live" && (
													<span className="animate-pulse mr-1">●</span>
												)}
												{game.status.toUpperCase()}
											</span>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm font-medium text-gray-900">
												{game.homeTeam?.abbreviation || "HOME"} vs{" "}
												{game.awayTeam?.abbreviation || "AWAY"}
											</div>
											<div className="text-sm text-gray-500">
												{game.homeTeam?.name} vs {game.awayTeam?.name}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{game.state ? (
												<div className="text-sm font-mono tabular-nums">
													{game.state.homeScore} - {game.state.awayScore}
												</div>
											) : (
												<div className="text-sm text-gray-400">-</div>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900 capitalize">
												{game.format}
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-900 max-w-xs truncate">
												{game.venue || "TBA"}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">
												{formatDateTime(game.scheduledStart)}
											</div>
										</td>
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<div className="flex justify-end items-center gap-2">
											<Link
												to="/games/$gameId"
												params={{ gameId: game._id }}
												className="inline-flex items-center justify-center w-24 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
											>
												<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
												View
											</Link>
											{(game.status === "live" ||
												game.status === "upcoming") && (
												<Link
													to="/admin/scorekeeper/$gameId"
													params={{ gameId: game._id }}
													className={`inline-flex items-center justify-center w-24 px-3 py-1.5 text-white text-sm font-medium rounded-md transition-colors shadow-sm ${
														game.status === "live"
															? "bg-green-600 hover:bg-green-700"
															: "bg-purple-600 hover:bg-purple-700"
													}`}
												>
													{game.status === "live" ? (
														<>
															<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
															</svg>
															Score
														</>
													) : (
														<>
															<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
															Start
														</>
													)}
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
					<div className="px-6 py-8 text-center text-gray-600">
						No {statusFilter !== "all" && statusFilter} games found.
						{statusFilter === "all" && (
							<div className="mt-4">
								<Link
									to="/admin/games/new"
									className="text-blue-600 hover:text-blue-700 font-medium"
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
			className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
				active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
			}`}
		>
			{children}
		</button>
	);
}

// Helper Functions

function getStatusBadgeClass(status: string): string {
	switch (status) {
		case "live":
			return "bg-red-100 text-red-800";
		case "upcoming":
			return "bg-blue-100 text-blue-800";
		case "completed":
			return "bg-green-100 text-green-800";
		case "cancelled":
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
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

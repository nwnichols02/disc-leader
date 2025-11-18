/**
 * Admin Dashboard - Home Page
 *
 * Overview of system status, live games, and quick actions
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useFeatureAccess } from "@/utils/feature-gates";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/admin/")({
	component: AdminDashboard,
});

function AdminDashboard() {
	const { isFree, isPro, isPremium, maxGames, maxTeams } = useFeatureAccess();

	// Fetch live games
	const liveGames = useQuery(api.games.getLiveGames, {}) ?? [];

	// Fetch all games with limit
	const recentGames = useQuery(api.games.listGames, { limit: 10 }) ?? [];

	// Fetch all teams
	const teams = useQuery(api.games.listTeams, {}) ?? [];

	const isNearGameLimit = isFree && recentGames.length >= maxGames - 1;
	const isAtGameLimit = isFree && recentGames.length >= maxGames;
	const isNearTeamLimit = isFree && teams.length >= maxTeams - 1;

		return (
		<div className="space-y-6">
			{/* Upgrade Banner for Free Tier */}
			{isFree && (isNearGameLimit || isNearTeamLimit) && (
				<div className={`alert shadow-xl ${isAtGameLimit ? "alert-error" : "alert-warning"}`}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
					>
						{isAtGameLimit ? (
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						) : (
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						)}
					</svg>
					<div className="flex-1 w-full">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
							<div className="flex-1">
								<h3 className="text-xl font-bold mb-2">
									{isAtGameLimit ? "Limit Reached!" : "Almost There!"}
								</h3>
								<p className="mb-3">
									{isAtGameLimit
										? `You've reached your limit of ${maxGames} games on the free plan.`
										: `You're using ${recentGames.length}/${maxGames} games and ${teams.length}/${maxTeams} teams.`}{" "}
									Upgrade to Pro for unlimited games and teams!
								</p>
								<ul className="text-sm space-y-1">
									<li className="flex items-center gap-2">
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
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Unlimited games and teams
									</li>
									<li className="flex items-center gap-2">
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
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Live scoreboard access
									</li>
									<li className="flex items-center gap-2">
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
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Advanced analytics
									</li>
								</ul>
							</div>
							<div className="flex-shrink-0">
								<Link
									to="/pricing"
									className="btn btn-secondary btn-lg"
								>
									View Pricing
								</Link>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Subscription Status */}
			{(isPro || isPremium) && (
				<div className="alert alert-success">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span className="font-semibold">
						{isPremium ? "Premium" : "Pro"} Member - Thank you for your support!
					</span>
				</div>
			)}

			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-base-content">Dashboard</h2>
					<p className="text-base-content/70 mt-1">
						Overview of your Ultimate Frisbee games and teams
					</p>
				</div>
				<Link
					to="/admin/games/new"
					className={`btn ${isAtGameLimit ? "btn-disabled" : "btn-primary"}`}
					disabled={isAtGameLimit}
				>
					+ Create Game
				</Link>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard
					title="Live Games"
					value={liveGames.length}
					color="error"
					icon="●"
				/>
				<StatCard
					title="Total Games"
					value={recentGames.length}
					color="primary"
					icon="🎯"
				/>
				<StatCard
					title="Teams"
					value={teams.length}
					color="success"
					icon="👥"
				/>
			</div>

			{/* Live Games Section */}
			<div className="card bg-base-200 shadow-lg">
				<div className="card-header px-6 py-4 border-b border-base-300">
					<h3 className="card-title text-base-content">Live Games</h3>
				</div>

				{liveGames.length > 0 ? (
					<div className="divide-y divide-base-300">
						{liveGames.map((game) => (
							<div
								key={game._id}
								className="px-6 py-4 hover:bg-base-300 transition-colors"
							>
								<div className="flex items-center justify-between">
									<Link
										to="/games/$gameId"
										params={{ gameId: game._id }}
										className="flex-1"
									>
										<div className="flex items-center space-x-3">
											<span className="badge badge-error">
												<span className="animate-pulse mr-1">●</span>
												LIVE
											</span>
											<span className="font-medium text-base-content">
												{game.homeTeam?.name} vs {game.awayTeam?.name}
											</span>
										</div>
										{game.state && (
											<div className="mt-2 text-sm text-base-content/70">
												Score: {game.state.homeScore} - {game.state.awayScore}
											</div>
										)}
									</Link>
									<div className="flex items-center space-x-4">
										<div className="text-sm text-base-content/60">
											{game.venue}
										</div>
										<Link
											to="/admin/scorekeeper/$gameId"
											params={{ gameId: game._id }}
											className="btn btn-success btn-sm"
										>
											Score
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="px-6 py-8 text-center text-base-content/60">
						No live games at the moment
					</div>
				)}
			</div>

			{/* Recent Games Section */}
			<div className="card bg-base-200 shadow-lg">
				<div className="card-header px-6 py-4 border-b border-base-300 flex justify-between items-center">
					<h3 className="card-title text-base-content">Recent Games</h3>
					<Link
						to="/admin/games"
						className="link link-primary text-sm font-medium"
					>
						View All →
					</Link>
				</div>

				{recentGames.length > 0 ? (
					<div className="divide-y divide-base-300">
						{recentGames.slice(0, 5).map((game) => (
							<Link
								key={game._id}
								to="/games/$gameId"
								params={{ gameId: game._id }}
								className="block px-6 py-4 hover:bg-base-300 transition-colors"
							>
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="flex items-center space-x-3">
											<span
												className={`badge ${getStatusBadgeClass(game.status)}`}
											>
												{game.status.toUpperCase()}
											</span>
											<span className="font-medium text-base-content">
												{game.homeTeam?.name} vs {game.awayTeam?.name}
											</span>
										</div>
										{game.state && (
											<div className="mt-2 text-sm text-base-content/70">
												{game.status === "completed" && "Final: "}
												Score: {game.state.homeScore} - {game.state.awayScore}
											</div>
										)}
									</div>
									<div className="text-sm text-base-content/60">
										{formatDate(game.scheduledStart)}
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="px-6 py-8 text-center text-base-content/60">
						No games yet. Create your first game!
					</div>
				)}
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<QuickActionCard
					title="Manage Games"
					description="View, create, and edit games"
					linkTo="/admin/games"
					linkText="Go to Games"
				/>
				<QuickActionCard
					title="Manage Teams"
					description="View and manage team rosters"
					linkTo="/admin/teams"
					linkText="Go to Teams"
				/>
			</div>
		</div>
	);
}

// Helper Components

function StatCard({
	title,
	value,
	color,
	icon,
}: {
	title: string;
	value: number;
	color: "error" | "primary" | "success";
	icon: string;
}) {
	const colorClasses = {
		error: "bg-error/20 text-error",
		primary: "bg-primary/20 text-primary",
		success: "bg-success/20 text-success",
	};

	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-base-content/70 mb-1">{title}</p>
						<p className="text-3xl font-bold text-base-content">{value}</p>
					</div>
					<div
						className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-2xl`}
					>
						{icon}
					</div>
				</div>
			</div>
		</div>
	);
}

function QuickActionCard({
	title,
	description,
	linkTo,
	linkText,
}: {
	title: string;
	description: string;
	linkTo: string;
	linkText: string;
}) {
	return (
		<div className="card bg-base-200 shadow-lg">
			<div className="card-body">
				<h4 className="card-title text-base-content mb-2">{title}</h4>
				<p className="text-base-content/70 mb-4">{description}</p>
				<Link to={linkTo} className="link link-primary font-medium text-sm">
					{linkText} →
				</Link>
			</div>
		</div>
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

function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffDays = Math.floor(
		(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays === -1) return "Tomorrow";
	if (diffDays < 0 && diffDays > -7) return `In ${Math.abs(diffDays)} days`;

	return date.toLocaleDateString();
}

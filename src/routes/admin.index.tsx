/**
 * Admin Dashboard - Home Page
 *
 * Overview of system status, live games, and quick actions
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { UpgradeButton } from "@/components/autumn/UpgradeButton";
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
				<div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<h3 className="text-xl font-bold mb-2">
								{isAtGameLimit ? "Limit Reached!" : "Almost There!"}
							</h3>
							<p className="text-blue-100 mb-4">
								{isAtGameLimit
									? `You've reached your limit of ${maxGames} games on the free plan.`
									: `You're using ${recentGames.length}/${maxGames} games and ${teams.length}/${maxTeams} teams.`}
								{" "}Upgrade to Pro for unlimited games and teams!
							</p>
							<ul className="text-sm text-blue-100 space-y-1 mb-4">
								<li>✓ Unlimited games and teams</li>
								<li>✓ Live scoreboard access</li>
								<li>✓ Advanced analytics</li>
							</ul>
						</div>
						<div className="ml-6">
							<UpgradeButton productId="pro" variant="secondary" size="lg" />
						</div>
					</div>
				</div>
			)}

			{/* Subscription Status */}
			{(isPro || isPremium) && (
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex items-center gap-3">
						<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
						</svg>
						<span className="font-semibold text-green-800">
							{isPremium ? "Premium" : "Pro"} Member - Thank you for your support!
						</span>
					</div>
				</div>
			)}

			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
					<p className="text-gray-600 mt-1">
						Overview of your Ultimate Frisbee games and teams
					</p>
				</div>
				<Link
					to="/admin/games/new"
					className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors font-medium ${
						isAtGameLimit
							? "bg-gray-400 text-gray-200 cursor-not-allowed"
							: "bg-blue-600 text-white hover:bg-blue-700"
					}`}
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
					color="red"
					icon="●"
				/>
				<StatCard
					title="Total Games"
					value={recentGames.length}
					color="blue"
					icon="🎯"
				/>
				<StatCard title="Teams" value={teams.length} color="green" icon="👥" />
			</div>

			{/* Live Games Section */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">Live Games</h3>
				</div>

				{liveGames.length > 0 ? (
					<div className="divide-y divide-gray-200">
						{liveGames.map((game) => (
							<div
								key={game._id}
								className="px-6 py-4 hover:bg-gray-50 transition-colors"
							>
								<div className="flex items-center justify-between">
									<Link
										to="/games/$gameId"
										params={{ gameId: game._id }}
										className="flex-1"
									>
										<div className="flex items-center space-x-3">
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
												<span className="animate-pulse mr-1">●</span>
												LIVE
											</span>
											<span className="font-medium text-gray-900">
												{game.homeTeam?.name} vs {game.awayTeam?.name}
											</span>
										</div>
										{game.state && (
											<div className="mt-2 text-sm text-gray-600">
												Score: {game.state.homeScore} - {game.state.awayScore}
											</div>
										)}
									</Link>
									<div className="flex items-center space-x-4">
										<div className="text-sm text-gray-500">{game.venue}</div>
										<Link
											to="/admin/scorekeeper/$gameId"
											params={{ gameId: game._id }}
											className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
										>
											Score
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="px-6 py-8 text-center text-gray-600">
						No live games at the moment
					</div>
				)}
			</div>

			{/* Recent Games Section */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
					<h3 className="text-lg font-semibold text-gray-900">Recent Games</h3>
					<Link
						to="/admin/games"
						className="text-sm text-blue-600 hover:text-blue-700 font-medium"
					>
						View All →
					</Link>
				</div>

				{recentGames.length > 0 ? (
					<div className="divide-y divide-gray-200">
						{recentGames.slice(0, 5).map((game) => (
							<Link
								key={game._id}
								to="/games/$gameId"
								params={{ gameId: game._id }}
								className="block px-6 py-4 hover:bg-gray-50 transition-colors"
							>
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="flex items-center space-x-3">
											<span
												className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(game.status)}`}
											>
												{game.status.toUpperCase()}
											</span>
											<span className="font-medium text-gray-900">
												{game.homeTeam?.name} vs {game.awayTeam?.name}
											</span>
										</div>
										{game.state && (
											<div className="mt-2 text-sm text-gray-600">
												{game.status === "completed" && "Final: "}
												Score: {game.state.homeScore} - {game.state.awayScore}
											</div>
										)}
									</div>
									<div className="text-sm text-gray-500">
										{formatDate(game.scheduledStart)}
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className="px-6 py-8 text-center text-gray-600">
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
	color: "red" | "blue" | "green";
	icon: string;
}) {
	const colorClasses = {
		red: "bg-red-50 text-red-600",
		blue: "bg-blue-50 text-blue-600",
		green: "bg-green-50 text-green-600",
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm text-gray-600 mb-1">{title}</p>
					<p className="text-3xl font-bold text-gray-900">{value}</p>
				</div>
				<div
					className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center text-2xl`}
				>
					{icon}
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
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
			<p className="text-gray-600 mb-4">{description}</p>
			<Link
				to={linkTo}
				className="text-blue-600 hover:text-blue-700 font-medium text-sm"
			>
				{linkText} →
			</Link>
		</div>
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

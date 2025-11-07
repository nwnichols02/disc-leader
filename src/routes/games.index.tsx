import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Clock, MapPin, Users, Radio, Calendar } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/games/")({
	component: BrowseGames,
});

function BrowseGames() {
	const games = useQuery(api.games.listGames, {});

	// Separate games by status
	const liveGames = games?.filter((game) => game.status === "live") || [];
	const upcomingGames =
		games?.filter((game) => game.status === "upcoming") || [];
	const completedGames =
		games?.filter((game) => game.status === "completed") || [];
	
	const isLoading = games === undefined;

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
				<div className="max-w-6xl mx-auto">
					<div className="animate-pulse">
						<div className="h-12 bg-slate-700 rounded-lg w-64 mb-8" />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="h-48 bg-slate-800 rounded-xl" />
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl md:text-5xl font-black text-white mb-4">
						<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
							Browse
						</span>{" "}
						<span className="text-gray-300">Games</span>
					</h1>
					<p className="text-gray-400 text-lg">
						Watch live games or see what's coming up next
					</p>
				</div>

				{/* Live Games Section */}
				{liveGames.length > 0 && (
					<section className="mb-12">
						<div className="flex items-center gap-3 mb-6">
							<Radio className="w-6 h-6 text-red-500 animate-pulse" />
							<h2 className="text-2xl font-bold text-white">
								Live Now ({liveGames.length})
							</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{liveGames.map((game) => (
								<GameCard key={game._id} game={game} isLive />
							))}
						</div>
					</section>
				)}

				{/* Upcoming Games Section */}
				{upcomingGames.length > 0 && (
					<section className="mb-12">
						<div className="flex items-center gap-3 mb-6">
							<Calendar className="w-6 h-6 text-cyan-400" />
							<h2 className="text-2xl font-bold text-white">
								Upcoming ({upcomingGames.length})
							</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{upcomingGames.map((game) => (
								<GameCard key={game._id} game={game} />
							))}
						</div>
					</section>
				)}

				{/* Completed Games Section */}
				{completedGames.length > 0 && (
					<section className="mb-12">
						<div className="flex items-center gap-3 mb-6">
							<Clock className="w-6 h-6 text-gray-400" />
							<h2 className="text-2xl font-bold text-white">
								Recent ({completedGames.length})
							</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{completedGames.slice(0, 6).map((game) => (
								<GameCard key={game._id} game={game} isCompleted />
							))}
						</div>
					</section>
				)}

				{/* No Games Message */}
				{!isLoading &&
					liveGames.length === 0 &&
					upcomingGames.length === 0 &&
					completedGames.length === 0 && (
						<div className="text-center py-16">
							<div className="text-6xl mb-4">🥏</div>
							<h3 className="text-2xl font-bold text-gray-300 mb-2">
								No games yet
							</h3>
							<p className="text-gray-500">
								Check back soon for live and upcoming games!
							</p>
						</div>
					)}
			</div>
		</div>
	);
}

interface GameCardProps {
	game: Doc<"games">;
	isLive?: boolean;
	isCompleted?: boolean;
}

function GameCard({ game, isLive, isCompleted }: GameCardProps) {
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const getFormatBadge = (format: string) => {
		switch (format) {
			case "professional":
				return "AUDL";
			case "tournament":
				return "Tournament";
			case "recreational":
				return "Rec";
			default:
				return format;
		}
	};

	return (
		<Link
			to="/games/$gameId"
			params={{ gameId: game._id }}
			className="block group"
		>
			<div
				className={`
        bg-slate-800/50 backdrop-blur-sm border rounded-xl p-6 
        transition-all duration-300 hover:scale-[1.02]
        ${isLive ? "border-red-500 shadow-lg shadow-red-500/20" : "border-slate-700 hover:border-cyan-500/50"}
        ${isCompleted ? "opacity-75" : ""}
      `}
			>
				{/* Status Badge */}
				<div className="flex items-center justify-between mb-4">
					{isLive && (
						<div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500 rounded-full">
							<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
							<span className="text-sm font-semibold text-red-400">
								LIVE NOW
							</span>
						</div>
					)}
					{!isLive && !isCompleted && (
						<div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500 rounded-full">
							<span className="text-sm font-semibold text-cyan-400">
								UPCOMING
							</span>
						</div>
					)}
					{isCompleted && (
						<div className="px-3 py-1 bg-gray-500/20 border border-gray-500 rounded-full">
							<span className="text-sm font-semibold text-gray-400">
								FINAL
							</span>
						</div>
					)}

					<div className="px-2 py-1 bg-slate-700 rounded text-xs font-semibold text-gray-300">
						{getFormatBadge(game.format)}
					</div>
				</div>

				{/* Teams */}
				<div className="mb-4">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-3 flex-1">
							<div
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: game.homeTeam?.primaryColor || "#3b82f6" }}
							/>
							<span className="text-lg font-semibold text-white truncate">
								{game.homeTeam?.name || "Home Team"}
							</span>
						</div>
						{isLive || isCompleted ? (
							<span className="text-2xl font-bold text-white ml-4">
								{game.state?.homeScore ?? 0}
							</span>
						) : null}
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3 flex-1">
							<div
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: game.awayTeamId?.primaryColor || "#ef4444" }}
							/>
							<span className="text-lg font-semibold text-white truncate">
								{game.awayTeamId?.name || "Away Team"}
							</span>
						</div>
						{isLive || isCompleted ? (
							<span className="text-2xl font-bold text-white ml-4">
								{game.state?.awayScore ?? 0}
							</span>
						) : null}
					</div>
				</div>

				{/* Game Info */}
				<div className="flex flex-wrap gap-4 text-sm text-gray-400">
					<div className="flex items-center gap-2">
						<Clock size={16} />
						<span>{formatDate(game.scheduledStart)}</span>
					</div>
					{game.venue && (
						<div className="flex items-center gap-2">
							<MapPin size={16} />
							<span className="truncate">{game.venue}</span>
						</div>
					)}
					{game.genderRatioRequired && (
						<div className="flex items-center gap-2">
							<Users size={16} />
							<span className="capitalize">Mixed</span>
						</div>
					)}
				</div>

				{/* View Game Link */}
				<div className="mt-4 pt-4 border-t border-slate-700">
					<span className="text-cyan-400 group-hover:text-cyan-300 font-medium flex items-center gap-2">
						{isLive ? "Watch Live" : isCompleted ? "View Results" : "View Details"}
						<span className="group-hover:translate-x-1 transition-transform">
							→
						</span>
					</span>
				</div>
			</div>
		</Link>
	);
}


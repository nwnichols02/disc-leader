import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Calendar, Clock, MapPin, Radio, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";
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
			<div className="min-h-screen bg-base-100 p-6">
				<div className="max-w-6xl mx-auto">
					<div className="animate-pulse">
						<div className="h-12 bg-base-300 rounded-lg w-64 mb-8" />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="h-48 bg-base-200 rounded-xl" />
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-base-100 p-6">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl md:text-5xl font-black text-base-content mb-4">
						<span className="text-primary">Browse</span>{" "}
						<span className="text-base-content/70">Games</span>
					</h1>
					<p className="text-base-content/60 text-lg">
						Watch live games or see what's coming up next
					</p>
				</div>

				{/* Live Games Section */}
				{liveGames.length > 0 && (
					<section className="mb-12">
						<div className="flex items-center gap-3 mb-6">
							<Radio className="w-6 h-6 text-error animate-pulse" />
							<h2 className="text-2xl font-bold text-base-content">
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
							<Calendar className="w-6 h-6 text-primary" />
							<h2 className="text-2xl font-bold text-base-content">
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
							<Clock className="w-6 h-6 text-base-content/60" />
							<h2 className="text-2xl font-bold text-base-content">
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
							<h3 className="text-2xl font-bold text-base-content/70 mb-2">
								No games yet
							</h3>
							<p className="text-base-content/50">
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
        card bg-base-200 border shadow-lg
        transition-all duration-300 hover:scale-[1.02]
        ${isLive ? "border-error shadow-error/20" : "border-base-300 hover:border-primary"}
        ${isCompleted ? "opacity-75" : ""}
      `}
			>
				<div className="card-body p-6">
					{/* Status Badge */}
					<div className="flex items-center justify-between mb-4">
						{isLive && (
							<div className="badge badge-error gap-2">
								<span className="w-2 h-2 bg-error rounded-full animate-pulse" />
								LIVE NOW
							</div>
						)}
						{!isLive && !isCompleted && (
							<div className="badge badge-info">UPCOMING</div>
						)}
						{isCompleted && <div className="badge badge-ghost">FINAL</div>}

						<div className="badge badge-outline">
							{getFormatBadge(game.format)}
						</div>
					</div>

					{/* Teams */}
					<div className="mb-4">
						<div className="flex items-center justify-between mb-2">
							<div className="flex items-center gap-3 flex-1">
								<div
									className="w-3 h-3 rounded-full"
									style={{
										backgroundColor: game.homeTeam?.primaryColor || "#3b82f6",
									}}
								/>
								<span className="text-lg font-semibold text-base-content truncate">
									{game.homeTeam?.name || "Home Team"}
								</span>
							</div>
							{isLive || isCompleted ? (
								<span className="text-2xl font-bold text-base-content ml-4">
									{game.state?.homeScore ?? 0}
								</span>
							) : null}
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3 flex-1">
								<div
									className="w-3 h-3 rounded-full"
									style={{
										backgroundColor: game.awayTeamId?.primaryColor || "#ef4444",
									}}
								/>
								<span className="text-lg font-semibold text-base-content truncate">
									{game.awayTeamId?.name || "Away Team"}
								</span>
							</div>
							{isLive || isCompleted ? (
								<span className="text-2xl font-bold text-base-content ml-4">
									{game.state?.awayScore ?? 0}
								</span>
							) : null}
						</div>
					</div>

					{/* Game Info */}
					<div className="flex flex-wrap gap-4 text-sm text-base-content/60">
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
					<div className="mt-4 pt-4 border-t border-base-300">
						<span className="link link-primary font-medium flex items-center gap-2">
							{isLive
								? "Watch Live"
								: isCompleted
									? "View Results"
									: "View Details"}
							<span className="group-hover:translate-x-1 transition-transform">
								→
							</span>
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}

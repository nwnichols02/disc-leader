/**
 * Create New Game Page
 * Comprehensive form for creating games with format-specific configurations
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Calendar, MapPin, Settings, Users } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/admin/games/new")({
	component: NewGamePage,
});

type GameFormat = "professional" | "tournament" | "recreational";

function NewGamePage() {
	const navigate = useNavigate();
	const teams = useQuery(api.games.listTeams);
	const createGame = useMutation(api.gameMutations.createGame);

	// Form state
	const [format, setFormat] = useState<GameFormat>("tournament");
	const [homeTeamId, setHomeTeamId] = useState<Id<"teams"> | "">("");
	const [awayTeamId, setAwayTeamId] = useState<Id<"teams"> | "">("");
	const [venue, setVenue] = useState("");
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [genderRatioRequired, setGenderRatioRequired] = useState(false);

	// Rule config state (varies by format)
	const [stallCount, setStallCount] = useState<6 | 7 | 10>(10);
	const [targetScore, setTargetScore] = useState(15);
	const [quarterLength, setQuarterLength] = useState(12);
	const [halfLength, setHalfLength] = useState(30);
	const [timeoutsPerHalf, setTimeoutsPerHalf] = useState(2);
	const [timeoutDuration, setTimeoutDuration] = useState(70);
	const [useSoftCap, setUseSoftCap] = useState(false);
	const [softCapTime, setSoftCapTime] = useState(75);
	const [hardCapTime, setHardCapTime] = useState(90);

	// Optional field info
	const [includeFieldInfo, setIncludeFieldInfo] = useState(false);
	const [fieldLength, setFieldLength] = useState(100);
	const [fieldWidth, setFieldWidth] = useState(37);
	const [endZoneDepth, setEndZoneDepth] = useState(25);
	const [surface, setSurface] = useState("grass");

	// UI state
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		console.log("Form submitted!");

		// Validation
		if (!homeTeamId || !awayTeamId) {
			setError("Please select both home and away teams");
			return;
		}
		if (homeTeamId === awayTeamId) {
			setError("Home and away teams must be different");
			return;
		}
		if (!venue.trim()) {
			setError("Please enter a venue");
			return;
		}
		if (!date || !time) {
			setError("Please select date and time");
			return;
		}

		console.log("Validation passed, submitting...");
		setIsSubmitting(true);

		try {
			// Combine date and time into Unix timestamp
			const scheduledStart = new Date(`${date}T${time}`).getTime();
			console.log("Scheduled start:", scheduledStart, new Date(scheduledStart));

			// Build rule config based on format
			const ruleConfig =
				format === "professional"
					? {
							stallCount,
							quarterLength,
							timeoutsPerHalf,
							timeoutDuration,
						}
					: format === "tournament"
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

			// Build field info if included
			const fieldInfo = includeFieldInfo
				? {
						length: fieldLength,
						width: fieldWidth,
						endZoneDepth,
						surface,
					}
				: undefined;

			// Create the game
			console.log("Calling createGame mutation with:", {
				format,
				homeTeamId,
				awayTeamId,
				scheduledStart,
				venue: venue.trim(),
				ruleConfig,
				genderRatioRequired,
				fieldInfo,
			});

			const gameId = await createGame({
				format,
				homeTeamId: homeTeamId as Id<"teams">,
				awayTeamId: awayTeamId as Id<"teams">,
				scheduledStart,
				venue: venue.trim(),
				ruleConfig,
				genderRatioRequired,
				fieldInfo,
			});

			console.log("Game created successfully! ID:", gameId);

			// Navigate to the game's scorekeeper page
			console.log("Navigating to scorekeeper:", `/admin/scorekeeper/${gameId}`);
			navigate({ to: `/admin/scorekeeper/${gameId}` });
		} catch (err) {
			console.error("Error creating game:", err);
			setError(err instanceof Error ? err.message : "Failed to create game");
			setIsSubmitting(false);
		}
	};

	const isLoading = teams === undefined;

	console.log("Teams loaded:", teams?.length, "teams");

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="animate-pulse">
					<div className="h-8 bg-slate-700 rounded w-1/4 mb-8" />
					<div className="bg-slate-800 rounded-lg p-8 space-y-6">
						<div className="h-10 bg-slate-700 rounded w-1/3" />
						<div className="h-20 bg-slate-700 rounded" />
						<div className="h-20 bg-slate-700 rounded" />
					</div>
				</div>
			</div>
		);
	}

	if (teams && teams.length === 0) {
		return (
			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="mb-8">
					<Link
						to="/admin/games"
						className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-2"
					>
						← Back to Games
					</Link>
				</div>
				<div className="bg-red-500/10 border border-red-500/50 rounded-lg p-8 text-center">
					<AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
					<h2 className="text-2xl font-bold text-white mb-2">No Teams Found</h2>
					<p className="text-gray-300 mb-4">
						You need to create teams before you can create a game.
					</p>
					<Link
						to="/admin/teams"
						className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
					>
						Go to Teams Management
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<Link
					to="/admin/games"
					className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-2"
				>
					← Back to Games
				</Link>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit}>
				<div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-8 space-y-8">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">
							Create New Game
						</h1>
						<p className="text-gray-400">
							Set up a new game with format-specific configurations
						</p>
					</div>

					{/* Error Message */}
					{error && (
						<div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
							<AlertCircle
								className="text-red-500 flex-shrink-0 mt-0.5"
								size={20}
							/>
							<div>
								<h3 className="font-semibold text-red-400 mb-1">Error</h3>
								<p className="text-red-300 text-sm">{error}</p>
							</div>
						</div>
					)}

					{/* Game Format */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Settings className="text-cyan-400" size={20} />
							<h2 className="text-xl font-bold text-white">Game Format</h2>
						</div>
						<div className="grid grid-cols-3 gap-4">
							{(["professional", "tournament", "recreational"] as const).map(
								(fmt) => (
									<button
										key={fmt}
										type="button"
										onClick={() => setFormat(fmt)}
										className={`p-4 rounded-lg border-2 transition-all ${
											format === fmt
												? "border-cyan-500 bg-cyan-500/10"
												: "border-slate-600 bg-slate-700/50 hover:border-slate-500"
										}`}
									>
										<div className="text-center">
											<div
												className={`font-bold mb-1 capitalize ${
													format === fmt ? "text-cyan-400" : "text-white"
												}`}
											>
												{fmt}
											</div>
											<div className="text-xs text-gray-400">
												{fmt === "professional"
													? "Quarters, 12min"
													: fmt === "tournament"
														? "To 15, caps"
														: "Halves, 30min"}
											</div>
										</div>
									</button>
								),
							)}
						</div>
					</div>

					{/* Teams */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Users className="text-cyan-400" size={20} />
							<h2 className="text-xl font-bold text-white">Teams</h2>
						</div>
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Home Team *
								</label>
								<select
									value={homeTeamId}
									onChange={(e) => setHomeTeamId(e.target.value as Id<"teams">)}
									className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
									required
								>
									<option value="">Select home team...</option>
									{teams?.map((team) => (
										<option key={team._id} value={team._id}>
											{team.name} ({team.abbreviation})
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Away Team *
								</label>
								<select
									value={awayTeamId}
									onChange={(e) => setAwayTeamId(e.target.value as Id<"teams">)}
									className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
									required
								>
									<option value="">Select away team...</option>
									{teams?.map((team) => (
										<option key={team._id} value={team._id}>
											{team.name} ({team.abbreviation})
										</option>
									))}
								</select>
							</div>
						</div>
						<label className="flex items-center gap-2 text-gray-300">
							<input
								type="checkbox"
								checked={genderRatioRequired}
								onChange={(e) => setGenderRatioRequired(e.target.checked)}
								className="w-4 h-4 text-cyan-500 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
							/>
							<span className="text-sm">
								Mixed division (gender ratio required)
							</span>
						</label>
					</div>

					{/* Date, Time & Location */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Calendar className="text-cyan-400" size={20} />
							<h2 className="text-xl font-bold text-white">
								Schedule & Location
							</h2>
						</div>
						<div className="grid md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Date *
								</label>
								<input
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Time *
								</label>
								<input
									type="time"
									value={time}
									onChange={(e) => setTime(e.target.value)}
									className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
									required
								/>
							</div>
							<div className="md:col-span-3">
								<label className="block text-sm font-medium text-gray-300 mb-2">
									<MapPin className="inline mr-1" size={16} />
									Venue *
								</label>
								<input
									type="text"
									value={venue}
									onChange={(e) => setVenue(e.target.value)}
									placeholder="e.g. National Sports Complex Field 3"
									className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
									required
								/>
							</div>
						</div>
					</div>

					{/* Format-Specific Rules */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Settings className="text-cyan-400" size={20} />
							<h2 className="text-xl font-bold text-white">Game Rules</h2>
						</div>

						<div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
							{/* Common Rules */}
							<div className="grid md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Stall Count
									</label>
									<select
										value={stallCount}
										onChange={(e) =>
											setStallCount(Number(e.target.value) as 6 | 7 | 10)
										}
										className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
									>
										<option value={6}>6 seconds</option>
										<option value={7}>7 seconds</option>
										<option value={10}>10 seconds</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Timeouts Per Half
									</label>
									<input
										type="number"
										value={timeoutsPerHalf}
										onChange={(e) => setTimeoutsPerHalf(Number(e.target.value))}
										min={0}
										max={5}
										className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
									/>
								</div>
							</div>

							{/* Professional: Quarters */}
							{format === "professional" && (
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Quarter Length (minutes)
									</label>
									<input
										type="number"
										value={quarterLength}
										onChange={(e) => setQuarterLength(Number(e.target.value))}
										min={8}
										max={15}
										className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
									/>
								</div>
							)}

							{/* Tournament: Target Score & Caps */}
							{format === "tournament" && (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Target Score
										</label>
										<select
											value={targetScore}
											onChange={(e) => setTargetScore(Number(e.target.value))}
											className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
										>
											<option value={11}>11 points</option>
											<option value={13}>13 points</option>
											<option value={15}>15 points</option>
										</select>
									</div>

									<label className="flex items-center gap-2 text-gray-300">
										<input
											type="checkbox"
											checked={useSoftCap}
											onChange={(e) => setUseSoftCap(e.target.checked)}
											className="w-4 h-4 text-cyan-500 bg-slate-600 border-slate-500 rounded focus:ring-cyan-500"
										/>
										<span className="text-sm font-medium">
											Enable time caps
										</span>
									</label>

									{useSoftCap && (
										<div className="grid md:grid-cols-2 gap-4 pl-6">
											<div>
												<label className="block text-sm font-medium text-gray-300 mb-2">
													Soft Cap (minutes)
												</label>
												<input
													type="number"
													value={softCapTime}
													onChange={(e) =>
														setSoftCapTime(Number(e.target.value))
													}
													min={60}
													max={120}
													className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-300 mb-2">
													Hard Cap (minutes)
												</label>
												<input
													type="number"
													value={hardCapTime}
													onChange={(e) =>
														setHardCapTime(Number(e.target.value))
													}
													min={75}
													max={150}
													className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
												/>
											</div>
										</div>
									)}
								</>
							)}

							{/* Recreational: Halves */}
							{format === "recreational" && (
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">
										Half Length (minutes)
									</label>
									<input
										type="number"
										value={halfLength}
										onChange={(e) => setHalfLength(Number(e.target.value))}
										min={20}
										max={40}
										className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
									/>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Timeout Duration (seconds)
								</label>
								<input
									type="number"
									value={timeoutDuration}
									onChange={(e) => setTimeoutDuration(Number(e.target.value))}
									min={30}
									max={120}
									step={10}
									className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
								/>
							</div>
						</div>
					</div>

					{/* Optional Field Info */}
					<div className="space-y-4">
						<label className="flex items-center gap-2 text-gray-300">
							<input
								type="checkbox"
								checked={includeFieldInfo}
								onChange={(e) => setIncludeFieldInfo(e.target.checked)}
								className="w-4 h-4 text-cyan-500 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
							/>
							<span className="text-sm font-medium">
								Include field dimensions (optional)
							</span>
						</label>

						{includeFieldInfo && (
							<div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Field Length (yards)
										</label>
										<input
											type="number"
											value={fieldLength}
											onChange={(e) => setFieldLength(Number(e.target.value))}
											min={80}
											max={120}
											className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Field Width (yards)
										</label>
										<input
											type="number"
											value={fieldWidth}
											onChange={(e) => setFieldWidth(Number(e.target.value))}
											min={30}
											max={50}
											className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											End Zone Depth (yards)
										</label>
										<input
											type="number"
											value={endZoneDepth}
											onChange={(e) => setEndZoneDepth(Number(e.target.value))}
											min={15}
											max={30}
											className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Surface Type
										</label>
										<select
											value={surface}
											onChange={(e) => setSurface(e.target.value)}
											className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
										>
											<option value="grass">Grass</option>
											<option value="turf">Turf</option>
											<option value="artificial">Artificial Turf</option>
											<option value="mixed">Mixed</option>
										</select>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Submit Buttons */}
					<div className="flex gap-4 pt-6 border-t border-slate-700">
						<Link
							to="/admin/games"
							className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors text-center"
						>
							Cancel
						</Link>
						<button
							type="submit"
							disabled={isSubmitting || !homeTeamId || !awayTeamId}
							onClick={() => {
								console.log("Button clicked!");
								console.log("isSubmitting:", isSubmitting);
								console.log("homeTeamId:", homeTeamId);
								console.log("awayTeamId:", awayTeamId);
								console.log(
									"Button disabled:",
									isSubmitting || !homeTeamId || !awayTeamId,
								);
							}}
							className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
						>
							{isSubmitting ? "Creating Game..." : "Create Game"}
						</button>
					</div>

					{/* Debug info */}
					{(!homeTeamId || !awayTeamId) && (
						<div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
							<p className="text-yellow-400 text-sm">
								⚠️ Button is disabled: Please select both teams to continue
							</p>
						</div>
					)}
				</div>
			</form>
		</div>
	);
}

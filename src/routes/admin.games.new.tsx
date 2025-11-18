/**
 * Create New Game Page
 * Comprehensive form for creating games with format-specific configurations
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { AlertCircle, Calendar, MapPin, Settings, Users } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/admin/games/new")({
	component: NewGamePage,
});

type GameFormat = "professional" | "tournament" | "recreational";

/**
 * Render the admin "Create New Game" page with a form for configuring and creating games.
 *
 * The component presents format-specific rule options, optional field dimensions, team selection,
 * scheduling and venue inputs, validation of required fields, and submits a create-game mutation.
 * On successful creation it navigates to the game's scorekeeper page.
 *
 * @returns The component's JSX element rendering the create-game form and related UI states.
 *
 * @example
 * <Route path="/admin/games/new" component={NewGamePage} />
 */
function NewGamePage() {
	const navigate = useNavigate();
	const teams = useQuery(api.games.listTeams);
	const createGameWithStream = useAction(api.streams.createGameWithStream);

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

			// Create the game with automatic live input
			console.log("Calling createGameWithStream action with:", {
				format,
				homeTeamId,
				awayTeamId,
				scheduledStart,
				venue: venue.trim(),
				ruleConfig,
				genderRatioRequired,
				fieldInfo,
			});

			const gameId = await createGameWithStream({
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
					<div className="h-8 bg-base-300 rounded w-1/4 mb-8" />
					<div className="card bg-base-200 p-8 space-y-6">
						<div className="h-10 bg-base-300 rounded w-1/3" />
						<div className="h-20 bg-base-300 rounded" />
						<div className="h-20 bg-base-300 rounded" />
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
						className="link link-primary font-medium inline-flex items-center gap-2"
					>
						← Back to Games
					</Link>
				</div>
				<div className="alert alert-error">
					<AlertCircle
						className="stroke-current shrink-0 h-12 w-12"
						size={48}
					/>
					<div>
						<h2 className="text-2xl font-bold mb-2">No Teams Found</h2>
						<p className="mb-4">
							You need to create teams before you can create a game.
						</p>
						<Link to="/admin/teams" className="btn btn-primary">
							Go to Teams Management
						</Link>
					</div>
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
					className="link link-primary font-medium inline-flex items-center gap-2"
				>
					← Back to Games
				</Link>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit}>
				<div className="card bg-base-200 shadow-xl p-8 space-y-8">
					<div>
						<h1 className="text-3xl font-bold text-base-content mb-2">
							Create New Game
						</h1>
						<p className="text-base-content/70">
							Set up a new game with format-specific configurations
						</p>
					</div>

					{/* Error Message */}
					{error && (
						<div className="alert alert-error">
							<AlertCircle
								className="stroke-current shrink-0 h-6 w-6"
								size={20}
							/>
							<div>
								<h3 className="font-bold">Error</h3>
								<div className="text-xs">{error}</div>
							</div>
						</div>
					)}

					{/* Game Format */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Settings className="text-primary" size={20} />
							<h2 className="text-xl font-bold text-base-content">
								Game Format
							</h2>
						</div>
						<div className="grid grid-cols-3 gap-4">
							{(["professional", "tournament", "recreational"] as const).map(
								(fmt) => (
									<button
										key={fmt}
										type="button"
										onClick={() => setFormat(fmt)}
										className={`btn ${format === fmt ? "btn-active btn-primary" : "btn-outline"}`}
									>
										<div className="text-center w-full">
											<div className="font-bold mb-1 capitalize">{fmt}</div>
											<div className="text-xs opacity-70">
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
							<Users className="text-primary" size={20} />
							<h2 className="text-xl font-bold text-base-content">Teams</h2>
						</div>
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<label className="label">
									<span className="label-text">Home Team *</span>
								</label>
								<select
									value={homeTeamId}
									onChange={(e) => setHomeTeamId(e.target.value as Id<"teams">)}
									className="select select-bordered w-full"
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
								<label className="label">
									<span className="label-text">Away Team *</span>
								</label>
								<select
									value={awayTeamId}
									onChange={(e) => setAwayTeamId(e.target.value as Id<"teams">)}
									className="select select-bordered w-full"
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
						<label className="label cursor-pointer">
							<span className="label-text">
								Mixed division (gender ratio required)
							</span>
							<input
								type="checkbox"
								checked={genderRatioRequired}
								onChange={(e) => setGenderRatioRequired(e.target.checked)}
								className="checkbox checkbox-primary"
							/>
						</label>
					</div>

					{/* Date, Time & Location */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Calendar className="text-primary" size={20} />
							<h2 className="text-xl font-bold text-base-content">
								Schedule & Location
							</h2>
						</div>
						<div className="grid md:grid-cols-3 gap-4">
							<div>
								<label className="label">
									<span className="label-text">Date *</span>
								</label>
								<input
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									className="input input-bordered w-full"
									required
								/>
							</div>
							<div>
								<label className="label">
									<span className="label-text">Time *</span>
								</label>
								<input
									type="time"
									value={time}
									onChange={(e) => setTime(e.target.value)}
									className="input input-bordered w-full"
									required
								/>
							</div>
							<div className="md:col-span-3">
								<label className="label">
									<span className="label-text">
										<MapPin className="inline mr-1" size={16} />
										Venue *
									</span>
								</label>
								<input
									type="text"
									value={venue}
									onChange={(e) => setVenue(e.target.value)}
									placeholder="e.g. National Sports Complex Field 3"
									className="input input-bordered w-full"
									required
								/>
							</div>
						</div>
					</div>

					{/* Format-Specific Rules */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Settings className="text-primary" size={20} />
							<h2 className="text-xl font-bold text-base-content">
								Game Rules
							</h2>
						</div>

						<div className="card bg-base-300 p-6 space-y-4">
							{/* Common Rules */}
							<div className="grid md:grid-cols-2 gap-4">
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
										<option value={6}>6 seconds</option>
										<option value={7}>7 seconds</option>
										<option value={10}>10 seconds</option>
									</select>
								</div>
								<div>
									<label className="label">
										<span className="label-text">Timeouts Per Half</span>
									</label>
									<input
										type="number"
										value={timeoutsPerHalf}
										onChange={(e) => setTimeoutsPerHalf(Number(e.target.value))}
										min={0}
										max={5}
										className="input input-bordered w-full"
									/>
								</div>
							</div>

							{/* Professional: Quarters */}
							{format === "professional" && (
								<div>
									<label className="label">
										<span className="label-text">Quarter Length (minutes)</span>
									</label>
									<input
										type="number"
										value={quarterLength}
										onChange={(e) => setQuarterLength(Number(e.target.value))}
										min={8}
										max={15}
										className="input input-bordered w-full"
									/>
								</div>
							)}

							{/* Tournament: Target Score & Caps */}
							{format === "tournament" && (
								<>
									<div>
										<label className="label">
											<span className="label-text">Target Score</span>
										</label>
										<select
											value={targetScore}
											onChange={(e) => setTargetScore(Number(e.target.value))}
											className="select select-bordered w-full"
										>
											<option value={11}>11 points</option>
											<option value={13}>13 points</option>
											<option value={15}>15 points</option>
										</select>
									</div>

									<label className="label cursor-pointer">
										<span className="label-text font-medium">
											Enable time caps
										</span>
										<input
											type="checkbox"
											checked={useSoftCap}
											onChange={(e) => setUseSoftCap(e.target.checked)}
											className="checkbox checkbox-primary"
										/>
									</label>

									{useSoftCap && (
										<div className="grid md:grid-cols-2 gap-4 pl-6">
											<div>
												<label className="label">
													<span className="label-text">Soft Cap (minutes)</span>
												</label>
												<input
													type="number"
													value={softCapTime}
													onChange={(e) =>
														setSoftCapTime(Number(e.target.value))
													}
													min={60}
													max={120}
													className="input input-bordered w-full"
												/>
											</div>
											<div>
												<label className="label">
													<span className="label-text">Hard Cap (minutes)</span>
												</label>
												<input
													type="number"
													value={hardCapTime}
													onChange={(e) =>
														setHardCapTime(Number(e.target.value))
													}
													min={75}
													max={150}
													className="input input-bordered w-full"
												/>
											</div>
										</div>
									)}
								</>
							)}

							{/* Recreational: Halves */}
							{format === "recreational" && (
								<div>
									<label className="label">
										<span className="label-text">Half Length (minutes)</span>
									</label>
									<input
										type="number"
										value={halfLength}
										onChange={(e) => setHalfLength(Number(e.target.value))}
										min={20}
										max={40}
										className="input input-bordered w-full"
									/>
								</div>
							)}

							<div>
								<label className="label">
									<span className="label-text">Timeout Duration (seconds)</span>
								</label>
								<input
									type="number"
									value={timeoutDuration}
									onChange={(e) => setTimeoutDuration(Number(e.target.value))}
									min={30}
									max={120}
									step={10}
									className="input input-bordered w-full"
								/>
							</div>
						</div>
					</div>

					{/* Optional Field Info */}
					<div className="space-y-4">
						<label className="label cursor-pointer">
							<span className="label-text font-medium">
								Include field dimensions (optional)
							</span>
							<input
								type="checkbox"
								checked={includeFieldInfo}
								onChange={(e) => setIncludeFieldInfo(e.target.checked)}
								className="checkbox checkbox-primary"
							/>
						</label>

						{includeFieldInfo && (
							<div className="card bg-base-300 p-6 space-y-4">
								<div className="grid md:grid-cols-2 gap-4">
									<div>
										<label className="label">
											<span className="label-text">Field Length (yards)</span>
										</label>
										<input
											type="number"
											value={fieldLength}
											onChange={(e) => setFieldLength(Number(e.target.value))}
											min={80}
											max={120}
											className="input input-bordered w-full"
										/>
									</div>
									<div>
										<label className="label">
											<span className="label-text">Field Width (yards)</span>
										</label>
										<input
											type="number"
											value={fieldWidth}
											onChange={(e) => setFieldWidth(Number(e.target.value))}
											min={30}
											max={50}
											className="input input-bordered w-full"
										/>
									</div>
									<div>
										<label className="label">
											<span className="label-text">End Zone Depth (yards)</span>
										</label>
										<input
											type="number"
											value={endZoneDepth}
											onChange={(e) => setEndZoneDepth(Number(e.target.value))}
											min={15}
											max={30}
											className="input input-bordered w-full"
										/>
									</div>
									<div>
										<label className="label">
											<span className="label-text">Surface Type</span>
										</label>
										<select
											value={surface}
											onChange={(e) => setSurface(e.target.value)}
											className="select select-bordered w-full"
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
					<div className="card-actions pt-6 border-t border-base-300">
						<Link to="/admin/games" className="btn btn-ghost flex-1">
							Cancel
						</Link>
						<button
							type="submit"
							disabled={isSubmitting || !homeTeamId || !awayTeamId}
							className="btn btn-primary flex-1"
						>
							{isSubmitting ? (
								<>
									<span className="loading loading-spinner loading-sm"></span>
									Creating Game...
								</>
							) : (
								"Create Game"
							)}
						</button>
					</div>

					{/* Debug info */}
					{(!homeTeamId || !awayTeamId) && (
						<div className="alert alert-warning mt-4">
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
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<span className="text-sm">
								⚠️ Button is disabled: Please select both teams to continue
							</span>
						</div>
					)}
				</div>
			</form>
		</div>
	);
}

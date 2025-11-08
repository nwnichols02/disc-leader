/**
 * Create New Team Page
 * Form for creating teams with branding and division information
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { AlertCircle, Palette, Users } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/admin/teams/new")({
	component: NewTeamPage,
});

type Division = "open" | "womens" | "mixed";

/**
 * Render the "Create New Team" admin page, including a form to enter team details and submit a create-team request.
 *
 * The form collects name, abbreviation, primary/secondary colors, optional division, and optional logo URL; it validates required fields and navigates back to the teams list on successful creation.
 *
 * @returns The React element for the New Team page.
 *
 * @example
 * <NewTeamPage />
 */
function NewTeamPage() {
	const navigate = useNavigate();
	const createTeam = useMutation(api.gameMutations.createTeam);

	// Form state
	const [name, setName] = useState("");
	const [abbreviation, setAbbreviation] = useState("");
	const [primaryColor, setPrimaryColor] = useState("#3b82f6");
	const [secondaryColor, setSecondaryColor] = useState("#1e40af");
	const [division, setDivision] = useState<Division | "">("");
	const [logo, setLogo] = useState("");

	// UI state
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Validation
		if (!name.trim()) {
			setError("Team name is required");
			return;
		}
		if (!abbreviation.trim()) {
			setError("Abbreviation is required");
			return;
		}
		if (abbreviation.trim().length > 5) {
			setError("Abbreviation must be 5 characters or less");
			return;
		}

		setIsSubmitting(true);

		try {
			await createTeam({
				name: name.trim(),
				abbreviation: abbreviation.trim().toUpperCase(),
				colors: {
					primary: primaryColor,
					secondary: secondaryColor,
				},
				...(division && { division: division as Division }),
				...(logo.trim() && { logo: logo.trim() }),
			});

			// Success - navigate back to teams list
			navigate({ to: "/admin/teams" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create team");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<Link
					to="/admin/teams"
					className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-2"
				>
					← Back to Teams
				</Link>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit}>
				<div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-8 space-y-8">
					<div className="flex items-center gap-3">
						<div className="p-3 bg-cyan-500/10 rounded-lg">
							<Users className="text-cyan-400" size={28} />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white mb-2">
								Create New Team
							</h1>
							<p className="text-gray-400">
								Add a team to your league with branding and division info
							</p>
						</div>
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

					{/* Team Information Section */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Users className="text-cyan-400" size={20} />
							<h2 className="text-xl font-bold text-white">Team Information</h2>
						</div>

						<div className="bg-slate-700/50 rounded-lg p-6 space-y-4">
							{/* Team Name */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Team Name *
								</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. San Francisco Revolver"
									className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
									required
								/>
							</div>

							{/* Abbreviation */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Abbreviation * (Max 5 characters)
								</label>
								<input
									type="text"
									value={abbreviation}
									onChange={(e) =>
										setAbbreviation(e.target.value.toUpperCase())
									}
									placeholder="e.g. SFR"
									maxLength={5}
									className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
									required
								/>
								<p className="mt-1 text-xs text-gray-400">
									{abbreviation.length}/5 characters - Used on scoreboards
								</p>
							</div>

							{/* Division */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Division (Optional)
								</label>
								<select
									value={division}
									onChange={(e) => setDivision(e.target.value as Division | "")}
									className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
								>
									<option value="">Select division...</option>
									<option value="open">Open</option>
									<option value="womens">Women's</option>
									<option value="mixed">Mixed</option>
								</select>
							</div>
						</div>
					</div>

					{/* Team Branding Section */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Palette className="text-cyan-400" size={20} />
							<h2 className="text-xl font-bold text-white">Team Branding</h2>
						</div>

						<div className="bg-slate-700/50 rounded-lg p-6 space-y-6">
							{/* Colors */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-3">
									Team Colors *
								</label>

								<div className="grid md:grid-cols-2 gap-6">
									{/* Primary Color */}
									<div>
										<label className="block text-xs font-medium text-gray-400 mb-2">
											Primary Color
										</label>
										<div className="flex items-center gap-3">
											<input
												type="color"
												value={primaryColor}
												onChange={(e) => setPrimaryColor(e.target.value)}
												className="w-20 h-20 rounded-lg border-2 border-slate-500 cursor-pointer bg-slate-600"
											/>
											<div className="flex-1">
												<input
													type="text"
													value={primaryColor}
													onChange={(e) => setPrimaryColor(e.target.value)}
													placeholder="#3b82f6"
													className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
												/>
												<p className="mt-1 text-xs text-gray-400">
													Hex color code
												</p>
											</div>
										</div>
									</div>

									{/* Secondary Color */}
									<div>
										<label className="block text-xs font-medium text-gray-400 mb-2">
											Secondary Color
										</label>
										<div className="flex items-center gap-3">
											<input
												type="color"
												value={secondaryColor}
												onChange={(e) => setSecondaryColor(e.target.value)}
												className="w-20 h-20 rounded-lg border-2 border-slate-500 cursor-pointer bg-slate-600"
											/>
											<div className="flex-1">
												<input
													type="text"
													value={secondaryColor}
													onChange={(e) => setSecondaryColor(e.target.value)}
													placeholder="#1e40af"
													className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
												/>
												<p className="mt-1 text-xs text-gray-400">
													Hex color code
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* Color Preview */}
								<div className="mt-6">
									<p className="text-sm font-medium text-gray-300 mb-3">
										Preview
									</p>
									<div
										className="h-32 rounded-lg flex items-center justify-center text-white text-4xl font-bold shadow-lg border border-slate-600"
										style={{
											background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
										}}
									>
										{abbreviation || "ABC"}
									</div>
									<p className="mt-2 text-xs text-gray-400 text-center">
										This is how your team will appear in games and scoreboards
									</p>
								</div>
							</div>

							{/* Logo URL */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Logo URL (Optional)
								</label>
								<input
									type="url"
									value={logo}
									onChange={(e) => setLogo(e.target.value)}
									placeholder="https://example.com/logo.png"
									className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
								/>
								<p className="mt-1 text-xs text-gray-400">
									URL to the team's logo image (for future use)
								</p>
							</div>
						</div>
					</div>

					{/* Submit Buttons */}
					<div className="flex gap-4 pt-6 border-t border-slate-700">
						<Link
							to="/admin/teams"
							className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors text-center"
						>
							Cancel
						</Link>
						<button
							type="submit"
							disabled={isSubmitting || !name.trim() || !abbreviation.trim()}
							className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
						>
							{isSubmitting ? "Creating Team..." : "Create Team"}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
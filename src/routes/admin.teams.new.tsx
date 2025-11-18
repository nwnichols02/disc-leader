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
					className="link link-primary font-medium inline-flex items-center gap-2"
				>
					← Back to Teams
				</Link>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit}>
				<div className="card bg-base-200 shadow-xl p-8 space-y-8">
					<div className="flex items-center gap-3">
						<div className="p-3 bg-primary/10 rounded-lg">
							<Users className="text-primary" size={28} />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-base-content mb-2">
								Create New Team
							</h1>
							<p className="text-base-content/70">
								Add a team to your league with branding and division info
							</p>
						</div>
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

					{/* Team Information Section */}
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Users className="text-primary" size={20} />
							<h2 className="text-xl font-bold text-base-content">
								Team Information
							</h2>
						</div>

						<div className="card bg-base-300 p-6 space-y-4">
							{/* Team Name */}
							<div>
								<label className="label">
									<span className="label-text">Team Name *</span>
								</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. San Francisco Revolver"
									className="input input-bordered w-full"
									required
								/>
							</div>

							{/* Abbreviation */}
							<div>
								<label className="label">
									<span className="label-text">
										Abbreviation * (Max 5 characters)
									</span>
								</label>
								<input
									type="text"
									value={abbreviation}
									onChange={(e) =>
										setAbbreviation(e.target.value.toUpperCase())
									}
									placeholder="e.g. SFR"
									maxLength={5}
									className="input input-bordered w-full uppercase"
									required
								/>
								<label className="label">
									<span className="label-text-alt">
										{abbreviation.length}/5 characters - Used on scoreboards
									</span>
								</label>
							</div>

							{/* Division */}
							<div>
								<label className="label">
									<span className="label-text">Division (Optional)</span>
								</label>
								<select
									value={division}
									onChange={(e) => setDivision(e.target.value as Division | "")}
									className="select select-bordered w-full"
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
							<Palette className="text-primary" size={20} />
							<h2 className="text-xl font-bold text-base-content">
								Team Branding
							</h2>
						</div>

						<div className="card bg-base-300 p-6 space-y-6">
							{/* Colors */}
							<div>
								<label className="label">
									<span className="label-text">Team Colors *</span>
								</label>

								<div className="grid md:grid-cols-2 gap-6">
									{/* Primary Color */}
									<div>
										<label className="label">
											<span className="label-text-alt">Primary Color</span>
										</label>
										<div className="flex items-center gap-3">
											<input
												type="color"
												value={primaryColor}
												onChange={(e) => setPrimaryColor(e.target.value)}
												className="w-20 h-20 rounded-lg border-2 border-base-300 cursor-pointer"
											/>
											<div className="flex-1">
												<input
													type="text"
													value={primaryColor}
													onChange={(e) => setPrimaryColor(e.target.value)}
													placeholder="#3b82f6"
													className="input input-bordered w-full text-sm font-mono"
												/>
												<label className="label">
													<span className="label-text-alt">Hex color code</span>
												</label>
											</div>
										</div>
									</div>

									{/* Secondary Color */}
									<div>
										<label className="label">
											<span className="label-text-alt">Secondary Color</span>
										</label>
										<div className="flex items-center gap-3">
											<input
												type="color"
												value={secondaryColor}
												onChange={(e) => setSecondaryColor(e.target.value)}
												className="w-20 h-20 rounded-lg border-2 border-base-300 cursor-pointer"
											/>
											<div className="flex-1">
												<input
													type="text"
													value={secondaryColor}
													onChange={(e) => setSecondaryColor(e.target.value)}
													placeholder="#1e40af"
													className="input input-bordered w-full text-sm font-mono"
												/>
												<label className="label">
													<span className="label-text-alt">Hex color code</span>
												</label>
											</div>
										</div>
									</div>
								</div>

								{/* Color Preview */}
								<div className="mt-6">
									<label className="label">
										<span className="label-text">Preview</span>
									</label>
									<div
										className="h-32 rounded-lg flex items-center justify-center text-white text-4xl font-bold shadow-lg border border-base-300"
										style={{
											background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
										}}
									>
										{abbreviation || "ABC"}
									</div>
									<label className="label">
										<span className="label-text-alt text-center w-full">
											This is how your team will appear in games and scoreboards
										</span>
									</label>
								</div>
							</div>

							{/* Logo URL */}
							<div>
								<label className="label">
									<span className="label-text">Logo URL (Optional)</span>
								</label>
								<input
									type="url"
									value={logo}
									onChange={(e) => setLogo(e.target.value)}
									placeholder="https://example.com/logo.png"
									className="input input-bordered w-full"
								/>
								<label className="label">
									<span className="label-text-alt">
										URL to the team's logo image (for future use)
									</span>
								</label>
							</div>
						</div>
					</div>

					{/* Submit Buttons */}
					<div className="card-actions pt-6 border-t border-base-300">
						<Link to="/admin/teams" className="btn btn-ghost flex-1">
							Cancel
						</Link>
						<button
							type="submit"
							disabled={isSubmitting || !name.trim() || !abbreviation.trim()}
							className="btn btn-primary flex-1"
						>
							{isSubmitting ? (
								<>
									<span className="loading loading-spinner loading-sm"></span>
									Creating Team...
								</>
							) : (
								"Create Team"
							)}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}

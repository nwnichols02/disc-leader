/**
 * Import Teams from Website Page
 * Allows admins to scrape team information from websites using Firecrawl
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAction, useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Download, Loader2, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { ExtractedTeam } from "../../convex/firecrawl.schema";

export const Route = createFileRoute("/admin/teams/import")({
	component: ImportTeamsPage,
});

type Division = "open" | "womens" | "mixed";

/**
 * Render the "Import Teams from Website" admin page
 */
function ImportTeamsPage() {
	const navigate = useNavigate();
	const extractTeams = useAction(api.teamImports.extractTeamsFromWebsite);
	const importTeams = useMutation(api.teamImports.importTeams);

	// Form state
	const [url, setUrl] = useState("");
	const [extractedTeams, setExtractedTeams] = useState<ExtractedTeam[]>([]);
	const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set());
	const [skipDuplicates, setSkipDuplicates] = useState(false);

	// UI state
	const [error, setError] = useState("");
	const [isExtracting, setIsExtracting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [importResults, setImportResults] = useState<{
		created: string[];
		skipped: Array<{ team: ExtractedTeam; reason: string }>;
	} | null>(null);

	// Check for duplicates when teams are extracted
	const duplicateCheck = useQuery(
		api.teamImports.checkDuplicates,
		extractedTeams.length > 0 ? { teams: extractedTeams } : "skip",
	);

	const handleExtract = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setExtractedTeams([]);
		setSelectedTeams(new Set());
		setImportResults(null);

		if (!url.trim()) {
			setError("Please enter a website URL");
			return;
		}

		setIsExtracting(true);

		try {
			const teams = await extractTeams({ url: url.trim() });

			if (teams.length === 0) {
				setError(
					"No teams found on this website. Please check the URL or try a different page.",
				);
				setIsExtracting(false);
				return;
			}

			setExtractedTeams(teams);
			// Select all teams by default
			setSelectedTeams(new Set(teams.map((_: any, index: number) => index)));
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to extract teams from website",
			);
		} finally {
			setIsExtracting(false);
		}
	};

	const handleImport = async () => {
		if (selectedTeams.size === 0) {
			setError("Please select at least one team to import");
			return;
		}

		setError("");
		setIsImporting(true);

		try {
			const teamsToImport = Array.from(selectedTeams).map(
				(index) => extractedTeams[index],
			);

			const results = await importTeams({
				teams: teamsToImport,
				skipDuplicates,
			});

			setImportResults(results);

			// If all teams were imported successfully, navigate after a delay
			if (results.skipped.length === 0) {
				setTimeout(() => {
					navigate({ to: "/admin/teams" });
				}, 2000);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to import teams");
		} finally {
			setIsImporting(false);
		}
	};

	const toggleTeamSelection = (index: number) => {
		const newSelected = new Set(selectedTeams);
		if (newSelected.has(index)) {
			newSelected.delete(index);
		} else {
			newSelected.add(index);
		}
		setSelectedTeams(newSelected);
	};

	const toggleAllTeams = () => {
		if (selectedTeams.size === extractedTeams.length) {
			setSelectedTeams(new Set());
		} else {
			setSelectedTeams(new Set(extractedTeams.map((_, index) => index)));
		}
	};

	const updateTeam = (index: number, updates: Partial<ExtractedTeam>) => {
		const updated = [...extractedTeams];
		updated[index] = { ...updated[index], ...updates };
		setExtractedTeams(updated);
	};

	const isDuplicate = (index: number) => {
		return duplicateCheck?.duplicates.some((d: any) => d.index === index);
	};

	const getDuplicateInfo = (index: number) => {
		return duplicateCheck?.duplicates.find((d: any) => d.index === index);
	};

	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<Link
					to="/admin/teams"
					className="link link-primary font-medium inline-flex items-center gap-2 mb-4"
				>
					← Back to Teams
				</Link>
				<div className="flex items-center gap-3">
					<div className="p-3 bg-primary/10 rounded-lg">
						<Download className="text-primary" size={28} />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-base-content mb-2">
							Import Teams from Website
						</h1>
						<p className="text-base-content/70">
							Scrape team information from a website using Firecrawl
						</p>
					</div>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div className="alert alert-error mb-6">
					<AlertCircle className="stroke-current shrink-0 h-6 w-6" size={20} />
					<div className="flex-1">
						<h3 className="font-bold">Error</h3>
						<div className="text-xs">{error}</div>
					</div>
					<button onClick={() => setError("")} className="btn btn-sm btn-ghost">
						<X size={20} />
					</button>
				</div>
			)}

			{/* Step 1: URL Input */}
			{extractedTeams.length === 0 && !importResults && (
				<div className="card bg-base-200 shadow-xl p-8">
					<div className="space-y-6">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
								1
							</div>
							<h2 className="text-xl font-bold text-base-content">
								Enter Website URL
							</h2>
						</div>

						<form onSubmit={handleExtract} className="space-y-4">
							<div>
								<label className="label">
									<span className="label-text">Website URL</span>
								</label>
								<input
									type="url"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="https://example.com/teams"
									className="input input-bordered w-full"
									required
									disabled={isExtracting}
								/>
								<label className="label">
									<span className="label-text-alt">
										Enter the URL of a page containing ultimate frisbee team
										information
									</span>
								</label>
							</div>

							<button
								type="submit"
								disabled={isExtracting || !url.trim()}
								className="btn btn-primary w-full"
							>
								{isExtracting ? (
									<>
										<span className="loading loading-spinner loading-sm"></span>
										Extracting Teams...
									</>
								) : (
									<>
										<Download size={20} />
										Extract Teams
									</>
								)}
							</button>
						</form>
					</div>
				</div>
			)}

			{/* Step 2: Review Teams */}
			{extractedTeams.length > 0 && !importResults && (
				<div className="card bg-base-200 shadow-xl p-8 space-y-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
								2
							</div>
							<h2 className="text-xl font-bold text-base-content">
								Review Extracted Teams
							</h2>
						</div>
						<div className="flex items-center gap-4">
							<button
								onClick={toggleAllTeams}
								className="link link-primary text-sm font-medium"
							>
								{selectedTeams.size === extractedTeams.length
									? "Deselect All"
									: "Select All"}
							</button>
							<span className="text-sm text-base-content/60">
								{selectedTeams.size} of {extractedTeams.length} selected
							</span>
						</div>
					</div>

					{/* Duplicate Warning */}
					{duplicateCheck && duplicateCheck.duplicates.length > 0 && (
						<div className="alert alert-warning">
							<AlertCircle
								className="stroke-current shrink-0 h-6 w-6"
								size={20}
							/>
							<div className="flex-1">
								<h3 className="font-bold">Duplicate Teams Detected</h3>
								<div className="text-xs mb-2">
									{duplicateCheck.duplicates.length} team(s) already exist in
									your database.
								</div>
								<label className="label cursor-pointer">
									<span className="label-text text-sm">
										Skip duplicate teams during import
									</span>
									<input
										type="checkbox"
										checked={skipDuplicates}
										onChange={(e) => setSkipDuplicates(e.target.checked)}
										className="checkbox checkbox-warning"
									/>
								</label>
							</div>
						</div>
					)}

					{/* Teams Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{extractedTeams.map((team, index) => {
							const duplicate = isDuplicate(index);
							const duplicateInfo = getDuplicateInfo(index);

							return (
								<div
									key={index}
									className={`card bg-base-300 border-2 overflow-hidden ${
										duplicate
											? "border-warning"
											: selectedTeams.has(index)
												? "border-primary"
												: "border-base-300"
									}`}
								>
									{/* Team Header with Colors */}
									<div
										className="h-20 flex items-center justify-center text-white text-xl font-bold relative"
										style={{
											background: `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)`,
										}}
									>
										{team.abbreviation}
										{duplicate && (
											<div className="badge badge-warning absolute top-2 right-2">
												Duplicate
											</div>
										)}
									</div>

									{/* Team Info */}
									<div className="card-body p-4 space-y-3">
										{/* Selection Checkbox */}
										<label className="label cursor-pointer">
											<span className="label-text text-sm font-medium">
												Import this team
											</span>
											<input
												type="checkbox"
												checked={selectedTeams.has(index)}
												onChange={() => toggleTeamSelection(index)}
												className="checkbox checkbox-primary"
											/>
										</label>

										{/* Editable Fields */}
										<div className="space-y-2">
											<div>
												<label className="label">
													<span className="label-text-alt">Team Name</span>
												</label>
												<input
													type="text"
													value={team.name}
													onChange={(e) =>
														updateTeam(index, { name: e.target.value })
													}
													className="input input-bordered input-sm w-full"
												/>
											</div>

											<div>
												<label className="label">
													<span className="label-text-alt">Abbreviation</span>
												</label>
												<input
													type="text"
													value={team.abbreviation}
													onChange={(e) =>
														updateTeam(index, {
															abbreviation: e.target.value
																.toUpperCase()
																.slice(0, 5),
														})
													}
													maxLength={5}
													className="input input-bordered input-sm w-full uppercase"
												/>
											</div>

											<div>
												<label className="label">
													<span className="label-text-alt">Division</span>
												</label>
												<select
													value={team.division || ""}
													onChange={(e) =>
														updateTeam(index, {
															division: e.target.value
																? (e.target.value as Division)
																: undefined,
														})
													}
													className="select select-bordered select-sm w-full"
												>
													<option value="">Not set</option>
													<option value="open">Open</option>
													<option value="womens">Women's</option>
													<option value="mixed">Mixed</option>
												</select>
											</div>

											{/* Colors */}
											<div>
												<label className="label">
													<span className="label-text-alt">Colors</span>
												</label>
												<div className="grid grid-cols-2 gap-2">
													<div>
														<input
															type="color"
															value={team.colors.primary}
															onChange={(e) =>
																updateTeam(index, {
																	colors: {
																		...team.colors,
																		primary: e.target.value,
																	},
																})
															}
															className="w-full h-10 rounded border border-base-300 cursor-pointer"
														/>
														<label className="label">
															<span className="label-text-alt">Primary</span>
														</label>
													</div>
													<div>
														<input
															type="color"
															value={team.colors.secondary}
															onChange={(e) =>
																updateTeam(index, {
																	colors: {
																		...team.colors,
																		secondary: e.target.value,
																	},
																})
															}
															className="w-full h-10 rounded border border-base-300 cursor-pointer"
														/>
														<label className="label">
															<span className="label-text-alt">Secondary</span>
														</label>
													</div>
												</div>
											</div>

											{duplicateInfo && (
												<div className="alert alert-warning py-2">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="stroke-current shrink-0 h-4 w-4"
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
													<span className="text-xs">
														{duplicateInfo.reason === "name"
															? `Team with this name already exists`
															: `Team with this abbreviation already exists`}
													</span>
												</div>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Action Buttons */}
					<div className="card-actions pt-6 border-t border-base-300">
						<button
							onClick={() => {
								setExtractedTeams([]);
								setSelectedTeams(new Set());
								setUrl("");
							}}
							className="btn btn-ghost flex-1"
							disabled={isImporting}
						>
							Start Over
						</button>
						<button
							onClick={handleImport}
							disabled={
								isImporting ||
								selectedTeams.size === 0 ||
								(!skipDuplicates &&
									duplicateCheck &&
									duplicateCheck.duplicates.length > 0)
							}
							className="btn btn-primary flex-1"
						>
							{isImporting ? (
								<>
									<span className="loading loading-spinner loading-sm"></span>
									Importing...
								</>
							) : (
								<>
									<CheckCircle2 size={20} />
									Import Selected Teams ({selectedTeams.size})
								</>
							)}
						</button>
					</div>
				</div>
			)}

			{/* Step 3: Import Results */}
			{importResults && (
				<div className="card bg-base-200 shadow-xl p-8 space-y-6">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-full bg-success text-success-content flex items-center justify-center font-bold">
							3
						</div>
						<h2 className="text-xl font-bold text-base-content">
							Import Complete
						</h2>
					</div>

					{importResults.created.length > 0 && (
						<div className="alert alert-success">
							<CheckCircle2
								className="stroke-current shrink-0 h-6 w-6"
								size={20}
							/>
							<div>
								<h3 className="font-bold">Successfully Imported</h3>
								<div className="text-xs">
									{importResults.created.length} team(s) imported successfully
								</div>
							</div>
						</div>
					)}

					{importResults.skipped.length > 0 && (
						<div className="alert alert-warning">
							<AlertCircle
								className="stroke-current shrink-0 h-6 w-6"
								size={20}
							/>
							<div className="flex-1">
								<h3 className="font-bold">Skipped Teams</h3>
								<ul className="text-sm space-y-1 list-disc list-inside">
									{importResults.skipped.map((item, index) => (
										<li key={index}>
											{item.team.name}: {item.reason}
										</li>
									))}
								</ul>
							</div>
						</div>
					)}

					<div className="card-actions pt-6 border-t border-base-300">
						<Link to="/admin/teams" className="btn btn-primary flex-1">
							View All Teams
						</Link>
						<button
							onClick={() => {
								setExtractedTeams([]);
								setSelectedTeams(new Set());
								setUrl("");
								setImportResults(null);
							}}
							className="btn btn-ghost flex-1"
						>
							Import More Teams
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

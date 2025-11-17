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
					className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-2 mb-4"
				>
					← Back to Teams
				</Link>
				<div className="flex items-center gap-3">
					<div className="p-3 bg-cyan-500/10 rounded-lg">
						<Download className="text-cyan-400" size={28} />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">
							Import Teams from Website
						</h1>
						<p className="text-gray-400">
							Scrape team information from a website using Firecrawl
						</p>
					</div>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 mb-6">
					<AlertCircle
						className="text-red-500 flex-shrink-0 mt-0.5"
						size={20}
					/>
					<div className="flex-1">
						<h3 className="font-semibold text-red-400 mb-1">Error</h3>
						<p className="text-red-300 text-sm">{error}</p>
					</div>
					<button
						onClick={() => setError("")}
						className="text-red-400 hover:text-red-300"
					>
						<X size={20} />
					</button>
				</div>
			)}

			{/* Step 1: URL Input */}
			{extractedTeams.length === 0 && !importResults && (
				<div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-8">
					<div className="space-y-6">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">
								1
							</div>
							<h2 className="text-xl font-bold text-white">
								Enter Website URL
							</h2>
						</div>

						<form onSubmit={handleExtract} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Website URL
								</label>
								<input
									type="url"
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="https://example.com/teams"
									className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
									required
									disabled={isExtracting}
								/>
								<p className="mt-1 text-xs text-gray-400">
									Enter the URL of a page containing ultimate frisbee team
									information
								</p>
							</div>

							<button
								type="submit"
								disabled={isExtracting || !url.trim()}
								className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
							>
								{isExtracting ? (
									<>
										<Loader2 className="animate-spin" size={20} />
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
				<div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-8 space-y-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold">
								2
							</div>
							<h2 className="text-xl font-bold text-white">
								Review Extracted Teams
							</h2>
						</div>
						<div className="flex items-center gap-4">
							<button
								onClick={toggleAllTeams}
								className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
							>
								{selectedTeams.size === extractedTeams.length
									? "Deselect All"
									: "Select All"}
							</button>
							<span className="text-sm text-gray-400">
								{selectedTeams.size} of {extractedTeams.length} selected
							</span>
						</div>
					</div>

					{/* Duplicate Warning */}
					{duplicateCheck && duplicateCheck.duplicates.length > 0 && (
						<div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<AlertCircle
									className="text-yellow-500 flex-shrink-0 mt-0.5"
									size={20}
								/>
								<div className="flex-1">
									<h3 className="font-semibold text-yellow-400 mb-1">
										Duplicate Teams Detected
									</h3>
									<p className="text-yellow-300 text-sm mb-2">
										{duplicateCheck.duplicates.length} team(s) already exist in
										your database.
									</p>
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={skipDuplicates}
											onChange={(e) => setSkipDuplicates(e.target.checked)}
											className="rounded"
										/>
										<span className="text-sm text-yellow-200">
											Skip duplicate teams during import
										</span>
									</label>
								</div>
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
									className={`bg-slate-700/50 rounded-lg border-2 overflow-hidden ${
										duplicate
											? "border-yellow-500/50"
											: selectedTeams.has(index)
												? "border-cyan-500"
												: "border-slate-600"
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
											<div className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded font-semibold">
												Duplicate
											</div>
										)}
									</div>

									{/* Team Info */}
									<div className="p-4 space-y-3">
										{/* Selection Checkbox */}
										<label className="flex items-center gap-2 cursor-pointer">
											<input
												type="checkbox"
												checked={selectedTeams.has(index)}
												onChange={() => toggleTeamSelection(index)}
												className="rounded"
											/>
											<span className="text-sm font-medium text-white">
												Import this team
											</span>
										</label>

										{/* Editable Fields */}
										<div className="space-y-2">
											<div>
												<label className="block text-xs font-medium text-gray-400 mb-1">
													Team Name
												</label>
												<input
													type="text"
													value={team.name}
													onChange={(e) =>
														updateTeam(index, { name: e.target.value })
													}
													className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
												/>
											</div>

											<div>
												<label className="block text-xs font-medium text-gray-400 mb-1">
													Abbreviation
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
													className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500"
												/>
											</div>

											<div>
												<label className="block text-xs font-medium text-gray-400 mb-1">
													Division
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
													className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
												>
													<option value="">Not set</option>
													<option value="open">Open</option>
													<option value="womens">Women's</option>
													<option value="mixed">Mixed</option>
												</select>
											</div>

											{/* Colors */}
											<div>
												<label className="block text-xs font-medium text-gray-400 mb-1">
													Colors
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
															className="w-full h-10 rounded border border-slate-500 cursor-pointer"
														/>
														<p className="text-xs text-gray-500 mt-1">
															Primary
														</p>
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
															className="w-full h-10 rounded border border-slate-500 cursor-pointer"
														/>
														<p className="text-xs text-gray-500 mt-1">
															Secondary
														</p>
													</div>
												</div>
											</div>

											{duplicateInfo && (
												<div className="text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded">
													⚠️{" "}
													{duplicateInfo.reason === "name"
														? `Team with this name already exists`
														: `Team with this abbreviation already exists`}
												</div>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Action Buttons */}
					<div className="flex gap-4 pt-6 border-t border-slate-700">
						<button
							onClick={() => {
								setExtractedTeams([]);
								setSelectedTeams(new Set());
								setUrl("");
							}}
							className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
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
							className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
						>
							{isImporting ? (
								<>
									<Loader2 className="animate-spin" size={20} />
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
				<div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-8 space-y-6">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
							3
						</div>
						<h2 className="text-xl font-bold text-white">Import Complete</h2>
					</div>

					{importResults.created.length > 0 && (
						<div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<CheckCircle2
									className="text-green-500 flex-shrink-0 mt-0.5"
									size={20}
								/>
								<div>
									<h3 className="font-semibold text-green-400 mb-1">
										Successfully Imported
									</h3>
									<p className="text-green-300 text-sm">
										{importResults.created.length} team(s) imported successfully
									</p>
								</div>
							</div>
						</div>
					)}

					{importResults.skipped.length > 0 && (
						<div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<AlertCircle
									className="text-yellow-500 flex-shrink-0 mt-0.5"
									size={20}
								/>
								<div className="flex-1">
									<h3 className="font-semibold text-yellow-400 mb-1">
										Skipped Teams
									</h3>
									<ul className="text-yellow-300 text-sm space-y-1">
										{importResults.skipped.map((item, index) => (
											<li key={index}>
												• {item.team.name}: {item.reason}
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					)}

					<div className="flex gap-4 pt-6 border-t border-slate-700">
						<Link
							to="/admin/teams"
							className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors text-center"
						>
							View All Teams
						</Link>
						<button
							onClick={() => {
								setExtractedTeams([]);
								setSelectedTeams(new Set());
								setUrl("");
								setImportResults(null);
							}}
							className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
						>
							Import More Teams
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

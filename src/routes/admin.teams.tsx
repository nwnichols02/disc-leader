/**
 * Admin Teams Management Page
 *
 * List and manage all teams with create/edit functionality
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { X, Users, Palette, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/teams")({
	component: AdminTeamsPage,
});

type Division = "open" | "womens" | "mixed";

function AdminTeamsPage() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	
	// Fetch all teams
	const teams = useQuery(api.games.listTeams, {}) ?? [];
	const isPending = teams === undefined;

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Teams</h2>
					<p className="text-gray-600 mt-1">Manage teams and rosters</p>
				</div>
				<button
					className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
					onClick={() => setIsModalOpen(true)}
				>
					+ Create Team
				</button>
			</div>

			{/* Teams Grid */}
			{isPending ? (
				<div className="text-center py-12 text-gray-600">Loading teams...</div>
			) : teams.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{teams.map((team) => (
						<div
							key={team._id}
							className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
						>
							{/* Team Header with Colors */}
							<div
								className="h-24 flex items-center justify-center text-white text-2xl font-bold"
								style={{
									background: `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.secondary} 100%)`,
								}}
							>
								{team.abbreviation}
							</div>

							{/* Team Info */}
							<div className="p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									{team.name}
								</h3>

								<div className="space-y-2 text-sm text-gray-600">
									<div className="flex items-center space-x-2">
										<span className="font-medium">Division:</span>
										<span className="capitalize">{team.division || "Not set"}</span>
									</div>

									<div className="flex items-center space-x-2">
										<span className="font-medium">Colors:</span>
										<div className="flex items-center space-x-1">
											<div
												className="w-4 h-4 rounded-full border border-gray-300"
												style={{ backgroundColor: team.colors.primary }}
												title={team.colors.primary}
											/>
											<div
												className="w-4 h-4 rounded-full border border-gray-300"
												style={{ backgroundColor: team.colors.secondary }}
												title={team.colors.secondary}
											/>
										</div>
									</div>
								</div>

								{/* Actions */}
								<div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
									<button
										className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
										onClick={() =>
											alert("View roster functionality coming soon!")
										}
									>
										View Roster
									</button>
									<button
										className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
										onClick={() =>
											alert("Edit team functionality coming soon!")
										}
									>
										Edit
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
					<div className="text-gray-600 mb-4">
						No teams found. Create your first team to get started!
					</div>
					<button
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
						onClick={() => setIsModalOpen(true)}
					>
						+ Create Team
					</button>
				</div>
			)}
			
			{/* Create Team Modal */}
			{isModalOpen && (
				<CreateTeamModal 
					isOpen={isModalOpen} 
					onClose={() => setIsModalOpen(false)} 
				/>
			)}
		</div>
	);
}

function CreateTeamModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
			
			// Success - close modal
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create team");
			setIsSubmitting(false);
		}
	};
	
	if (!isOpen) return null;
	
	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* Backdrop */}
			<div 
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			/>
			
			{/* Modal */}
			<div className="flex min-h-screen items-center justify-center p-4">
				<div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-gray-200">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-100 rounded-lg">
								<Users className="text-blue-600" size={24} />
							</div>
							<div>
								<h3 className="text-xl font-bold text-gray-900">Create New Team</h3>
								<p className="text-sm text-gray-600">Add a team to your league</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 transition-colors"
						>
							<X size={24} />
						</button>
					</div>
					
					{/* Form */}
					<form onSubmit={handleSubmit} className="p-6 space-y-6">
						{/* Error Message */}
						{error && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
								<AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
								<div>
									<h4 className="font-semibold text-red-800 mb-1">Error</h4>
									<p className="text-red-700 text-sm">{error}</p>
								</div>
							</div>
						)}
						
						{/* Team Name */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Team Name *
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. San Francisco Revolver"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
								required
							/>
						</div>
						
						{/* Abbreviation */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Abbreviation * (Max 5 characters)
							</label>
							<input
								type="text"
								value={abbreviation}
								onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
								placeholder="e.g. SFR"
								maxLength={5}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
								required
							/>
							<p className="mt-1 text-xs text-gray-500">
								{abbreviation.length}/5 characters
							</p>
						</div>
						
						{/* Division */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Division (Optional)
							</label>
							<select
								value={division}
								onChange={(e) => setDivision(e.target.value as Division | "")}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							>
								<option value="">Select division...</option>
								<option value="open">Open</option>
								<option value="womens">Women's</option>
								<option value="mixed">Mixed</option>
							</select>
						</div>
						
						{/* Team Colors */}
						<div>
							<div className="flex items-center gap-2 mb-3">
								<Palette className="text-gray-600" size={20} />
								<label className="block text-sm font-medium text-gray-700">
									Team Colors *
								</label>
							</div>
							
							<div className="grid grid-cols-2 gap-4">
								{/* Primary Color */}
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-2">
										Primary Color
									</label>
									<div className="flex items-center gap-3">
										<input
											type="color"
											value={primaryColor}
											onChange={(e) => setPrimaryColor(e.target.value)}
											className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
										/>
										<div className="flex-1">
											<input
												type="text"
												value={primaryColor}
												onChange={(e) => setPrimaryColor(e.target.value)}
												placeholder="#3b82f6"
												className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
											/>
										</div>
									</div>
								</div>
								
								{/* Secondary Color */}
								<div>
									<label className="block text-xs font-medium text-gray-600 mb-2">
										Secondary Color
									</label>
									<div className="flex items-center gap-3">
										<input
											type="color"
											value={secondaryColor}
											onChange={(e) => setSecondaryColor(e.target.value)}
											className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
										/>
										<div className="flex-1">
											<input
												type="text"
												value={secondaryColor}
												onChange={(e) => setSecondaryColor(e.target.value)}
												placeholder="#1e40af"
												className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
											/>
										</div>
									</div>
								</div>
							</div>
							
							{/* Color Preview */}
							<div className="mt-4 p-4 rounded-lg border border-gray-200">
								<p className="text-xs font-medium text-gray-600 mb-2">Preview</p>
								<div
									className="h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-sm"
									style={{
										background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
									}}
								>
									{abbreviation || "ABC"}
								</div>
							</div>
						</div>
						
						{/* Logo URL (Optional) */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Logo URL (Optional)
							</label>
							<input
								type="url"
								value={logo}
								onChange={(e) => setLogo(e.target.value)}
								placeholder="https://example.com/logo.png"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
							/>
							<p className="mt-1 text-xs text-gray-500">
								URL to the team's logo image
							</p>
						</div>
						
						{/* Form Actions */}
						<div className="flex gap-3 pt-4 border-t border-gray-200">
							<button
								type="button"
								onClick={onClose}
								disabled={isSubmitting}
								className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSubmitting || !name.trim() || !abbreviation.trim()}
								className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
							>
								{isSubmitting ? "Creating Team..." : "Create Team"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

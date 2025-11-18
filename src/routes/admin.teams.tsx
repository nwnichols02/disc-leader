/**
 * Admin Teams Management Page
 *
 * List and manage all teams
 */

import {
	createFileRoute,
	Link,
	Outlet,
	useMatches,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const Route = createFileRoute("/admin/teams")({
	component: AdminTeamsPage,
});

/**
 * Renders the Teams administration page: shows a header, team list with loading and empty states, and actions for each team; if a nested child route is active, renders only the nested Outlet.
 *
 * @returns A React element that is the Teams admin UI or the nested route Outlet when on a child route.
 *
 * @example
 * <AdminTeamsPage />
 */
function AdminTeamsPage() {
	const matches = useMatches();
	// Check if we're on a child route by seeing if there's a route deeper than /admin/teams
	const isOnChildRoute =
		matches.length > 0 && matches[matches.length - 1].id !== "/admin/teams";

	const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
	const [deleteConfirmTeamId, setDeleteConfirmTeamId] = useState<string | null>(null);

	// Fetch all teams
	const teams = useQuery(api.games.listTeams, {}) ?? [];
	const deleteTeam = useMutation(api.gameMutations.deleteTeam);
	const isPending = teams === undefined;

	const handleDeleteClick = (teamId: string) => {
		setDeleteConfirmTeamId(teamId);
	};

	const handleDeleteConfirm = async (teamId: string) => {
		setDeletingTeamId(teamId);
		setDeleteConfirmTeamId(null);
		try {
			await deleteTeam({ teamId: teamId as Id<"teams"> });
			// The query will automatically refetch after the mutation
		} catch (error) {
			console.error("Failed to delete team:", error);
			const errorMessage = error instanceof Error ? error.message : "Failed to delete team. Please try again.";
			alert(errorMessage);
		} finally {
			setDeletingTeamId(null);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteConfirmTeamId(null);
	};

	// If on a child route (like /new or /edit), only render the Outlet
	if (isOnChildRoute) {
		return <Outlet />;
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-base-content">Teams</h2>
					<p className="text-base-content/70 mt-1">Manage teams and rosters</p>
				</div>
				<div className="flex gap-3">
					<Link to="/admin/teams/import" className="btn btn-success">
						Import Teams
					</Link>
					<Link to="/admin/teams/new" className="btn btn-primary">
						+ Create Team
					</Link>
				</div>
			</div>

			{/* Teams Grid */}
			{isPending ? (
				<div className="text-center py-12 text-base-content/60">
					<span className="loading loading-spinner loading-lg text-primary"></span>
				</div>
			) : teams.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{teams.map((team) => (
						<div
							key={team._id}
							className="card bg-base-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
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
							<div className="card-body p-6">
								<h3 className="card-title text-base-content mb-2">
									{team.name}
								</h3>

								<div className="space-y-2 text-sm text-base-content/70">
									<div className="flex items-center space-x-2">
										<span className="font-medium">Division:</span>
										<span className="capitalize">
											{team.division || "Not set"}
										</span>
									</div>

									<div className="flex items-center space-x-2">
										<span className="font-medium">Colors:</span>
										<div className="flex items-center space-x-1">
											<div
												className="w-4 h-4 rounded-full border border-base-300"
												style={{ backgroundColor: team.colors.primary }}
												title={team.colors.primary}
											/>
											<div
												className="w-4 h-4 rounded-full border border-base-300"
												style={{ backgroundColor: team.colors.secondary }}
												title={team.colors.secondary}
											/>
										</div>
									</div>
								</div>

								{/* Actions */}
								<div className="card-actions mt-4 pt-4 border-t border-base-300">
									<button
										className="btn btn-ghost btn-sm flex-1"
										onClick={() =>
											alert("View roster functionality coming soon!")
										}
									>
										View Roster
									</button>
									<Link
										to={`/admin/teams/${team._id as Id<"teams">}/edit` as any}
										className="btn btn-primary btn-sm flex-1"
									>
										Edit
									</Link>
									{deleteConfirmTeamId === team._id ? (
										<div className="flex flex-col gap-2 w-full mt-2">
											<button
												onClick={() => handleDeleteConfirm(team._id)}
												disabled={deletingTeamId === team._id}
												className="btn btn-error btn-sm w-full"
											>
												{deletingTeamId === team._id ? (
													<span className="loading loading-spinner loading-xs"></span>
												) : (
													"Confirm Delete"
												)}
											</button>
											<button
												onClick={handleDeleteCancel}
												disabled={deletingTeamId === team._id}
												className="btn btn-ghost btn-sm w-full"
											>
												Cancel
											</button>
										</div>
									) : (
										<button
											onClick={() => handleDeleteClick(team._id)}
											disabled={deletingTeamId === team._id}
											className="btn btn-error btn-sm"
											title="Delete team"
										>
											{deletingTeamId === team._id ? (
												<span className="loading loading-spinner loading-xs"></span>
											) : (
												<Trash2 className="h-4 w-4" />
											)}
										</button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="card bg-base-200 shadow-lg">
					<div className="card-body text-center p-12">
						<div className="text-base-content/70 mb-4">
							No teams found. Create your first team to get started!
						</div>
						<Link to="/admin/teams/new" className="btn btn-primary">
							+ Create Team
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}

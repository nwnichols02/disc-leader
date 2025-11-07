/**
 * Admin Teams Management Page
 *
 * List and manage all teams
 */

import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/admin/teams")({
	component: AdminTeamsPage,
});

function AdminTeamsPage() {
	const matches = useMatches();
	const isOnChildRoute = matches.some(match => match.id === '/admin/teams/new');
	
	// Fetch all teams
	const teams = useQuery(api.games.listTeams, {}) ?? [];
	const isPending = teams === undefined;
	
	// If on a child route (like /new), only render the Outlet
	if (isOnChildRoute) {
		return <Outlet />;
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">Teams</h2>
					<p className="text-gray-600 mt-1">Manage teams and rosters</p>
				</div>
				<Link
					to="/admin/teams/new"
					className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
				>
					+ Create Team
				</Link>
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
					<Link
						to="/admin/teams/new"
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
					>
						+ Create Team
					</Link>
				</div>
			)}
		</div>
	);
}

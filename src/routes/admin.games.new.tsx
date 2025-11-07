/**
 * Create New Game Page
 *
 * This is a placeholder for the game creation form.
 * Will be implemented in a future update.
 */

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/games/new")({
	component: NewGamePage,
});

function NewGamePage() {
	return (
		<div className="max-w-4xl mx-auto px-4 py-8">
			<div className="mb-8">
				<Link
					to="/admin/games"
					className="text-blue-600 hover:text-blue-700 font-medium"
				>
					← Back to Games
				</Link>
			</div>

			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">
					Create New Game
				</h1>
				<p className="text-gray-600">
					Game creation form coming soon. This will allow you to create new
					games with custom configurations.
				</p>
			</div>
		</div>
	);
}

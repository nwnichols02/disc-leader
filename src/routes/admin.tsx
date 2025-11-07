/**
 * Admin Layout Route
 *
 * Protected route that requires Clerk authentication.
 * Provides layout for all admin pages with navigation.
 */

import { useAuth, useUser } from "@clerk/clerk-react";
import {
	createFileRoute,
	Link,
	Outlet,
	redirect,
} from "@tanstack/react-router";

// Check authentication before rendering admin routes
export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ context, location }) => {
		// Note: Clerk auth check needs to be done client-side
		// Server-side auth would require Clerk backend SDK
		// For now, we'll do client-side protection

		// The actual auth check happens in the component
		return {};
	},
	component: AdminLayout,
});

function AdminLayout() {
	const { isSignedIn, isLoaded } = useAuth();
	const { user } = useUser();

	// Show loading while auth is initializing
	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg text-gray-600">Loading...</div>
			</div>
		);
	}

	// Redirect to sign in if not authenticated
	if (!isSignedIn) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="max-w-md text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						Authentication Required
					</h1>
					<p className="text-gray-600 mb-6">
						You must be signed in to access the admin dashboard.
					</p>
					<a
						href="/demo/clerk"
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Sign In with Clerk
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Admin Header */}
			<header className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Logo/Title */}
						<div className="flex items-center space-x-8">
							<h1 className="text-xl font-bold text-gray-900">
								DiscLeader Admin
							</h1>

							{/* Navigation */}
							<nav className="hidden md:flex space-x-4">
								<Link
									to="/admin"
									className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
									activeProps={{
										className: "bg-gray-100 text-gray-900",
									}}
								>
									Dashboard
								</Link>
								<Link
									to="/admin/games"
									className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
									activeProps={{
										className: "bg-gray-100 text-gray-900",
									}}
								>
									Games
								</Link>
								<Link
									to="/admin/teams"
									className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
									activeProps={{
										className: "bg-gray-100 text-gray-900",
									}}
								>
									Teams
								</Link>
							</nav>
						</div>

						{/* User Info */}
						<div className="flex items-center space-x-4">
							<div className="text-sm text-gray-700">
								{user?.emailAddresses?.[0]?.emailAddress || "Admin User"}
							</div>
							<div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
								{user?.firstName?.[0] ||
									user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
									"A"}
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Admin Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Outlet />
			</main>
		</div>
	);
}

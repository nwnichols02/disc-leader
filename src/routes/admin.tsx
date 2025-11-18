/**
 * Admin Layout Route
 *
 * Protected route that requires Clerk authentication.
 * Provides layout for all admin pages with navigation.
 */

import { SignInButton, useAuth, useUser } from "@clerk/clerk-react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

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
				<span className="loading loading-spinner loading-lg text-primary"></span>
			</div>
		);
	}

	// Redirect to sign in if not authenticated
	if (!isSignedIn) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-base-100">
				<div className="max-w-md text-center card bg-base-200 shadow-xl">
					<SignInButton mode="modal">
						<button className="btn btn-primary w-full">
							<LogIn size={20} />
							<span className="font-medium">Sign In to Manage</span>
						</button>
					</SignInButton>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-base-100">
			{/* Admin Header */}
			<header className="navbar bg-base-200 border-b border-base-300">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<div className="flex justify-between items-center">
						{/* Logo/Title */}
						<div className="flex items-center space-x-8">
							<h1 className="text-xl font-bold text-base-content">
								DiscLeader Admin
							</h1>

							{/* Navigation */}
							<nav className="hidden md:flex space-x-4">
								<Link
									to="/admin"
									className="btn btn-ghost btn-sm"
									activeProps={{
										className: "btn-active",
									}}
								>
									Dashboard
								</Link>
								<Link
									to="/admin/games"
									className="btn btn-ghost btn-sm"
									activeProps={{
										className: "btn-active",
									}}
								>
									Games
								</Link>
								<Link
									to="/admin/teams"
									className="btn btn-ghost btn-sm"
									activeProps={{
										className: "btn-active",
									}}
								>
									Teams
								</Link>
							</nav>
						</div>

						{/* User Info */}
						<div className="flex items-center space-x-4">
							<div className="text-sm text-base-content/70">
								{user?.emailAddresses?.[0]?.emailAddress || "Admin User"}
							</div>
							<div className="avatar placeholder">
								<div className="bg-primary text-primary-content rounded-full w-8 flex justify-center items-center">
									<span className="text-sm font-bold">
										{user?.firstName?.[0] ||
											user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
											"A"}
									</span>
								</div>
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

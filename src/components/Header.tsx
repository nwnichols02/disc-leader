import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";
import {
	CreditCard,
	Gamepad2,
	Home,
	LayoutDashboard,
	LogIn,
	Menu,
	Search,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import ClerkHeader from "../integrations/clerk/header-user.tsx";
import { PaymentAlert } from "./autumn/PaymentAlert";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<header className="navbar bg-base-300 text-base-content justify-between shadow-lg">
				<div className="flex items-center">
					<button
						onClick={() => setIsOpen(true)}
						className="btn btn-ghost btn-square"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<Link to="/" className="ml-4">
						<h1 className="text-xl font-bold">
							<span className="text-primary">DISC</span>
							<span className="text-base-content/70">LEADER</span>
						</h1>
					</Link>
				</div>
				<div className="hidden md:block">
					<ClerkHeader />
				</div>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-base-200 text-base-content shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-base-300">
					<h2 className="text-xl font-bold">
						<span className="text-primary">DISC</span>
						<span className="text-base-content/70">LEADER</span>
					</h2>
					<button
						onClick={() => setIsOpen(false)}
						className="btn btn-ghost btn-square"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					{/* Payment Alert */}
					<SignedIn>
						<div className="mb-4">
							<PaymentAlert />
						</div>
					</SignedIn>

					{/* Public Links - Always Visible */}
					<div className="mb-6">
						<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 px-3">
							Watch
						</h3>
						<Link
							to="/"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 transition-colors mb-1"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-content transition-colors mb-1",
							}}
						>
							<Home size={20} />
							<span className="font-medium">Home</span>
						</Link>

						<Link
							to="/games"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 transition-colors mb-1"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-content transition-colors mb-1",
							}}
						>
							<Search size={20} />
							<span className="font-medium">Browse Games</span>
						</Link>

						<Link
							to="/pricing"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 transition-colors mb-1"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-content transition-colors mb-1",
							}}
						>
							<CreditCard size={20} />
							<span className="font-medium">Pricing</span>
						</Link>
					</div>

					{/* Sign In Button - Only for Unauthenticated Users */}
					<SignedOut>
						<div className="mb-6">
							<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 px-3">
								Account
							</h3>
							<SignInButton mode="modal">
								<button className="btn btn-primary w-full">
									<LogIn size={20} />
									<span className="font-medium">Sign In to Manage</span>
								</button>
							</SignInButton>
							<p className="text-xs text-base-content/60 px-3 mt-2">
								Sign in to access admin features, manage games, and keep score.
							</p>
						</div>
					</SignedOut>

					{/* Admin Links - Only for Authenticated Users */}
					<SignedIn>
						<div className="mb-6">
							<h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2 px-3">
								Admin
							</h3>
							<Link
								to="/admin"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 transition-colors mb-1"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-content transition-colors mb-1",
								}}
							>
								<LayoutDashboard size={20} />
								<span className="font-medium">Dashboard</span>
							</Link>

							<Link
								to="/admin/games"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 transition-colors mb-1"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-content transition-colors mb-1",
								}}
							>
								<Gamepad2 size={20} />
								<span className="font-medium">Games</span>
							</Link>

							<Link
								to="/admin/teams"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 transition-colors mb-1"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-content transition-colors mb-1",
								}}
							>
								<Users size={20} />
								<span className="font-medium">Teams</span>
							</Link>
						</div>
					</SignedIn>

					{/* Info Box */}
					<div className="card bg-base-300 border border-base-300">
						<div className="card-body p-4">
							<p className="text-sm text-base-content/70 mb-2">
								Ultimate Frisbee live scoreboard with real-time updates and game
								management.
							</p>
							<a
								href="https://github.com/nwnichols02/disc-leader"
								target="_blank"
								rel="noopener noreferrer"
								className="link link-primary text-sm"
							>
								View on GitHub →
							</a>
						</div>
					</div>
				</nav>

				<div className="p-4 border-t border-base-300 bg-base-300">
					<ClerkHeader />
				</div>
			</aside>
		</>
	);
}

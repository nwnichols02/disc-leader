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
import { PaymentAlert } from "./autumn/PaymentAlert";
import ClerkHeader from "../integrations/clerk/header-user.tsx";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
				<div className="flex items-center">
					<button
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<Link to="/" className="ml-4">
						<h1 className="text-xl font-bold">
							<span className="text-cyan-400">DISC</span>
							<span className="text-gray-300">LEADER</span>
						</h1>
					</Link>
				</div>
				<div className="hidden md:block">
					<ClerkHeader />
				</div>
			</header>

			<aside
				className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold">
						<span className="text-cyan-400">DISC</span>
						<span className="text-gray-300">LEADER</span>
					</h2>
					<button
						onClick={() => setIsOpen(false)}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
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
						<h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
							Watch
						</h3>
						<Link
							to="/"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-1"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-1",
							}}
						>
							<Home size={20} />
							<span className="font-medium">Home</span>
						</Link>

						<Link
							to="/games"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-1"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-1",
							}}
						>
							<Search size={20} />
							<span className="font-medium">Browse Games</span>
						</Link>

						<Link
							to="/pricing"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-1"
							activeProps={{
								className:
									"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-1",
							}}
						>
							<CreditCard size={20} />
							<span className="font-medium">Pricing</span>
						</Link>
					</div>

					{/* Sign In Button - Only for Unauthenticated Users */}
					<SignedOut>
						<div className="mb-6">
							<h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
								Account
							</h3>
							<SignInButton mode="modal">
								<button className="w-full flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-1">
									<LogIn size={20} />
									<span className="font-medium">Sign In to Manage</span>
								</button>
							</SignInButton>
							<p className="text-xs text-gray-500 px-3 mt-2">
								Sign in to access admin features, manage games, and keep score.
							</p>
						</div>
					</SignedOut>

					{/* Admin Links - Only for Authenticated Users */}
					<SignedIn>
						<div className="mb-6">
							<h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
								Admin
							</h3>
							<Link
								to="/admin"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-1"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-1",
								}}
							>
								<LayoutDashboard size={20} />
								<span className="font-medium">Dashboard</span>
							</Link>

							<Link
								to="/admin/games"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-1"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-1",
								}}
							>
								<Gamepad2 size={20} />
								<span className="font-medium">Games</span>
							</Link>

							<Link
								to="/admin/teams"
								onClick={() => setIsOpen(false)}
								className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-1"
								activeProps={{
									className:
										"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-1",
								}}
							>
								<Users size={20} />
								<span className="font-medium">Teams</span>
							</Link>
						</div>
					</SignedIn>

					{/* Info Box */}
					<div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
						<p className="text-sm text-gray-400 mb-2">
							Ultimate Frisbee live scoreboard with real-time updates and game
							management.
						</p>
						<a
							href="https://github.com/your-repo/disc-leader"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-cyan-400 hover:text-cyan-300 underline"
						>
							View on GitHub →
						</a>
					</div>
				</nav>

				<div className="p-4 border-t border-gray-700 bg-gray-800">
					<ClerkHeader />
				</div>
			</aside>
		</>
	);
}

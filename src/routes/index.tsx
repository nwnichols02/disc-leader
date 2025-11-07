import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	Clock,
	Gamepad2,
	Radio,
	Smartphone,
	Users,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const features = [
		{
			icon: <Radio className="w-12 h-12 text-cyan-400" />,
			title: "Real-Time Updates",
			description:
				"Live score tracking with instant updates. No refresh needed. See every goal, turnover, and timeout as it happens.",
		},
		{
			icon: <Gamepad2 className="w-12 h-12 text-cyan-400" />,
			title: "Multiple Game Formats",
			description:
				"Support for professional (AUDL), tournament (USA Ultimate), and recreational formats. Flexible scoring for any league.",
		},
		{
			icon: <Smartphone className="w-12 h-12 text-cyan-400" />,
			title: "Field-Ready Scorekeeper",
			description:
				"Mobile-optimized interface with large touch targets. High contrast for outdoor visibility. Record scores from anywhere on the field.",
		},
		{
			icon: <Users className="w-12 h-12 text-cyan-400" />,
			title: "Team Management",
			description:
				"Manage teams, rosters, and player information. Track gender ratios for mixed divisions. Complete player statistics.",
		},
		{
			icon: <Activity className="w-12 h-12 text-cyan-400" />,
			title: "Play-by-Play Tracking",
			description:
				"Complete event log with goals, turnovers, and timeouts. Player attribution and timestamps. Immutable audit trail.",
		},
		{
			icon: <Clock className="w-12 h-12 text-cyan-400" />,
			title: "Game Archives",
			description:
				"Permanent game history with shareable URLs. Browse past games by date, team, or season. Export data for analysis.",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
				<div className="relative max-w-5xl mx-auto">
					<div className="flex items-center justify-center mb-6">
						<h1 className="text-6xl md:text-8xl font-black text-white [letter-spacing:-0.08em]">
							<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
								DISC
							</span>
							<span className="text-gray-300">LEADER</span>
						</h1>
					</div>
					<p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
						Ultimate Frisbee Live Scoreboard
					</p>
					<p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
						Real-time game tracking for Ultimate Frisbee. Support for professional,
						tournament, and recreational formats. Share games with fans, manage teams,
						and keep score from the field.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<a
							href="/admin"
							className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
						>
							Admin Dashboard
						</a>
						<a
							href="https://github.com/your-repo/disc-leader"
							target="_blank"
							rel="noopener noreferrer"
							className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
						>
							View on GitHub
						</a>
					</div>
				</div>
			</section>

			<section className="py-16 px-6 max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature, index) => (
						<div
							key={index}
							className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
						>
							<div className="mb-4">{feature.icon}</div>
							<h3 className="text-xl font-semibold text-white mb-3">
								{feature.title}
							</h3>
							<p className="text-gray-400 leading-relaxed">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

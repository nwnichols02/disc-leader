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
			icon: <Radio className="w-12 h-12" />,
			title: "Real-Time Updates",
			description:
				"Live score tracking with instant updates. No refresh needed. See every goal, turnover, and timeout as it happens.",
		},
		{
			icon: <Gamepad2 className="w-12 h-12" />,
			title: "Multiple Game Formats",
			description:
				"Support for professional (AUDL), tournament (USA Ultimate), and recreational formats. Flexible scoring for any league.",
		},
		{
			icon: <Smartphone className="w-12 h-12" />,
			title: "Field-Ready Scorekeeper",
			description:
				"Mobile-optimized interface with large touch targets. High contrast for outdoor visibility. Record scores from anywhere on the field.",
		},
		{
			icon: <Users className="w-12 h-12" />,
			title: "Team Management",
			description:
				"Manage teams, rosters, and player information. Track gender ratios for mixed divisions. Complete player statistics.",
		},
		{
			icon: <Activity className="w-12 h-12" />,
			title: "Play-by-Play Tracking",
			description:
				"Complete event log with goals, turnovers, and timeouts. Player attribution and timestamps. Immutable audit trail.",
		},
		{
			icon: <Clock className="w-12 h-12" />,
			title: "Game Archives",
			description:
				"Permanent game history with shareable URLs. Browse past games by date, team, or season. Export data for analysis.",
		},
	];

	return (
		<div className="min-h-screen bg-base-100">
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10"></div>
				<div className="relative max-w-5xl mx-auto">
					<div className="flex items-center justify-center mb-6">
						<h1 className="text-6xl md:text-8xl font-black text-base-content [letter-spacing:-0.08em]">
							<span className="text-primary">DISC</span>
							<span className="text-base-content/70">LEADER</span>
						</h1>
					</div>
					<p className="text-2xl md:text-3xl text-base-content/80 mb-4 font-light">
						Ultimate Frisbee Live Scoreboard
					</p>
					<p className="text-lg text-base-content/60 max-w-3xl mx-auto mb-8">
						Real-time game tracking for Ultimate Frisbee. Support for
						professional, tournament, and recreational formats. Share games with
						fans, manage teams, and keep score from the field.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<a href="/admin" className="btn btn-primary btn-lg">
							Admin Dashboard
						</a>
						<a
							href="https://github.com/nwnichols02/disc-leader"
							target="_blank"
							rel="noopener noreferrer"
							className="btn btn-outline btn-lg"
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
							className="card bg-base-200 border border-base-300 shadow-lg hover:shadow-xl transition-all duration-300"
						>
							<div className="card-body">
								<div className="mb-4 text-primary">{feature.icon}</div>
								<h3 className="card-title text-base-content mb-3">
									{feature.title}
								</h3>
								<p className="text-base-content/70 leading-relaxed">
									{feature.description}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

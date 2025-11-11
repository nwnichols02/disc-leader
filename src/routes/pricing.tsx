import { createFileRoute } from "@tanstack/react-router";
import { useCustomer } from "autumn-js/react";
import { useState } from "react";
import CheckoutDialog from "@/components/autumn/checkout-dialog";

export const Route = createFileRoute("/pricing")({
	component: PricingPage,
});

function PricingPage() {
	const { checkout, customer, isLoading: customerLoading } = useCustomer();
	const [error, setError] = useState<string | null>(null);
	const [processingPlan, setProcessingPlan] = useState<string | null>(null);

	// Log customer state for debugging
	console.log("Autumn Customer State:", { customer, customerLoading });

	if (error) {
		console.error("Pricing Page Error:", error);
	}

	const plans = [
		{
			id: "free",
			name: "Free",
			price: "$0",
			period: "forever",
			description: "Perfect for trying out DiscLeader",
			features: [
				{ text: "Up to 5 games", included: true },
				{ text: "Up to 2 teams", included: true },
				{ text: "Basic scorekeeping", included: true },
				{ text: "Game history", included: true },
				{ text: "Live scoreboard", included: false },
				{ text: "Advanced analytics", included: false },
				{ text: "Tournament management", included: false },
			],
			cta: "Current Plan",
			highlighted: false,
		},
		{
			id: "pro",
			name: "Pro",
			price: "$10",
			period: "per month",
			description: "For serious disc golf enthusiasts",
			features: [
				{ text: "Unlimited games", included: true },
				{ text: "Unlimited teams", included: true },
				{ text: "Basic scorekeeping", included: true },
				{ text: "Game history", included: true },
				{ text: "Live scoreboard", included: true },
				{ text: "Advanced analytics", included: true },
				{ text: "Tournament management", included: false },
			],
			cta: "Upgrade to Pro",
			highlighted: true,
		},
		{
			id: "premium",
			name: "Premium",
			price: "$25",
			period: "per month",
			description: "For tournament organizers",
			features: [
				{ text: "Everything in Pro", included: true },
				{ text: "Tournament management", included: true },
				{ text: "Custom branding", included: true },
				{ text: "Priority support", included: true },
				{ text: "Advanced reporting", included: true },
				{ text: "API access", included: true },
				{ text: "White-label options", included: true },
			],
			cta: "Upgrade to Premium",
			highlighted: false,
		},
	];

	const getButtonForPlan = (plan: (typeof plans)[0]) => {
		const hasProduct = customer?.products?.find(
			(p) => p.id === plan.id && p.status === "active",
		);

		if (hasProduct) {
			return (
				<button
					disabled
					className="w-full px-6 py-3 rounded-lg font-medium border-2 border-green-500 text-green-600 bg-green-50"
				>
					✓ Current Plan
				</button>
			);
		}

		if (plan.id === "free") {
			return (
				<button
					disabled
					className="w-full px-6 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-600 bg-gray-50"
				>
					Free Plan
				</button>
			);
		}

		return (
			<button
				onClick={async () => {
					setProcessingPlan(plan.id);
					setError(null);
					try {
						console.log("Starting checkout for:", plan.id);
						const result = await checkout({
							productId: plan.id,
							dialog: CheckoutDialog,
						});
						console.log("Checkout result:", result);
					} catch (err) {
						console.error("Checkout error:", err);
						setError(err instanceof Error ? err.message : "Checkout failed");
					} finally {
						setProcessingPlan(null);
					}
				}}
				disabled={processingPlan === plan.id}
				className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
					processingPlan === plan.id
						? "bg-gray-400 cursor-not-allowed"
						: plan.highlighted
							? "bg-blue-600 text-white hover:bg-blue-700"
							: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
				}`}
			>
				{processingPlan === plan.id ? "Processing..." : plan.cta}
			</button>
		);
	};

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Error Banner */}
				{error && (
					<div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
						<div className="flex items-center gap-3">
							<svg
								className="w-5 h-5 text-red-600"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clipRule="evenodd"
								/>
							</svg>
							<div>
								<h3 className="text-sm font-semibold text-red-800">
									Checkout Error
								</h3>
								<p className="text-sm text-red-700">{error}</p>
								<p className="text-xs text-red-600 mt-1">
									Check the browser console for more details.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Loading State */}
				{customerLoading && (
					<div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
						<p className="text-blue-700">Loading customer data...</p>
					</div>
				)}

				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						Choose Your Plan
					</h1>
					<p className="text-xl text-gray-600">
						Upgrade to unlock more features and take your disc golf game to the
						next level
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{plans.map((plan) => (
						<div
							key={plan.id}
							className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
								plan.highlighted ? "ring-4 ring-blue-500 relative" : ""
							}`}
						>
							{plan.highlighted && (
								<div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold">
									MOST POPULAR
								</div>
							)}

							<div className="p-8">
								<h2 className="text-2xl font-bold text-gray-900 mb-2">
									{plan.name}
								</h2>
								<p className="text-gray-600 mb-6 min-h-[3rem]">
									{plan.description}
								</p>

								<div className="mb-6">
									<span className="text-5xl font-bold text-gray-900">
										{plan.price}
									</span>
									<span className="text-gray-600 ml-2">{plan.period}</span>
								</div>

								{getButtonForPlan(plan)}

								<div className="mt-8 space-y-4">
									{plan.features.map((feature, idx) => (
										<div key={idx} className="flex items-start gap-3">
											{feature.included ? (
												<svg
													className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
														clipRule="evenodd"
													/>
												</svg>
											) : (
												<svg
													className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fillRule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
														clipRule="evenodd"
													/>
												</svg>
											)}
											<span
												className={
													feature.included ? "text-gray-700" : "text-gray-400"
												}
											>
												{feature.text}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="mt-12 text-center text-gray-600">
					<p className="mb-2">
						All plans include a 14-day money-back guarantee
					</p>
					<p className="text-sm">
						Questions? Contact us at{" "}
						<a
							href="mailto:support@discleader.com"
							className="text-blue-600 hover:underline"
						>
							support@discleader.com
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}

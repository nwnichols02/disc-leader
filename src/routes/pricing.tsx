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
				{ text: "Real-time scorekeeping", included: true },
				{ text: "Game history", included: true },
				{ text: "Live scoreboard", included: false },
				{ text: "Live streaming", included: false },
				{ text: "Team import from websites", included: false },
				{ text: "Advanced analytics", included: false },
			],
			cta: "Current Plan",
			highlighted: false,
		},
		{
			id: "pro",
			name: "Pro",
			price: "$10",
			period: "per month",
			description: "For serious Ultimate Frisbee teams and leagues",
			features: [
				{ text: "Unlimited games", included: true },
				{ text: "Unlimited teams", included: true },
				{ text: "Real-time scorekeeping", included: true },
				{ text: "Game history", included: true },
				{ text: "Live scoreboard", included: true },
				{ text: "Live streaming", included: true },
				{ text: "Team import from websites", included: true },
				{ text: "Advanced analytics", included: true },
				{ text: "Multiple game formats", included: true },
			],
			cta: "Upgrade to Pro",
			highlighted: true,
		},
		{
			id: "premium",
			name: "Premium",
			price: "$25",
			period: "per month",
			description: "For tournament organizers and leagues",
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
				<button disabled className="btn btn-success w-full">
					✓ Current Plan
				</button>
			);
		}

		if (plan.id === "free") {
			return (
				<button disabled className="btn btn-disabled w-full">
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
				className={`btn w-full ${
					processingPlan === plan.id
						? "btn-disabled"
						: plan.highlighted
							? "btn-primary"
							: "btn-outline btn-primary"
				}`}
			>
				{processingPlan === plan.id ? (
					<>
						<span className="loading loading-spinner loading-sm"></span>
						Processing...
					</>
				) : (
					plan.cta
				)}
			</button>
		);
	};

	return (
		<div className="min-h-screen bg-base-100 py-12 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Error Banner */}
				{error && (
					<div className="alert alert-error mb-6">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="stroke-current shrink-0 h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<div>
							<h3 className="font-bold">Checkout Error</h3>
							<div className="text-xs">{error}</div>
						</div>
					</div>
				)}

				{/* Loading State */}
				{customerLoading && (
					<div className="alert alert-info mb-6">
						<span className="loading loading-spinner loading-sm"></span>
						<span>Loading customer data...</span>
					</div>
				)}

				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-base-content mb-4">
						Choose Your Plan
					</h1>
					<p className="text-xl text-base-content/70">
						Upgrade to unlock more features and take your Ultimate Frisbee
						management to the next level
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{plans.map((plan) => (
						<div
							key={plan.id}
							className={`card bg-base-200 shadow-xl overflow-hidden transition-transform hover:scale-105 ${
								plan.highlighted ? "ring-4 ring-primary relative" : ""
							}`}
						>
							{plan.highlighted && (
								<div className="badge badge-primary w-full rounded-none">
									MOST POPULAR
								</div>
							)}

							<div className="card-body p-8">
								<h2 className="card-title text-2xl text-base-content mb-2">
									{plan.name}
								</h2>
								<p className="text-base-content/70 mb-6 min-h-[3rem]">
									{plan.description}
								</p>

								<div className="mb-6">
									<span className="text-5xl font-bold text-base-content">
										{plan.price}
									</span>
									<span className="text-base-content/70 ml-2">
										{plan.period}
									</span>
								</div>

								{getButtonForPlan(plan)}

								<div className="mt-8 space-y-4">
									{plan.features.map((feature, idx) => (
										<div key={idx} className="flex items-start gap-3">
											{feature.included ? (
												<svg
													className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
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
													className="w-5 h-5 text-base-content/30 flex-shrink-0 mt-0.5"
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
													feature.included
														? "text-base-content"
														: "text-base-content/50"
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

				<div className="mt-12 text-center text-base-content/70">
					<p className="mb-2">
						All plans include a 14-day money-back guarantee
					</p>
					<p className="text-sm">
						Questions? Contact us at{" "}
						<a
							href="mailto:support@discleader.com"
							className="link link-primary"
						>
							support@discleader.com
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}

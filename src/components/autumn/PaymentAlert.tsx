import { useCustomer } from "autumn-js/react";

export function PaymentAlert() {
	const { customer, openBillingPortal } = useCustomer();

	const failedPayment = customer?.products?.find(
		(p) => p.status === "past_due",
	);

	if (!failedPayment) return null;

	return (
		<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0">
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
				</div>
				<div className="flex-1">
					<h3 className="text-sm font-semibold text-red-800 mb-1">
						Payment Failed
					</h3>
					<p className="text-sm text-red-700 mb-3">
						Your payment failed. Please update your payment method to continue
						using premium features.
					</p>
					<button
						onClick={async () => {
							await openBillingPortal({ returnUrl: window.location.href });
						}}
						className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
					>
						Update Payment Method
					</button>
				</div>
			</div>
		</div>
	);
}

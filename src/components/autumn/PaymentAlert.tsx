import { useCustomer } from "autumn-js/react";

export function PaymentAlert() {
	const { customer, openBillingPortal } = useCustomer();

	const failedPayment = customer?.products?.find(
		(p) => p.status === "past_due",
	);

	if (!failedPayment) return null;

	return (
		<div className="alert alert-error mb-4">
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
			<div className="flex-1">
				<h3 className="font-bold">Payment Failed</h3>
				<div className="text-xs">
					Your payment failed. Please update your payment method to continue
					using premium features.
				</div>
			</div>
			<button
				onClick={async () => {
					await openBillingPortal({ returnUrl: window.location.href });
				}}
				className="btn btn-sm btn-error"
			>
				Update Payment Method
			</button>
		</div>
	);
}

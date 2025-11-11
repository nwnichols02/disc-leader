import { useCustomer } from "autumn-js/react";
import CheckoutDialog from "./checkout-dialog";

interface UpgradeButtonProps {
	productId: "pro" | "premium";
	variant?: "primary" | "secondary" | "outline";
	size?: "sm" | "md" | "lg";
	className?: string;
}

export function UpgradeButton({
	productId,
	variant = "primary",
	size = "md",
	className = "",
}: UpgradeButtonProps) {
	const { checkout, customer } = useCustomer();

	const hasProduct = customer?.products?.find(
		(p) => p.id === productId && p.status === "active",
	);

	if (hasProduct) {
		return (
			<span className="inline-flex items-center gap-2 text-green-600 font-medium">
				<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fillRule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clipRule="evenodd"
					/>
				</svg>
				{productId === "pro" ? "Pro Member" : "Premium Member"}
			</span>
		);
	}

	const variantClasses = {
		primary: "bg-blue-600 text-white hover:bg-blue-700",
		secondary: "bg-gray-600 text-white hover:bg-gray-700",
		outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
	};

	const sizeClasses = {
		sm: "px-3 py-1.5 text-sm",
		md: "px-4 py-2 text-base",
		lg: "px-6 py-3 text-lg",
	};

	return (
		<button
			onClick={async () => {
				await checkout({
					productId,
					dialog: CheckoutDialog,
				});
			}}
			className={`rounded-lg font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
		>
			Upgrade to {productId === "pro" ? "Pro" : "Premium"}
		</button>
	);
}

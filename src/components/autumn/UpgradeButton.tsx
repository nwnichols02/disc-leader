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
			<span className="inline-flex items-center gap-2 text-success font-medium">
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
		primary: "btn-primary",
		secondary: "btn-secondary",
		outline: "btn-outline",
	};

	const sizeClasses = {
		sm: "btn-sm",
		md: "",
		lg: "btn-lg",
	};

	return (
		<button
			onClick={async () => {
				await checkout({
					productId,
					dialog: CheckoutDialog,
				});
			}}
			className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
		>
			Upgrade to {productId === "pro" ? "Pro" : "Premium"}
		</button>
	);
}

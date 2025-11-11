import { useState } from "react";
import { useCustomer } from "autumn-js/react";

interface CheckoutDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  preview: {
    title?: string;
    message?: string;
    product_id: string;
    items?: Array<{
      description: string;
      price: string;
    }>;
    due_today?: {
      price: number;
      currency: string;
    };
    due_next_cycle?: {
      price: number;
      currency: string;
    };
    scenario?: "upgrade" | "downgrade" | "cancel" | "renew" | "new";
  };
}

export default function CheckoutDialog({ open, setOpen, preview }: CheckoutDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { attach, refetch } = useCustomer();

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await attach({ productId: preview.product_id });
      await refetch();
      setOpen(false);
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">{preview?.title || "Confirm Purchase"}</h2>
          {preview?.message && (
            <p className="text-gray-600">{preview.message}</p>
          )}
        </div>

        <div className="space-y-3 my-6">
          {preview?.items?.map((item, i) => (
            <div key={i} className="flex justify-between items-start">
              <span className="text-sm text-gray-600 flex-1">{item.description}</span>
              <span className="font-semibold ml-4">{item.price}</span>
            </div>
          ))}

          {preview?.due_today?.price !== undefined && (
            <div className="border-t pt-4 flex justify-between font-bold text-lg">
              <span>Due today:</span>
              <span>${preview.due_today.price.toFixed(2)} {preview.due_today.currency}</span>
            </div>
          )}

          {preview?.due_next_cycle?.price !== undefined && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Next billing cycle:</span>
              <span>${preview.due_next_cycle.price.toFixed(2)} {preview.due_next_cycle.currency}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}


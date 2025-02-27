import Link from "next/link";
import { useBookingState } from "@/context/BookingContext";

export const CheckoutBanner = () => {
  const { state } = useBookingState();
  
  if (state.bookingPeriods.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0  p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div>
          {/* <h3 className="font-semibold text-lg">
            {state.bookingPeriods.length} Room{state.bookingPeriods.length > 1 ? 's' : ''} Selected
          </h3>
          <p className="text-sm opacity-90">
            Total Price: ${state.bookingPeriods.reduce((sum, bp) => sum + bp.price, 0).toFixed(2)}
          </p> */}
        </div>
        <Link
          href="/eligibility"
          className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          Go to Checkout →
        </Link>
      </div>
    </div>
  );
};
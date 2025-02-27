"use client";
import { useBookingState } from "@/context/BookingContext";
import { ArrowLeft, ChevronLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";
import Image from "next/image";

const BookingSummary = () => {
  const { state, removeBooking, clearAllBookings } = useBookingState();
  const router = useRouter();
  const { urlSearchParams } = useUrlSearchParams();

  const handleKeepBooking = () => {
    router.push(urlSearchParams); // Navigate to previous page
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-white">
      {/* Header - Simplified */}
      {/* Header */}
      <div className="w-full relative flex justify-center gap-1">
      <ChevronLeft onClick={handleKeepBooking} className="absolute left-[-35px] top-1/2 -translate-y-1/2 text-black" size={60} />

      <div className="flex-1 flex justify-center">
        <h1 className="relative text-4xl md:text-5xl font-black  mb-2 tracking-wide">
          <span className="absolute -right-1 text-[#4AE54A] z-0">
            BOOKING SUMMARY
          </span>
          <span className="relative text-black z-10">BOOKING SUMMARY</span>
        </h1>
      </div>
      </div>
     

      {/* Bookings List */}
      <div className="space-y-4 mb-8 mt-10">
        {state.bookingPeriods.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No bookings selected</p>
        ) : (
          state.bookingPeriods.map((booking) => (
            <div
              key={`${booking.roomId}-${booking.year}-${booking.semester}`}
              className="bg-white p-4 rounded-md border border-gray-100 relative shadow-sm"
            >
              <div className="flex gap-4">
                {/* Room Image */}
                <div className="w-24 h-24 bg-gray-100 relative flex-shrink-0">
                  {booking.imageUrl ? (
                    <Image
                      src={booking.imageUrl || "/placeholder.svg"}
                      alt={booking.roomTitle}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200"></div>
                  )}
                </div>

                {/* Room Details */}
                <div className="flex-1">
                  {/* Remove Button */}
                  <button
                    onClick={() =>
                      removeBooking(
                        booking.roomId,
                        booking.year,
                        booking.semester
                      )
                    }
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h3 className="font-bold text-gray-900">
                    {booking.propertyTitle}, {booking.roomTitle}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {booking.roomType} / {booking.year} - {booking.semester}
                  </p>

                  {/* Price */}
                  <p className="font-bold text-xl mt-2">
                    €{booking.price.toFixed(0)}
                  </p>

                  {/* Pending Eligibility Note */}
                  <p className="text-xs text-gray-400 mt-1">
                    * Pending Eligibility
                  </p>

                  {/* Services - Collapsed into tooltip or expandable section */}
                  {booking.services.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 underline cursor-pointer">
                        {booking.services.length} services included
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons - Styled to match the design */}
      <div className="flex justify-between gap-4 mt-8">
        <button
          onClick={handleKeepBooking}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-full text-gray-800 font-medium hover:bg-gray-50 transition-colors"
        >
          Keep Booking
        </button>
        {state.bookingPeriods.length > 0 && (
          <button
            onClick={() => router.push("/eligibility")}
            className="flex-1 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Checkout
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingSummary;

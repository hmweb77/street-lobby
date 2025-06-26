"use client";
import { useBookingState } from "@/context/BookingContext";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";
import Image from "next/image";
import PageTitle from "./PageTitle";
import { getSanityImageUrl } from "@/sanity/lib/image";
import { useState, useEffect } from "react";

const BookingItem = ({ booking, removeBooking }) => {
  const [imageUrl, setImageUrl] = useState("/room.jpg");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      try {
        if (booking.imageUrl?.[0]) {
          const url = await getSanityImageUrl(booking.imageUrl[0]);
          if (isMounted && url) {
            setImageUrl(url);
          }
        }
      } catch (error) {
        console.error("Error loading image", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [booking.imageUrl]);

  return (
    <div className="bg-white max-w-xl mx-auto p-4 rounded-md border border-gray-100 relative">
      <div className="flex gap-4">
        {/* Room Image */}
        <div className="w-24 h-24 bg-gray-100 relative flex-shrink-0">
          {!isLoading ? (
            <Image
              src={imageUrl}
              alt={booking.roomTitle}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 24rem"
            />
          ) : (
            <div className="bg-gray-200 animate-pulse w-full h-full" />
          )}
        </div>
        {/* Room Details */}
        <div className="flex-1">
          <button
            onClick={() =>
              removeBooking(booking.roomId, booking.year, booking.semester)
            }
            className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>

          <h3 className="font-bold mt-4 text-gray-900">
            {booking.propertyTitle}, {booking.roomTitle}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {booking.roomType} / {booking.year} - {booking.semester}
          </p>

          <p className="font-bold text-xl mt-2">
            €{booking.price.toFixed(0)}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            * Pending Eligibility
          </p>

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
  );
};

const BookingSummary = () => {
  const { state, removeBooking } = useBookingState();
  const router = useRouter();
  const { urlSearchParams } = useUrlSearchParams();
  
  const handleKeepBooking = () => {
    router.push(urlSearchParams);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 min-h-screen bg-white">
      <PageTitle title={"BOOKING SUMMARY"} />

      <div className="space-y-4 mb-8 mt-10">
        {state.bookingPeriods.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No bookings selected</p>
        ) : (
          state.bookingPeriods.map((booking) => (
            <BookingItem
              key={`${booking.roomId}-${booking.year}-${booking.semester}`}
              booking={booking}
              removeBooking={removeBooking}
            />
          ))
        )}
      </div>

      <div className="flex justify-between gap-4 max-w-xl mx-auto mt-8">
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
"use client";

import { useState } from "react";
import { useBookingState } from "@/context/BookingContext";

export const Payment = ({ setCurrentStep }) => {
  const { state, clearAllBooking } = useBookingState();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  
  const handleBooking = async () => {
    setLoading(true);
    setMessage("");

    const bookingData = {
      roomId: state.room.id,
      userDetails: state.userDetails,
      bookingPeriods: state.bookingPeriods,
      totalPrice: state.totalPrice,
      services: state?.services || [],
    };

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Booking successful!" + JSON.stringify(data));
        setCurrentStep(4);
        setSuccess(true);
        clearAllBooking();
      } else {
        setMessage("Failed to create booking: " + data.message);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setMessage("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="text-center p-8" aria-label="Payment">
      <h2 className="text-xl font-bold">Booking Overview</h2>

      <p className="text-gray-700">Name: {state.userDetails.name}</p>

      {!success && (
        <>
          <p className="text-gray-700">Room: {state.room.title}</p>
          <p className="text-gray-700">Total Price: ${state.totalPrice}</p>
          <button
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            onClick={handleBooking}
            disabled={loading}
          >
            {loading ? "Processing..." : "Book Now!"}
          </button>
        </>
      )}

      {message && <p className="mt-2 text-green-500">{message}</p>}
    </section>
  );
};

export default Payment;

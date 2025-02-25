'use client';

import React from "react";
import { useBookingState } from "@/context/BookingContext";
import { X } from 'lucide-react';
import { useRouter } from "next/navigation";


const BookingSummary = () => {
    const { state, removeBooking, clearAllBookings } = useBookingState();
    const router = useRouter();
    const handleKeepBooking = () => {
        router.back(); // Navigate to previous page
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 bg-white ">
            {/* Header */}
            <div className="flex justify-center">
                <h1 className="relative text-4xl md:text-5xl font-black  mb-2 tracking-wide">
                    <span className="absolute -right-1 text-[#4AE54A] z-0">BOOKING SUMMARY</span>
                    <span className="relative text-black z-10">BOOKING SUMMARY</span>
                </h1>
            </div>
            {/* Bookings List */}
            <div className="space-y-4 mb-6">
                {state.bookingPeriods.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No bookings selected</p>
                ) : (
                    state.bookingPeriods.map((booking) => (
                        <div
                            key={`${booking.roomId}-${booking.year}-${booking.semester}`}
                            className="bg-gray-50 p-4 rounded-md border border-gray-200 relative group"
                        >
                            {/* Remove Button */}
                            <button
                                onClick={() => removeBooking(booking.roomId, booking.year, booking.semester)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Room Information */}
                            <div className="mb-3">
                                <h3 className="font-semibold text-gray-700">
                                    {booking.propertyTitle}, {booking.roomTitle}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">{booking.roomType}</p>
                            </div>

                            {/* Booking Period Details */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium text-gray-600">
                                        {booking.year} - {booking.semester}
                                    </p>
                                    {booking.services.length > 0 && (
                                        <div className="mt-2 text-sm">
                                            <p className="text-gray-500 mb-1">Services:</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {booking.services.map(service => (
                                                    <li key={service.id} className="text-gray-400">
                                                        {service.name} (${service.price})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <span className="font-semibold text-gray-700">${booking.price.toFixed(2)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total Price */}
            <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Total Price:</span>
                    <span className="font-bold text-lg text-gray-800">
                        ${state.totalPrice.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
            <button
                    onClick={handleKeepBooking}
                    className="flex-1 px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Keep Booking
                </button>
                {state.bookingPeriods.length > 0 && (
                    <button
                        onClick={()=> router.push("/eligibility")}
                        className="flex-1 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        Checkout
                    </button>
                )}
            </div>
        </div>
    );
};

export default BookingSummary;
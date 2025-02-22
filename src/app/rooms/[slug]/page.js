"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { client } from "@/sanity/lib/client";
import RoomCard from "@/components/RoomCard";
import StepProcessBar from "@/components/booking/ProcessBar";
import EligibilityCheck from "@/components/EligibilityCheck";
import { Payment } from "@/components/Payment";
import { useBookingState } from "@/context/BookingContext";

export default function RoomDetails() {
  const { slug } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state, setUserDetails } = useBookingState();
  const [currentStep, setCurrentStep] = useState(
    state.room.id && state.totalPrice > 0 ? 2 : 1
  ); // Start at Eligibility Check step

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const query = `*[_type == "room" && slug.current == $slug][0]{
      _id,
      roomNumber,
      title,
      roomType,
      priceWinter,
      priceSummer,
      services,
      "property": property->{
        propertyName,
        slug
      },
      "slug": slug.current,
      "imageUrl": property->images[0].asset->url,
      isAvailable,
      bookedPeriods,
      availableSemesters
    }`;

    const fetchRoom = async () => {
      try {
        const response = await client.fetch(query, { slug });
        setRoom(response);
      } catch (error) {
        console.error("Error fetching room:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [slug]);

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3)); // Only allow steps 2 and 3
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!room)
    return <p className="text-center text-gray-500">Room not found.</p>;

  return (
    <section className="space-y-4">
      <StepProcessBar
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        showPrev={ currentStep >= 4 ? false  : true}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Room Details Section */}
        <h1 className="text-3xl font-bold mb-6">Room Details</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Room Image and Details... */}
        </div>

        {currentStep === 1 && (
          <div className="mt-8">
            <div className="w-full flex justify-center items-center mb-10">
              <button
                onClick={() => {
                  if (state.room.id && state.totalPrice > 0) handleNextStep();
                }}
                disabled={!(state.room.id && state.totalPrice > 0)}
                className={`bg-gray-800 text-white px-4 py-2 rounded ${state.room.id && state.totalPrice > 0 ? "" : "opacity-50 cursor-not-allowed"} `}
              >
                Next
              </button>
            </div>
            <RoomCard room={room} isReversed={true} />
            <div className="w-full flex justify-center items-center mt-10">
              <button
                onClick={() => {
                  if (state.room.id && state.totalPrice > 0) handleNextStep();
                }}
                disabled={!(state.room.id && state.totalPrice > 0)}
                className={`bg-gray-800 text-white px-4 py-2 rounded ${state.room.id && state.totalPrice > 0 ? "" : "opacity-50 cursor-not-allowed"} `}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Booking Process Steps */}
        <div className="w-full mx-auto p-4 mt-12">
          <main className="mt-8">
            {currentStep === 2 ? (
              <EligibilityCheck
                onNext={handleNextStep}
                room={room} // Pass room data to eligibility check
              />
            ) : null}

            {currentStep === 1 && (
              <div>
                <p>
                  {" "}
                  To book this room, you must first select semesters and years
                  for which you want to book the room.{" "}
                </p>
              </div>
            )}

            {currentStep === 3 || currentStep === 4 && <Payment setCurrentStep={setCurrentStep} />}
          </main>
        </div>
      </div>
    </section>
  );
}

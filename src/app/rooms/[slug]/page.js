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
  const { state, clearAllBookings, setRoom: setContextRoom } = useBookingState();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const fetchRoom = async () => {
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

      try {
        const response = await client.fetch(query, { slug });
        setRoom(response);
        
        // Reset booking context if room changes
        if (state.room.id !== response._id) {
          clearAllBookings();
          setContextRoom({
            id: response._id,
            title: response.roomNumber,
            propertyTitle: response.property.propertyName,
            imageUrl: response.imageUrl
          });
        }
      } catch (error) {
        console.error("Error fetching room:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [slug]);

  useEffect(() => {
    // Automatically progress to step 2 if bookings exist
    if (state.bookingPeriods.length > 0 && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [state.bookingPeriods, currentStep]);

  const handleNextStep = () => {
    if (currentStep === 1 && state.bookingPeriods.length === 0) return;
    if (currentStep === 2 && !state.commonUserDetails.email) return;
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!room) return <p className="text-center text-gray-500">Room not found.</p>;

  return (
    <section className="space-y-4">
      <StepProcessBar
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        showPrev={currentStep !== 4}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Room Details</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Room Image and Details */}
        </div>

        {currentStep === 1 && (
          <div className="mt-8">
            <RoomCard room={room} isReversed={true} />
            
            <div className="w-full flex justify-center items-center mt-10">
              <button
                onClick={handleNextStep}
                disabled={state.bookingPeriods.length === 0}
                className={`bg-gray-800 text-white px-6 py-3 rounded-lg ${
                  state.bookingPeriods.length === 0 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-gray-700"
                }`}
              >
                Proceed to Eligibility Check
              </button>
            </div>
          </div>
        )}

        <div className="w-full mx-auto p-4 mt-12">
          <main className="mt-8">
            {currentStep === 2 && (
              <EligibilityCheck
                onNext={handleNextStep}
                requiredDetails={{
                  minAge: room.minAge,
                  maxAge: room.maxAge,
                  requiredDocuments: room.requiredDocuments
                }}
              />
            )}

            {currentStep === 3 && (
              <Payment 
                setCurrentStep={setCurrentStep}
                totalAmount={state.totalPrice}
                bookingDetails={state}
              />
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
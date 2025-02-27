"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchRoomsBySlug } from "@/lib/fireStoreQuery/filterQuery"; // Import the fetch function
import RoomCard from "@/components/RoomCard";
import StepProcessBar from "@/components/booking/ProcessBar";
import EligibilityCheck from "@/components/EligibilityCheck";
import { Payment } from "@/components/Payment";
import { useBookingState } from "@/context/BookingContext";
import { CheckoutBanner } from "@/components/CheckoutBanner";

export default function RoomDetails() {
  const router = useRouter();
  const { slug } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLeft = () => {
    router.back();
  };

  useEffect(() => {
    if (!slug) return;

    const unsubscribe = fetchRoomsBySlug(slug, (rooms) => {
      if (rooms.length > 0) {
        setRoom(rooms[0]); // Assuming only one room per slug
      } else {
        setRoom(null);
      }
      setLoading(false);
    });

    // return () => unsubscribe && unsubscribe(); // Cleanup subscription if needed
  }, [slug]);

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!room) return <p className="text-center text-gray-500">Room not found.</p>;

  return (
    <>
      <section className="space-y-4 max-w-2xl mx-auto p-4">
        <StepProcessBar currentStep={1} handleLeft={handleLeft} />

        <div className="mx-auto px-4">
          {/* <h1 className="text-3xl font-bold mb-6">{room?.title || "Room Details"}</h1> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Room Image and Details */}
            {/* <div className="w-full">
              <img
                src={room?.imageUrl || "/placeholder.jpg"}
                alt={room?.title || "Room Image"}
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
            <div className="space-y-4">
              <p><strong>Location:</strong> {room?.propertyDetails?.location?.name || "N/A"}</p>
              <p><strong>Type:</strong> {room?.propertyDetails?.propertyType || "N/A"}</p>
              <p><strong>Price:</strong> ${room?.priceWinter || "N/A"} / Winter</p>
              <p><strong>Available Semesters:</strong> {room?.remainingSemesters?.join(", ") || "N/A"}</p>
            </div> */}
          </div>

          <div className="">
            <RoomCard room={room} isReversed={true} />
          </div>
        </div>
      </section>
      <CheckoutBanner />
    </>
  );
}

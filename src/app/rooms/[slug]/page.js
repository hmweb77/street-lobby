"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchRoomsBySlug } from "@/lib/fireStoreQuery/filterQuery";
import RoomCard from "@/components/RoomCard";
import StepProcessBar from "@/components/booking/ProcessBar";
import { CheckoutBanner } from "@/components/CheckoutBanner";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
);

// Skeleton loader for room details
const RoomDetailsSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-64 bg-gray-100 rounded-lg"></div>
    <div className="space-y-4">
      <div className="h-6 bg-gray-100 rounded w-3/4"></div>
      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
      <div className="h-4 bg-gray-100 rounded w-1/3"></div>
      <div className="h-4 bg-gray-100 rounded w-2/5"></div>
    </div>
  </div>
);

export default function RoomDetails() {
  const router = useRouter();
  const { slug } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { urlSearchParams } = useUrlSearchParams();

  const handleLeft = () => router.push(urlSearchParams);

  useEffect(() => {
    if (!slug) return;

    const unsubscribe = fetchRoomsBySlug(
      slug,
      (rooms) => {
        if (rooms.length > 0) {
          setRoom(rooms[0]);
        } else {
          setError("Room not found");
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    // return () => unsubscribe && unsubscribe();
  }, [slug]);

  return (
    <>
      <div className="max-w-2xl mx-auto p-4">
        <StepProcessBar currentStep={1} handleLeft={handleLeft} />

        {loading ? (
          <div className="space-y-8 pt-6">
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
            <RoomDetailsSkeleton />
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-red-500 text-xl font-medium">
              ⚠️ {error}
            </div>
            <button
              onClick={handleLeft}
              className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Search
            </button>
          </div>
        ) : room ? (
          <section className="space-y-8">
            <h1 className="text-3xl font-bold text-center mt-4">
              {room.title}
            </h1>
            
            <div className="space-y-6">
              <RoomCard 
                room={room} 
                isReversed={true} 
                className="border-2 border-black rounded-lg overflow-hidden"
              />
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-medium">{room.propertyDetails?.propertyType || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{room.propertyDetails?.location?.name || "N/A"}</p>
                </div>
              </div>

              <div className="bg-black text-white p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Pricing Details</h2>
                <p>Winter Semester: ${room.priceWinter || "N/A"}</p>
                {room.priceSummer && <p>Summer Semester: ${room.priceSummer}</p>}
              </div>
            </div>
          </section>
        ) : null}
      </div>
      <CheckoutBanner />
    </>
  );
}
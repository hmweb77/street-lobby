"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchFilteredRooms } from "@/lib/fireStoreQuery/filterQuery";
import RoomCard from "@/components/RoomCard";
import StepProcessBar from "@/components/booking/ProcessBar";
import { CheckoutBanner } from "@/components/CheckoutBanner";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
);

// Skeleton loader for room cards
const RoomCardSkeleton = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg p-4 space-y-4">
    <div className="h-48 bg-gray-300 rounded-lg"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    </div>
  </div>
);

export default function RoomList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = useMemo(() => ({
    year: searchParams.get("year") || null,
    semester: searchParams.get("period")?.split(",") || null,
    roomType: searchParams.get("roomType") || null,
    location: searchParams.get("location") || null,
    minPrice: Number(searchParams.get("price")) ? 0 : undefined,
    maxPrice: Number(searchParams.get("price")) || undefined,
    propertyType: searchParams.get("propertyType") || null,
    colivingCapacity: Number(searchParams.get("colivingCapacity")) || null,
  }), [searchParams]);

  useEffect(() => {
    let unsubscribe;

    const handleRoomsUpdate = (filteredRooms) => {
      setRooms(filteredRooms);
      setLoading(false);
      setError(null);
    };

    const handleError = (error) => {
      console.error("Room fetch error:", error);
      setError(error.message);
      setLoading(false);
      setRooms([]);
    };

    try {
      unsubscribe = fetchFilteredRooms(filters, handleRoomsUpdate);
    } catch (error) {
      handleError(error);
    }

    return () => {
      // if (unsubscribe) unsubscribe();
    };
  }, [filters]);
  console.log(filters);

  const handleLeft = () => router.push("/");

  const filteredRooms = rooms.filter(room => 
    room.remainingSemesters?.length > 0
  );

  return (
    <>
      <div className="max-w-2xl mx-auto p-4">
        <StepProcessBar currentStep={1} handleLeft={handleLeft} />
        
        {/* Always show year filter status */}
        <p className="text-center text-gray-500 mb-8 mt-4 font-medium">
          Search Results for Academic Year:{" "}
          <span className="text-black">{filters.year ?? "Every"}</span>
        </p>

        {loading ? (
          <div className="space-y-6">
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
            {[...Array(3)].map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-red-500 text-xl font-medium">
              ⚠️ Oops! Something went wrong
            </div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={handleLeft}
              className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Home
            </button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-2xl font-medium text-gray-800">
              🏠 No Matching Rooms Found
            </div>
            <p className="text-gray-600">
              Try adjusting your filters for better results
            </p>
            <button
              onClick={handleLeft}
              className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Modify Search Criteria
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                year={filters.year}
                imageUrl={room.imageUrl}
                price={room.price}
                remainingSemesters={room.remainingSemesters}
              />
            ))}
          </div>
        )}
      </div>
      <CheckoutBanner />
    </>
  );
}
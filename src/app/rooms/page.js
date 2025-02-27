"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchFilteredRooms } from "@/lib/fireStoreQuery/filterQuery";
import RoomCard from "@/components/RoomCard";
import StepProcessBar from "@/components/booking/ProcessBar";
import { CheckoutBanner } from "@/components/CheckoutBanner";

export default function RoomList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract filters from URL parameters
  const filters = useMemo(() => 
    
    {
      return ({
        year: searchParams.get("year") || null,
        semester: searchParams.get("period")?.split(",") || null,
        roomType: searchParams.get("roomType") || null,
        location: searchParams.get("location") || null,
        minPrice: Number(searchParams.get("price")) ? 0 : null,
        maxPrice: Number(searchParams.get("price")) || null,
        propertyType: searchParams.get("propertyType") || null,
        colivingCapacity: Number(searchParams.get("colivingCapacity")) || null,
    
      })
    }
    , [searchParams]);

    console.log(filters);

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
      unsubscribe = fetchFilteredRooms(
        filters,
        (rooms) => handleRoomsUpdate(rooms)
      );
    } catch (error) {
      handleError(error);
    }

    return () => {
      // if (unsubscribe) unsubscribe();
    };
  }, [filters]);

  const handleLeft = () => router.back();

  if (loading) {
    return <p className="text-center text-gray-500">Loading rooms...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  if (!rooms.length) {
    return <p className="text-center text-gray-500">No rooms match your criteria</p>;
  }

  return (
    <>
      <div className="max-w-2xl mx-auto p-4">
        <StepProcessBar currentStep={1} handleLeft={handleLeft} />
        <p className="text-center text-gray-500 mb-2">
          Showing results for academic year: {filters.year}
        </p>

        <div className="space-y-6">
          {rooms.map((room) => (
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
      </div>
      <CheckoutBanner />
    </>
  );
}
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchFilteredRooms } from "@/lib/fireStoreQuery/filterQuery";
import RoomCard from "@/components/RoomCard";
import StepProcessBar from "@/components/booking/ProcessBar";
import { CheckoutBanner } from "@/components/CheckoutBanner";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";
import { ChevronLeft } from "lucide-react";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
);

// Skeleton loader for room cards
export const RoomCardSkeleton = () => (
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

  const filters = useMemo(
    () => ({
      year: searchParams.get("year") || null,
      semester: searchParams.get("period")?.split(",") || null,
      roomType: searchParams.get("roomType") || null,
      location: searchParams.get("location") || null,
      minPrice: Number(searchParams.get("price")) ? 0 : undefined,
      maxPrice: Number(searchParams.get("price")) || undefined,
      propertyType: searchParams.get("propertyType") || null,
      colivingCapacity: Number(searchParams.get("colivingCapacity")) || null,
    }),
    [searchParams]
  );

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

  const handleLeft = () => router.push("/");

  const filteredRooms = rooms.filter(
    (room) => room.remainingSemesters?.length > 0
  );

  return (
    <>
      <div className="min-h-screen">
        {loading ? (
          <div className="max-w-2xl mx-auto">
            <StepProcessBar currentStep={1} handleLeft={handleLeft} />

            {/* Always show year filter status */}
            <p className="text-center text-gray-500 mb-8 mt-4 font-medium">
              Search Results for Academic Year:{" "}
              <span className="text-black">{filters.year ?? "Every"}</span>
            </p>
            <div className="space-y-6">
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
              {[...Array(3)].map((_, i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-full relative">
              <div className="flex-1 flex justify-center items-center gap-4 py-20">
                <ChevronLeft
                  onClick={handleLeft}
                  className="cursor-pointer text-black"
                  size={32}
                />
                <h1 className="text-md md:text-lg font-normal tracking-wide">
                  ⚠️ Oops! Something went wrong
                </h1>
              </div>
              <img
                src="/oops_desktop.jpg"
                alt="Room"
                className="w-full hidden md:block"
              />
              <img src="/oops.jpg" alt="Room" className="w-full  md:hidden" />
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center">
            <div className="w-full relative">
              <div className="flex-1 flex justify-center items-center gap-4 py-20">
                <ChevronLeft
                  onClick={handleLeft}
                  className="cursor-pointer text-black"
                  size={32}
                />
                <h1 className="text-md md:text-lg font-normal tracking-wide">
                  Your search returned no matches{" "}
                </h1>
              </div>
              <img
                src="/oops_desktop.jpg"
                alt="Room"
                className="w-full hidden md:block"
              />
              <img src="/oops.jpg" alt="Room" className="w-full  md:hidden" />
            </div>
          </div>
        ) : (
          <div className="">
            <div className="max-w-2xl mx-auto"> 
            <StepProcessBar currentStep={1} handleLeft={handleLeft} />
            </div>
            

            {/* Always show year filter status */}
            <p className="text-center text-gray-500 mb-8 mt-4 font-medium">
              Search Results for Academic Year:{" "}
              <span className="text-black">{filters.year ?? "Every"}</span>
            </p>
            <div className="space-y-6 my-10 max-w-6xl mx-auto">
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
          </div>
        )}
      </div>
      <CheckoutBanner />
    </>
  );
}

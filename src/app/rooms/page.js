"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { roomQueriesWithYear } from "@/lib/sanity/queries";
import RoomCard from "@/components/RoomCard";

export default function RoomList() {
  const searchParams = useSearchParams();

  const year = useMemo(() => {
    return (
      searchParams.get("year") ||
      `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`
    );
  }, [searchParams]);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await client.fetch(roomQueriesWithYear, { year });
        setRooms(data || []);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [year]);

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  if (!rooms.length) {
    return <p className="text-center text-gray-500">No rooms available.</p>;
  }

  return (
    <div key={year} className="max-w-2xl mx-auto p-4">
      <p className="text-center text-gray-500 mb-2">
        Showing details for the year: {year}
      </p>

      <div className="space-y-6">
        {rooms &&
          rooms.length > 0 &&
          rooms.map((room) => (
            <RoomCard key={room.slug} room={room} year={year} />
          ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { client } from "@/sanity/lib/client";
export default function RoomList() {
  const [rooms, setRooms] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const query = `*[_type == "room"]{
          roomNumber,
          roomType,
          priceWinter,
          "property": property->{
            propertyName,
            slug
          },
          "slug": slug.current,
          "imageUrl": property->images[0].asset->url,
          isAvailable,
          bookedPeriods
        }`;

        const data = await client.fetch(query);
        console.log("Fetched rooms data:", data);
        setRooms(data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  if (!rooms || rooms.length === 0) {
    return <p className="text-center text-gray-500">No rooms available.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
    <section className="space-y-4" aria-label="Room selection">
      {rooms.map((room) => (
        <div key={room.slug} className="bg-white rounded-lg shadow-md">
          {room.imageUrl && (
            <Image
              src={room.imageUrl}
              alt={`Room ${room.roomNumber}`}
              width={300}
              height={400}
              className="w-full h-full"
            />
          )}
          <div className="px-5 py-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-lg">{room.property.propertyName}, room {room.roomNumber}</h3>
                <p className="text-gray-500 text-sm">
                {room.property.propertyName} / {room.roomType} / {room.priceWinter}
                </p>
              </div>
              <Link href={`/rooms/${room.slug}`} passHref>
                <button className="px-6 py-2 border border-black rounded-full hover:bg-black hover:text-gray-200 transition-colors duration-700">
                  Book
                </button>
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              <details className="group">
                <summary className="cursor-pointer hover:text-gray-700 list-none font-semibold">
                  + About this property
                </summary>
                <div className="pl-4 mt-2 text-sm text-gray-400">
                  <p className="w-56">Apartment with shared facilities, ideal for coliving.</p>
                </div>
              </details>
              <details className="group">
                <summary className="cursor-pointer hover:text-gray-700 list-none font-semibold">
                  + Availability
                </summary>
                <div className="px-2 py-2 text-sm">
                  <div className="mb-2">
                    <p className="font-semibold text-gray-500 p-2">
                      Status: {room.isAvailable ? 'Available' : 'Not Available'}
                    </p>
                    <div className="ml-4">
                      {["1st Semester", "2nd Semester", "Summer", "Both Semesters", "Full Year"].map((period) => (
                        <label
                          key={period}
                          className="px-2 text-gray-400 block mb-2"
                        >
                          <input
                            type="checkbox"
                            checked={room.bookedPeriods?.includes(period)}
                            readOnly
                            className="mr-2"
                          />
                          {period}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
              <details className="group">
                <summary className="cursor-pointer hover:text-gray-700 list-none font-semibold">
                  + Services
                </summary>
                <div className="pl-4 mt-2">
                  <label className="text-gray-400 block text-sm">
                    <input
                      type="checkbox"
                      name="roomCleaning"
                      value="Weekly room cleaning"
                    />{" "}
                    Weekly room cleaning
                  </label>
                </div>
              </details>
            </div>
          </div>
        </div>
      ))}
    </section>
    </div>
  );
}

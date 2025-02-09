"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

import { client } from "@/sanity/lib/client";

export default function RoomDetails() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (!slug) return;

    const fetchRoom = async () => {
      try {
        const query = `*[_type == "room" && slug.current == $slug][0]{
          roomNumber,
          roomType,
          priceWinter,
          priceSummer,
          "property": property->{
            propertyName,
            slug
          },
          "imageUrl": property->images[0].asset->url,
          availability.years[]{
            year,
            semesters
          },
          services
        }`;

        const params = { slug };
        const data = await client.fetch(query, params);
        setRoom(data);
      } catch (error) {
        console.error("Error fetching room:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [slug]);

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!room) return <p className="text-center text-gray-500">Room not found.</p>;

  return (
    <section className="space-y-4">
      <div className="bg-white rounded-lg shadow-md">
        {room.imageUrl && (
          <Image
            src={room.imageUrl}
            alt={`Room ${room.roomNumber}`}
            width={500}
            height={400}
            className="w-full h-full object-cover"
          />
        )}
        <div className="px-5 py-2">
          <h3 className="font-medium text-lg">
            Room {room.roomNumber} - {room.roomType}
          </h3>
          <p className="text-gray-500">
            {room.property.propertyName} / Winter: {room.priceWinter} / Summer: {room.priceSummer}
          </p>

          <details className="group">
            <summary className="cursor-pointer hover:text-gray-700 list-none font-semibold">
              + Availability
            </summary>
            <div className="px-2 py-2 text-sm">
              {room.availability?.map(({ year, semesters }) => (
                <div key={year}>
                  <label className="font-semibold text-gray-500 p-2 block">{year}</label>
                  {semesters.map((term, index) => (
                    <label key={`${year}-${index}`} className="px-2 text-gray-400 block">
                      <input type="checkbox" name={`semester_${year}`} value={term} /> {term}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </details>

          <details className="group">
            <summary className="cursor-pointer hover:text-gray-700 list-none font-semibold">
              + Services
            </summary>
            <div className="pl-4 mt-2">
              {room.services?.map((service, index) => (
                <label key={index} className="text-gray-400 block text-sm">
                  <input type="checkbox" name={`service_${index}`} value={service} /> {service}
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}


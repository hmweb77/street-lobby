"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { sanityClient } from "@/lib/sanity";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

function MapPlaceholder() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className={`${
              (Math.floor(i / 8) + (i % 8)) % 2 === 0 ? "bg-gray-100" : "bg-white"
            }`}
          />
        ))}
      </div>
      <span className="relative z-10 text-2xl font-bold text-black">MAP</span>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <svg
        className="animate-spin h-12 w-12 text-[#4AE54A]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p className="text-gray-600 text-lg">Loading properties...</p>
    </div>
  );
}

export default function PropertyMap() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const query = `*[_type == "property"] {
          _id,
          propertyName,
          propertyDescriptions,
          "location": location->{
            coordinates
          },
          slug
        }`;
        
        const result = await sanityClient.fetch(query);
        
        if (!result.length) {
          setError("No properties found");
          setLoading(false);
          return;
        }

        const formattedProperties = result
          .filter(prop => prop.location?.coordinates)
          .map(prop => ({
            id: prop._id,
            address: prop.propertyName,
            lat: prop.location.coordinates.lat,
            lng: prop.location.coordinates.lng,
            description: prop.propertyDescriptions,
            slug: prop.slug?.current
          }));

        setProperties(formattedProperties);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties");
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleKeepBooking = () => router.push("/");

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-[#111111] px-6 py-2.5 text-sm text-white"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="w-auto max-w-5xl mx-auto my-14 flex justify-center gap-1">
        <div className="relative flex-1 flex justify-center">
          <ChevronLeft
            onClick={handleKeepBooking}
            className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 text-black"
            size={60}
          />
          <h1 className="relative text-5xl font-black mb-2 tracking-wide">
            <span className="absolute -right-1 text-[#4AE54A] z-0">RESIDENCES</span>
            <span className="relative text-black z-10">RESIDENCES</span>
          </h1>
        </div>
      </div>

      <div className="mb-6 mx-auto w-full max-w-5xl flex flex-col items-center space-y-2">
        {properties.map((property) => (
          <div key={property.id}>
          <button
            key={property.id}
            onClick={() => setSelectedProperty(property.id)}
            className={`w-full text-center text-base transition-colors ${
              selectedProperty === property.id 
                ? "font-medium text-[#4AE54A]"
                : "font-normal text-black hover:text-[#4AE54A]"
            }`}
          >
            {property.address}
          </button>
          {
            selectedProperty === property.id && (
              <p className="text-gray-600 text-sm w-60 text-center">
                {property.description}
              </p>
            )
          }
          </div>
        ))}
      </div>

      {/* {selectedProperty && (
        <div className="max-w-2xl mx-auto mb-8 px-4 text-center">
          <p className="text-gray-600 text-lg">
            {properties.find(p => p.id === selectedProperty)?.description}
          </p>
        </div>
      )} */}

      <div className="my-20 h-[350px] w-full overflow-hidden border border-blue-200">
        <MapComponent
          properties={properties}
          selectedProperty={selectedProperty}
          setSelectedProperty={setSelectedProperty}
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-[#111111] px-6 py-2.5 text-sm text-white hover:bg-opacity-90 transition-opacity"
        >
          Rent a property
        </button>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { sanityClient } from "@/lib/sanity";
import PageTitle from "@/components/PageTitle";
import { IoHomeOutline } from "react-icons/io5";

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
              (Math.floor(i / 8) + (i % 8)) % 2 === 0
                ? "bg-gray-100"
                : "bg-white"
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
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
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
          alLicense,
          "mapData": propertiesMap->{
            coordinates,
            descriptions,
            zipCode,
            alLicense,
            city
          },
          slug
        }`;
        

        const result = await sanityClient.fetch(query);

        if (!result.length) {
          setError("No properties found");
          setLoading(false);
          return;
        }

        const formatted = result
        .filter((p) => p.mapData?.coordinates)
        .map((p) => ({
          id: p._id,
          propertyName: p.propertyName,
          address: p.propertyName,
          alLicense:p.alLicense,
          addressDescription: p.mapData.descriptions,
          zipCode: p.mapData.zipCode,
          city: p.mapData.city,
          lat: p.mapData.coordinates.lat,
          lng: p.mapData.coordinates.lng,
          description: p.propertyDescriptions,
          slug: p.slug?.current,
        }));
      
      
      

        setProperties(formatted);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

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
    <main className="px-4 py-8 max-w-7xl mx-auto">
      {/* <PageTitle title="RESIDENCES" /> */}

      <div className="mb-6 mx-auto w-full max-w-5xl flex flex-col items-center space-y-2">
        {properties.map((property) => (
          <div key={property.id}>
            <button
              onClick={() => setSelectedProperty(property.id)}
              className={`w-full text-center text-base transition-colors ${
                selectedProperty === property.id
                  ? "font-medium text-[#4AE54A]"
                  : "font-normal text-black hover:text-[#4AE54A]"
              }`}
            >
              {property.propertyName}
            </button>
            {selectedProperty === property.id && (
              <div className="text-gray-600 flex flex-col text-sm mx-8 sm:mx-1 text-center mt-2">
                <p>{property.addressDescription || ""}</p>
                <p>
                  {property.zipCode || ""} {property.city || ""}
                </p>
                <p>
                AL License : { property.alLicense}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

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
          Book Now
        </button>
      </div>
    </main>
  );
}

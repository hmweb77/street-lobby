"use client";
import React, { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import properties from "@/lib/properties"; // Import properties data

const LandingPageEx = () => {
  const [expandedFilter, setExpandedFilter] = useState(null);
  const [selectedYear, setSelectedYear] = useState("2024 / 2025");
  const [priceValue, setPriceValue] = useState(650);
  const [selectedFilters, setSelectedFilters] = useState({
    period: null,
    location: null,
    roomType: null,
    colivingCapacity: null,
    propertyType: null,
  });

  const years = ["2024 / 2025", "2025 / 2026", "2026 / 2027"];

  const navigateYear = (direction) => {
    const currentIndex = years.indexOf(selectedYear);
    if (direction === "next" && currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    } else if (direction === "prev" && currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    }
  };

  const filters = [
    {
      id: "period",
      label: "Period",
      options: [
        { label: "1st semester (Sep - Jan)", value: "semester1" },
        { label: "2nd semester (Feb - Jun)", value: "semester2" },
        { label: "Both (1st and 2nd semester)", value: "both" },
        { label: "Summer", value: "summer" },
        { label: "All (1st, 2nd semester and summer)", value: "all" },
      ],
    },
    {
      id: "location",
      label: "Location",
      options: [
        { label: "Anjos", value: "Anjos" },
        { label: "Avenidas Novas", value: "Avenidas Novas" },
        { label: "Arroios", value: "Arroios" },
        { label: "Costa de Caparica", value: "Costa de Caparica" },
        { label: "Doesn't matter", value: "any" },
      ],
    },
    {
      id: "roomType",
      label: "Room type",
      options: [
        { label: "Single bed", value: "single bed" },
        { label: "Double bed", value: "double bed" },
        { label: "Twin beds", value: "twin beds" },
        { label: "Suite", value: "suite" },
        { label: "Any", value: "any" },
      ],
    },
    {
      id: "monthlyPrice",
      label: "Monthly Price",
      type: "range",
      min: 300,
      max: 1000,
      value: priceValue,
      onChange: (value) => setPriceValue(value),
    },
    {
      id: "colivingCapacity",
      label: "Coliving capacity",
      options: [
        { label: "3 people or less", value: "3 people" },
        { label: "6 people or less", value: "6 people" },
        { label: "More than 6 people", value: "7 people" },
        { label: "Doesn't matter", value: "any" },
      ],
    },
    {
      id: "propertyType",
      label: "Property type",
      options: [
        { label: "House", value: "house" },
        { label: "Apartment", value: "apartment" },
        { label: "Any", value: "any" },
      ],
    },
  ];

  // Filter function to apply filters to the properties list
  const filteredProperties = properties.filter((property) => {
    return (
      (selectedFilters.location === null || selectedFilters.location === "any" || property.location === selectedFilters.location) &&
      (selectedFilters.roomType === null || selectedFilters.roomType === "any" || property.roomType === selectedFilters.roomType) &&
      (selectedFilters.colivingCapacity === null || selectedFilters.colivingCapacity === "any" || property.colivingCapacity === selectedFilters.colivingCapacity) &&
      (selectedFilters.propertyType === null || selectedFilters.propertyType === "any" || property.propertyType.toLowerCase().includes(selectedFilters.propertyType.toLowerCase())) &&
      (priceValue >= parseInt(property.priceWinter.replace("€", "")))
    );
  });

  const handleSearch = () => {
    console.log("Filtered Properties:", filteredProperties);
  };

  return (
    <main className="py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-center">
          <h1 className="relative text-4xl font-black mb-2 tracking-wide">
            <span className="absolute -left-1 text-[#4AE54A] z-0">BOOK NOW</span>
            <span className="relative text-black z-10">BOOK NOW</span>
          </h1>
        </div>
        <div className="mb-4 text-center">
          <p className="text-base font-normal">your next staycation in Lisbon</p>
        </div>

        <div className="mb-8">
          <Image
            width={400}
            height={300}
            src="/Rectangle 1.png"
            alt="Featured"
            className="w-full h-64 rounded-lg"
          />
        </div>

        <div className="relative w-full mb-8 px-12">
          <div className="w-full border-2 border-black rounded py-2 px-4 flex items-center justify-between font-bold text-lg">
            <button
              onClick={() => navigateYear("prev")}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={years.indexOf(selectedYear) === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-lg">{selectedYear}</span>

            <button
              onClick={() => navigateYear("next")}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={years.indexOf(selectedYear) === years.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-12 text-sm">
          {filters.map((filter) => (
            <div key={filter.id} className="border-t border-gray-100 pt-4">
              <button
                className="w-full text-left"
                onClick={() =>
                  setExpandedFilter(expandedFilter === filter.id ? null : filter.id)
                }
              >
                <span className="text-sm font-semibold">
                  {expandedFilter === filter.id ? "−" : "+"} {filter.label}
                </span>
              </button>
              {expandedFilter === filter.id && (
                <div className="mt-4 space-y-3 pl-4">
                  {filter.type === "range" ? (
                    <div>
                      <input
                        type="range"
                        min={filter.min}
                        max={filter.max}
                        value={filter.value}
                        onChange={(e) => {
                          filter.onChange(e.target.value);
                          setPriceValue(e.target.value);
                        }}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    filter.options.map((option) => (
                      <label key={option.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={filter.id}
                          value={option.value}
                          className=" accent-black"
                         
                          onChange={() =>
                            setSelectedFilters((prev) => ({
                              ...prev,
                              [filter.id]: option.value,
                            }))
                          }
                        />
                        <span className="text-gray-400">{option.label}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button className="bg-black text-white py-3 px-8 rounded-full font-medium" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>
    </main>
  );
};







"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { sanityClient } from "@/lib/sanity";
import { useSearchParams } from "next/navigation";

const RoomsPageEx = () => {
  const [rooms, setRooms] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [filteredProperties, setFilteredProperties] = useState(null);

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
          availability
        }`;

        const data = await sanityClient.fetch(query);
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
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Available Rooms</h1>
      
      <div className="space-y-4">
        {filteredProperties?.length > 0 ? (
          filteredProperties.map((property) => (
            <div key={property.id} className="p-4 border rounded-lg shadow-sm">
              <p className="font-semibold">{property.name}</p>
              <p>Location: {property.location}</p>
              <p>Price: {property.priceWinter}</p>
              {/* Add more property details as needed */}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No results found.</p>
        )}
      </div>
    </div>
  );
};



"use client";
import React, { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFilterBooking } from "@/context/BookingFilterContext";

const FilterRooms = () => {
  const router = useRouter();
  const { 
    properties, 
    selectedFilters, 
    updateFilters, 
    updateFilteredProperties,
    locations,
    roomTypes,
    propertyTypes,
    loading 
  } = useFilterBooking();
  
  const [expandedFilter, setExpandedFilter] = useState(null);
  const years = ["2024 / 2025", "2025 / 2026", "2026 / 2027"];

  const navigateYear = (direction) => {
    const currentIndex = years.indexOf(selectedFilters.selectedYear);
    if (direction === "next" && currentIndex < years.length - 1) {
      updateFilters({ selectedYear: years[currentIndex + 1] });
    } else if (direction === "prev" && currentIndex > 0) {
      updateFilters({ selectedYear: years[currentIndex - 1] });
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
        ...locations.map(loc => ({ label: loc.name, value: loc.value })),
        { label: "Doesn't matter", value: "any" },
      ],
    },
    {
      id: "roomType",
      label: "Room type",
      options: [
        ...roomTypes.map(type => ({ label: type.name, value: type.value })),
        { label: "Any", value: "any" },
      ],
    },
    {
      id: "monthlyPrice",
      label: "Monthly Price",
      type: "range",
      min: 300,
      max: 1000,
      value: selectedFilters.priceValue,
      onChange: (value) => updateFilters({ priceValue: value }),
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
        ...propertyTypes.map(type => ({ label: type.name, value: type.value })),
        { label: "Any", value: "any" },
      ],
    },
  ];

  const handleSearch = () => {
    const filteredProperties = properties.filter((property) => {
      return (
        (selectedFilters.location === null || selectedFilters.location === "any" || property.location === selectedFilters.location) &&
        (selectedFilters.roomType === null || selectedFilters.roomType === "any" || property.roomType === selectedFilters.roomType) &&
        (selectedFilters.colivingCapacity === null || selectedFilters.colivingCapacity === "any" || property.colivingCapacity === selectedFilters.colivingCapacity) &&
        (selectedFilters.propertyType === null || selectedFilters.propertyType === "any" || property.propertyType === selectedFilters.propertyType) &&
        (selectedFilters.priceValue >= parseInt(property.priceWinter.replace("€", "")))
      );
    });

    updateFilteredProperties(filteredProperties);
    router.push('/rooms');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="relative w-full mb-8 px-12">
        <div className="w-full border-2 border-black rounded py-2 px-4 flex items-center justify-between font-bold text-lg">
          <button
            onClick={() => navigateYear("prev")}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={years.indexOf(selectedFilters.selectedYear) === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg">{selectedFilters.selectedYear}</span>
          <button
            onClick={() => navigateYear("next")}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={years.indexOf(selectedFilters.selectedYear) === years.length - 1}
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
                        updateFilters({ priceValue: e.target.value });
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
                        onChange={() =>
                          updateFilters((prev) => ({
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
        <button 
          className="bg-black text-white py-3 px-8 rounded-full font-medium"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default FilterRooms;

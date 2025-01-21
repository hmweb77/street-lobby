"use client";
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";


const LandingPage = () => {
  const [expandedFilter, setExpandedFilter] = useState(null);// Manages which filter section (if any) is expanded
  const [isOpen, setIsOpen] = useState(false);//Tracks whether the year selection dropdown is open
  const [selectedYear, setSelectedYear] = useState("2024 / 2025");//tores the year currently chosen by the user
  const [priceValue, setPriceValue] = useState(650);//Tracks the user-selected price range for filtering

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
        { label: "Anjos", value: "anjos" },
        { label: "Avenidas Novas", value: "avenidas" },
        { label: "Estefânia", value: "estefania" },
        { label: "Costa de Caparica", value: "costa" },
        { label: "Doesn't matter", value: "any" },
      ],
    },
    {
      id: "roomType",
      label: "Room type",
      options: [
        { label: "Single bed", value: "single" },
        { label: "Double bed", value: "double" },
        { label: "Twin beds", value: "twin" },
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
        { label: "3 people or less", value: "3" },
        { label: "6 people or less", value: "6" },
        { label: "More than 6 people", value: "7plus" },
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

  const years = ["2024 / 2025", "2025 / 2026", "2026 / 2027"];

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setIsOpen(false);
  };

  return (
  
      <main className=" py-8">
        <div className="max-w-lg mx-auto">
          {/* Hero Section */}
          <div className=" flex justify-center">
            <h1 className="relative text-4xl  font-black mb-2 tracking-wide">
              <span className="absolute -left-1 text-[#4AE54A] z-0">
                BOOK NOW
              </span>
              <span className="relative text-black z-10">BOOK NOW</span>
            </h1>
          </div>
          <div className="mb-4 text-center">
            <p className="text-base font-normal">
              your next staycation in Lisbon
            </p>
          </div>

          {/* Featured Image */}
          <div className="mb-8">
            <Image
              width={400}
              height={300}
              src="/Rectangle 1.png"
              alt="Featured"
              className="w-full h-64 rounded-lg"
            />
          </div>

          {/* Year Selection */}
          <div className="relative w-full mb-8 px-12">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full border-2 border-black rounded py-2 px-4 flex items-center justify-between font-bold text-lg"
            >
              <span>{selectedYear}</span>
              <ChevronRight
                className={`w-5 h-5 transform transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded z-50">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className="w-full px-4 py-2 text-left hover:bg-black hover:text-white"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filters */}
          <div className="space-y-4 px-12 text-sm ">
            {filters.map((filter) => (
              <div key={filter.id} className="border-t border-gray-200 pt-4">
                <button
                  className="w-full text-left"
                  onClick={() =>
                    setExpandedFilter(
                      expandedFilter === filter.id ? null : filter.id
                    )
                  }
                >
                  <span className="text-sm">
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
                          onChange={(e) => filter.onChange(e.target.value)}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                          <span>{filter.min}€</span>
                          <span>{filter.value}€</span>
                          <span>{filter.max}€</span>
                        </div>
                      </div>
                    ) : (
                      filter.options.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="radio"
                            name={filter.id}
                            value={option.value}
                            className="form-radio"
                          />
                          <span className="text-gray-700">{option.label}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search Button */}
          <div className="mt-8 flex justify-center">
            <button className=" bg-black text-white py-3 px-8 rounded-full font-medium">
              Search
            </button>
          </div>
        </div>
      </main>

  );
};

export default LandingPage;

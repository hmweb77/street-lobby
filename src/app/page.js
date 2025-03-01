"use client";
import React, { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import properties from "@/lib/properties";
import { useRouter } from 'next/navigation';
import { fetchAllLocations } from "@/lib/fireStoreQuery/filterQuery";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";
import PriceSlider from "@/components/PriceSlider";

const LandingPage = () => {
  const [expandedFilters, setExpandedFilters] = useState([]);
  const [selectedYear, setSelectedYear] = useState("2024/2025");
  const [priceValue, setPriceValue] = useState(650);
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    period: null,
    location: null,
    roomType: null,
    colivingCapacity: null,
    propertyType: null,
  });

  const { setParams }  = useUrlSearchParams();

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("year", selectedYear);
    params.set("price", priceValue);
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value !== null && value !== false && value !== "false") params.set(key, value);
    });
    setParams(`/rooms?${params.toString()}`);
    router.push(`/rooms?${params.toString()}`);
  };

  const router = useRouter();
  const years = Array.from({ length: 3 }, (_, i) => 
    `${new Date().getFullYear() + i - 1}/${new Date().getFullYear() + i}`
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllLocations();
        setLocations(data);
      } finally {
        setIsLoadingLocations(false);
      }
    })();
  }, []);

  const filters = [
    {
      id: "period",
      label: "Period",
      options: [
        { label: "1st semester (Sep - Jan)", value: "1st Semester" },
        { label: "2nd semester (Feb - Jun)", value: "2nd Semester" },
        { label: "Both (1st and 2nd semester)", value: "1st Semester,2nd Semester" },
        { label: "Summer", value: "Summer" },
        { label: "All (1st, 2nd semester and summer)", value: "1st Semester,2nd Semester,Summer" },
      ],
    },
    {
      id: "location",
      label: "Location",
      options: isLoadingLocations
        ? [{ label: "Loading locations...", value: false, disabled: true }]
        : [...locations, { label: "Doesn't matter", value: false }],
    },
    {
      id: "roomType",
      label: "Room type",
      options: [
        { label: "Single bed", value: "Single bed" },
        { label: "Double bed", value: "Double bed" },
        { label: "Twin beds", value: "Twin beds" },
        { label: "Suite", value: "Suite" },
        { label: "Any", value: false },
      ],
    },
    {
      id: "monthlyPrice",
      label: "Monthly Price",
      type: "range",
      min: 100,
      max: 1500 ,
      value: priceValue,
      onChange: (value) => setPriceValue(value),
    },
    {
      id: "colivingCapacity",
      label: "Coliving capacity",
      options: [
        { label: "3 people or less", value: 3 },
        { label: "6 people or less", value: 6 },
        { label: "More than 6 people", value: 7 },
        { label: "Doesn't matter", value: false },
      ],
    },
    {
      id: "propertyType",
      label: "Property type",
      options: [
        { label: "House", value: "House" },
        { label: "Apartment", value: "Apartment" },
        { label: "Any", value: false },
      ],
    },
  ];

  const handleFilterToggle = (filterId) => {
    setExpandedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId) 
        : [...prev, filterId]
    );
  };

  return (
    <main className="py-8">
      <div className="">
        <div className="flex justify-center">
          <h1 className="relative text-4xl md:text-5xl font-black mb-2 tracking-wide">
            <span className="absolute -right-1 text-[#4AE54A] z-0">BOOK NOW</span>
            <span className="relative text-black z-10">BOOK NOW</span>
          </h1>
        </div>
        <div className="mb-4 text-center">
          <p className="text-base font-normal">your next staycation in Lisbon</p>
        </div>

        <div className="mb-8 flex justify-center items-center">
          <Image
            src="/Rectangle 1.svg"
            alt="Featured"
            width={393}
            height={248}
            className="rounded-lg block lg:hidden"
          />
          <Image
            src="/Rectangle 25.svg"
            alt="Featured"
            width={1440}
            height={409}
            className="rounded-lg hidden lg:block"
          />
        </div>

        <div className="relative max-w-lg mx-auto mb-8 px-4">
          <div className="w-full border-2 border-black rounded py-2 px-4 flex items-center">
            <button
              onClick={() => document.getElementById('yearScroller').scrollBy({ left: -document.getElementById('yearScroller').offsetWidth, behavior: 'smooth' })}
              className="p-2 hover:bg-gray-100 rounded-full flex-none"
              disabled={years.indexOf(selectedYear) === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div 
              id="yearScroller"
              className="flex flex-1 overflow-x-auto snap-x snap-mandatory scrollbar-hide mx-4"
              onScroll={(e) => {
                const scrollPosition = e.currentTarget.scrollLeft;
                const itemWidth = e.currentTarget.offsetWidth;
                const newIndex = Math.round(scrollPosition / itemWidth);
                setSelectedYear(years[newIndex]);
              }}
            >
              {years.map((year) => (
                <div 
                  key={year}
                  className="flex-none w-full snap-center flex justify-center items-center"
                >
                  <span className={`text-lg font-bold transition-all duration-300 ${
                    selectedYear === year ? 'scale-110' : ''
                  }`}>
                    {year}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => document.getElementById('yearScroller').scrollBy({ left: document.getElementById('yearScroller').offsetWidth, behavior: 'smooth' })}
              className="p-2 hover:bg-gray-100 rounded-full flex-none"
              disabled={years.indexOf(selectedYear) === years.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 max-w-lg mx-auto px-12 text-sm">
          {filters.map((filter) => {
            const hasSelection = selectedFilters[filter.id] !== null;
            const isExpanded = expandedFilters.includes(filter.id);

            return (
              <div key={filter.id} className="border-t border-gray-100 pt-4">
                <button
                  className="w-full text-left"
                  onClick={() => handleFilterToggle(filter.id)}
                >
                  <span className="text-sm font-semibold">
                    {isExpanded ? "−" : "+"} {filter.label}
                    {filter.id === 'monthlyPrice' && ` (€${priceValue})`}
                  </span>
                </button>
                {isExpanded && (
                  <div className="mt-4 space-y-3 pl-4">
                    {filter.type === "range" ? (
                      <PriceSlider 
                        min={filter.min}
                        max={filter.max}
                        defaultValue={filter.value}
                        onChange={filter.onChange}
                      />
                    ) : (
                      filter.options.map((option) => (
                        <label key={option.value} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={filter.id}
                            value={option.value}
                            checked={selectedFilters[filter.id] === option.value}
                            onChange={() => {
                              setSelectedFilters(prev => ({
                                ...prev,
                                [filter.id]: option.value
                              }));
                            }}
                            disabled={option.disabled}
                          />
                          <span className={`${option.disabled ? 'text-gray-300' : 'text-gray-400'}`}>
                            {option.label}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
    </main>
  );
};

export default LandingPage;
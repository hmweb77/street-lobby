"use client";

import { useState } from "react";
import StepProcessBar from "@/components/booking/ProcessBar";
import Image from "next/image";
import properties from "@/lib/properties"; // Importing properties data

// Room Selection Component
const RoomSelection = ({ onNext }) => {
  const rooms = properties.map((property, index) => ({
    id: index + 1,
    img: "/room.jpg",
    name: `${property.propertyName}, room ${property.roomNumber}`,
    details: `${property.location} / ${property.propertyType.split(" ")[0]} / ${property.roomType}`,
    price: `${property.priceWinter}`,
    About: `${property.propertyType}, hosts ${property.colivingCapacity}`,
    years: {
      "2024/2025": ["2nd semester", "Summer"],
      "2025/2026": ["1st semester", "2nd semester", "Summer"],
    },
  }));

  return (
    <section className="space-y-4" aria-label="Room selection">
      {rooms.map((room) => (
        <div key={room.id} className="bg-white rounded-lg shadow-md">
          <Image
            src={room.img}
            alt={room.name}
            width={300}
            height={400}
            className="w-full h-full"
          />
          <div className="px-5 py-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-lg">{room.name}</h3>
                <p className="text-gray-500 text-sm">
                  {room.details} / {room.price}
                </p>
              </div>
              <button
                onClick={onNext}
                className="px-6 py-2 border border-black rounded-full hover:bg-black hover:text-gray-200 transition-colors duration-700"
              >
                Book
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <details className="group">
                <summary className="cursor-pointer hover:text-gray-700 list-none font-semibold">
                  + About this property
                </summary>
                <div className="pl-4 mt-2 text-sm text-gray-400">
                  <p className="w-56">{room.About}</p>
                </div>
              </details>
              <details className="group">
                <summary className="cursor-pointer hover:text-gray-700 list-none font-semibold">
                  + Availability
                </summary>
                <div className="px-2 py-2 text-sm">
                  {Object.keys(room.years).map((year) => (
                    <div key={year}>
                      <label className="font-semibold text-gray-500 p-2 block">
                        {year}
                      </label>
                      {room.years[year].map((term) => (
                        <label key={term} className="px-2 text-gray-400 block">
                          <input
                            type="checkbox"
                            name={`semester_${year}`}
                            value={term}
                          />{" "}
                          {term}
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
  );
};

// Eligibility Check Component
const EligibilityCheck = ({ onNext }) => {
  return (
    <section className="space-y-6" aria-label="Eligibility check">
      <div className="text-sm text-gray-600 space-y-1">
        <p>• Specify guest details for each booking</p>
        <p>All the bookings belong to one guest</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-medium mb-4">
          ARROIOS 21, room 2, 2024/2025 1st Semester 500€
        </h3>
        <form className="grid grid-cols-2 gap-4">
          <input
            placeholder="Age*"
            required
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Name*"
            required
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Genre*"
            required
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Permanent Address*"
            required
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="Nationality*"
            required
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            placeholder="ID*"
            required
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            className="col-span-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Studying? Working? Where?*"
            required
          />
        </form>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="w-40 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Check eligibility
        </button>
      </div>
    </section>
  );
};

// Payment Component
const Payment = () => {
  return (
    <section className="text-center p-8" aria-label="Payment">
      <h2 className="text-xl font-medium mb-4">Payment Details</h2>
      <p className="text-gray-600">Payment section to be implemented</p>
    </section>
  );
};

// Main Booking Container
const BookingContainer = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <RoomSelection onNext={handleNext} />;
      case 2:
        return <EligibilityCheck onNext={handleNext} />;
      case 3:
        return <Payment />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <StepProcessBar
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
      <main className="mt-8">{renderStep()}</main>
    </div>
  );
};

export default BookingContainer;

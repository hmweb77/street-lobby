// app/components/booking/BookingContainer.js
'use client';

import { useState } from 'react';
import StepProcessBar from '@/components/booking/ProcessBar';

// Room Selection Component
const RoomSelection = ({ onNext }) => {
  const rooms = [
    {
      id: 1,
      name: "ARROIOS 21, room 1",
      details: "Anjos / 16m2 / double bed",
      price: "650€"
    },
    {
      id: 2,
      name: "ARROIOS 21, room 2",
      details: "Anjos / 12m2 / double bed",
      price: "500€"
    }
  ];

  return (
    <section className="space-y-4" aria-label="Room selection">
      {rooms.map((room) => (
        <div key={room.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-lg">{room.name}</h3>
              <p className="text-gray-500 text-sm">{room.details}</p>
              <p className="text-gray-500 text-sm">{room.price}</p>
            </div>
            <button
              onClick={onNext}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Book
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <details className="group">
              <summary className="cursor-pointer hover:text-gray-700 list-none">
                + About this property
              </summary>
              <div className="pl-4 mt-2 text-sm text-gray-600">
                <p>apartment w/ 4 double bed rooms</p>
                <p>1 single bed room / 2 shared WC's</p>
                <p>hosts 5 people</p>
              </div>
            </details>
            <details className="group">
              <summary className="cursor-pointer hover:text-gray-700 list-none">
                + Availability
              </summary>
              <div className="pl-4 mt-2">
                <p>2024/2025</p>
                <p>2025/2026</p>
              </div>
            </details>
            <details className="group">
              <summary className="cursor-pointer hover:text-gray-700 list-none">
                + Services
              </summary>
              <div className="pl-4 mt-2">
                <p>Weekly room cleaning</p>
                <p>Weekly replenishment of linen</p>
              </div>
            </details>
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
      <p className="text-gray-600">
        Payment section to be implemented
      </p>
    </section>
  );
};

// Main Booking Container
const BookingContainer = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
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
      <StepProcessBar currentStep={currentStep} setCurrentStep={setCurrentStep}/>
      <main className="mt-8">
        {renderStep()}
      </main>
    </div>
  );
};

export default BookingContainer;
"use client";

import { useBookingState } from "@/context/BookingContext";
import { useState } from "react";

const EligibilityCheck = ({ onNext }) => {
  const { state, setUserDetails } = useBookingState();
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserDetails({ [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(state.userDetails).forEach((key) => {
      if (!state.userDetails[key]) newErrors[key] = "This field is required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onNext();
  };

  return (
    <section className="space-y-6 flex gap-10" aria-label="Eligibility check">
      {/* Room Details Section */}
      <div className="basis-1/3 bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg">{state.room.propertyTitle} - {state.room.title}</h3>
        {state.bookingPeriods.map((period, index) => (
          <div key={index} className="text-gray-600 border-b pb-2 mb-2">
            <p>Year: {period.year} | Semester: {period.semester}</p>
            <p>Price: {period.price}€</p>
          </div>
        ))}
        <p className="text-gray-700 font-medium">Total Price: {state.totalPrice}€</p>
        {state.services.length > 0 && (
          <ul className="mt-2 text-sm text-gray-600">
            {state.services.map((service, index) => (
              <li key={index} className="list-disc ml-4">{service}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Form Section */}
      <div className="basis-2/3 bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {Object.keys(state.userDetails).map((key) => (
            key === "genre" ? (
              <div key={key} className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1">Genre*</label>
                <div className="flex space-x-4">
                  {["Male", "Female", "Other"].map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="genre"
                        value={option}
                        checked={state.userDetails.genre === option}
                        onChange={handleChange}
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {errors[key] && <span className="text-red-500 text-sm">{errors[key]}</span>}
              </div>
            ) : (
              <div key={key} className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1" htmlFor={key}>
                  {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}*
                </label>
                <input
                  id={key}
                  type={key === "email" ? "email" : "text"}
                  name={key}
                  placeholder={`Enter your ${key}`}
                  required
                  value={state.userDetails[key]}
                  onChange={handleChange}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors[key] && <span className="text-red-500 text-sm">{errors[key]}</span>}
              </div>
            )
          ))}

          <div className="col-span-2 flex items-center justify-center">
            <button
              type="submit"
              className={`w-40 px-4 py-2 rounded-md transition-colors ${
                Object.keys(errors).length === 0 ? "bg-black text-white hover:bg-gray-800" : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={Object.keys(errors).length !== 0}
            >
              Check eligibility
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EligibilityCheck;

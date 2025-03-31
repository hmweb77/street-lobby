"use client";

import { useBookingState } from "@/context/BookingContext";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const EligibilityCheck = ({ onNext }) => {
  const { state, setBooking, setCommonUserDetails } = useBookingState();
  const [errors, setErrors] = useState({});
  const [useCommonDetails, setUseCommonDetails] = useState(true);
  const [apiErrors, setApiErrors] = useState([]);
  const [isEligible, setIsEligible] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();



  useEffect(() => {
    if (state.bookingPeriods.length === 0) {
      router.push("/");
    }
  }, [state.bookingPeriods, router]);

  const handleCommonChange = (e) => {
    const { name, value } = e.target;
    const updatedDetails = { [name]: value };

    setCommonUserDetails(updatedDetails);

    if (useCommonDetails) {
      state.bookingPeriods.forEach((period) => {
        setBooking(
          period.roomId,
          period.roomDetails,
          period.year,
          period.semester,
          {
            userDetails: {
              ...period.userDetails,
              ...updatedDetails,
            },
          }
        );
      });
    }
  };

  const handleIndividualChange = (period, field, value) => {
    setBooking(
      period.roomId,
      period.roomDetails,
      period.year,
      period.semester,
      {
        userDetails: {
          ...period.userDetails,
          [field]: value,
        },
      }
    );
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (useCommonDetails) {
      // Validate common fields including email
      const requiredFields = [
        "email",
        "age",
        "name",
        "genre",
        "permanentAddress",
        "nationality",
        "idNumber",
      ];
      requiredFields.forEach((field) => {
        if (!state.commonUserDetails[field]) {
          newErrors[`common-${field}`] = "This field is required";
        }
      });

      // Validate common email format
      if (
        state.commonUserDetails.email &&
        !emailRegex.test(state.commonUserDetails.email)
      ) {
        newErrors["common-email"] = "Invalid email format";
      }
    } else {
      // Validate individual bookings
      state.bookingPeriods.forEach((period, index) => {
        const requiredFields = [
          "email",
          "age",
          "name",
          "genre",
          "permanentAddress",
          "nationality",
          "idNumber",
        ];
        requiredFields.forEach((field) => {
          if (!period.userDetails?.[field]) {
            newErrors[`${index}-${field}`] = "This field is required";
          }
        });

        // Validate individual email format
        if (
          period.userDetails?.email &&
          !emailRegex.test(period.userDetails.email)
        ) {
          newErrors[`${index}-email`] = "Invalid email format";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingPeriods: state.bookingPeriods.map((p) => ({
            roomId: p.roomId,
            semester: p.semester,
            year: p.year,
          })),
        }),
      });

      const data = await response.json();

      if (data.eligible) {
        onNext();
      } else {
        setApiErrors(data.errors || ["Unable to process booking"]);
        setIsEligible(false);
      }
    } catch (error) {
      setApiErrors(["Failed to check eligibility"]);
      setIsEligible(false);
    } finally {
      setLoading(false);
    }
  };

  const renderCommonFields = () => (
    <div className="bg-white space-y-4">
      {/* Bookings List */}
      <div className="mb-6 space-y-4">
        <h4 className="text-md font-semibold mb-1">Selected Bookings</h4>
        {state.bookingPeriods.map((period, index) => (
          <div key={index} className="flex gap-2">
            <p className="font-medium text-gray-800">
              {period.propertyTitle}, {period.roomTitle}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {period.year} | {period.semester} - €{period.price.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Total Price */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-700">Total Price:</span>
          <span className="font-bold text-lg text-gray-800">
            €{state.totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Common Form Fields */}
      <div className="grid grid-cols-2 gap-4">
        {/* Email */}
        <div className="space-y-2 col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Email Address*
          </label>
          <input
            type="email"
            name="email"
            value={state.commonUserDetails.email || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
            placeholder="Enter your email address"
          />
          {errors["common-email"] && (
            <p className="text-red-500 text-sm">{errors["common-email"]}</p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Age*
          </label>
          <input
            type="number"
            name="age"
            value={state.commonUserDetails.age || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
          />
          {errors["common-age"] && (
            <p className="text-red-500 text-sm">{errors["common-age"]}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Full Name*
          </label>
          <input
            type="text"
            name="name"
            value={state.commonUserDetails.name || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
          />
          {errors["common-name"] && (
            <p className="text-red-500 text-sm">{errors["common-name"]}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Gender*
          </label>
          <div className="flex gap-4">
            {["Male", "Female", "Other"].map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  className="text-gray-900  accent-black"
                  name="genre"
                  value={option}
                  checked={state.commonUserDetails.genre === option}
                  onChange={handleCommonChange}
                />
                {option}
              </label>
            ))}
          </div>
          {errors["common-genre"] && (
            <p className="text-red-500 text-sm">{errors["common-genre"]}</p>
          )}
        </div>

        {/* Permanent Address */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Permanent Address*
          </label>
          <input
            type="text"
            name="permanentAddress"
            value={state.commonUserDetails.permanentAddress || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
          />
          {errors["common-permanentAddress"] && (
            <p className="text-red-500 text-sm">
              {errors["common-permanentAddress"]}
            </p>
          )}
        </div>

        {/* Nationality */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Nationality*
          </label>
          <input
            type="text"
            name="nationality"
            value={state.commonUserDetails.nationality || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
          />
          {errors["common-nationality"] && (
            <p className="text-red-500 text-sm">
              {errors["common-nationality"]}
            </p>
          )}
        </div>

        {/* ID Number */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            ID Number*
          </label>
          <input
            type="text"
            name="idNumber"
            value={state.commonUserDetails.idNumber || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
          />
          {errors["common-idNumber"] && (
            <p className="text-red-500 text-sm">{errors["common-idNumber"]}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderIndividualFields = (period, index) => (
    <div
      key={`${period.roomId}-${period.year}-${period.semester}`}
      className="bg-white py-10"
    >
      <div className="mb-4 border-b pb-2">
        <h3 className="font-bold text-lg">
          {period.propertyTitle}, {period.roomTitle} | {period.year} |{" "}
          {period.semester} | €{period.price.toFixed(2)}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Email */}
        <div className="space-y-2 col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Email Address*
          </label>
          <input
            type="email"
            value={period.userDetails?.email || ""}
            onChange={(e) =>
              handleIndividualChange(period, "email", e.target.value)
            }
            className="w-full p-2 border rounded-md"
            placeholder="Enter your email address"
          />
          {errors[`${index}-email`] && (
            <p className="text-red-500 text-sm">{errors[`${index}-email`]}</p>
          )}
        </div>

        {/* Age */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Age*
          </label>
          <input
            type="number"
            value={period.userDetails?.age || ""}
            onChange={(e) =>
              handleIndividualChange(period, "age", e.target.value)
            }
            className="w-full p-2 border rounded-md"
          />
          {errors[`${index}-age`] && (
            <p className="text-red-500 text-sm">{errors[`${index}-age`]}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Full Name*
          </label>
          <input
            type="text"
            value={period.userDetails?.name || ""}
            onChange={(e) =>
              handleIndividualChange(period, "name", e.target.value)
            }
            className="w-full p-2 border rounded-md"
          />
          {errors[`${index}-name`] && (
            <p className="text-red-500 text-sm">{errors[`${index}-name`]}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Gender*
          </label>
          <div className="flex gap-4">
            {["Male", "Female", "Other"].map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  className="text-gray-900  accent-black"
                  name={`genre-${index}`}
                  value={option}
                  checked={period.userDetails?.genre === option}
                  onChange={() =>
                    handleIndividualChange(period, "genre", option)
                  }
                />
                {option}
              </label>
            ))}
          </div>
          {errors[`${index}-genre`] && (
            <p className="text-red-500 text-sm">{errors[`${index}-genre`]}</p>
          )}
        </div>

        {/* Permanent Address */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Permanent Address*
          </label>
          <input
            type="text"
            value={period.userDetails?.permanentAddress || ""}
            onChange={(e) =>
              handleIndividualChange(period, "permanentAddress", e.target.value)
            }
            className="w-full p-2 border rounded-md"
          />
          {errors[`${index}-permanentAddress`] && (
            <p className="text-red-500 text-sm">
              {errors[`${index}-permanentAddress`]}
            </p>
          )}
        </div>

        {/* Nationality */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Nationality*
          </label>
          <input
            type="text"
            value={period.userDetails?.nationality || ""}
            onChange={(e) =>
              handleIndividualChange(period, "nationality", e.target.value)
            }
            className="w-full p-2 border rounded-md"
          />
          {errors[`${index}-nationality`] && (
            <p className="text-red-500 text-sm">
              {errors[`${index}-nationality`]}
            </p>
          )}
        </div>

        {/* ID Number */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            ID Number*
          </label>
          <input
            type="text"
            value={period.userDetails?.idNumber || ""}
            onChange={(e) =>
              handleIndividualChange(period, "idNumber", e.target.value)
            }
            className="w-full p-2 border rounded-md"
          />
          {errors[`${index}-idNumber`] && (
            <p className="text-red-500 text-sm">
              {errors[`${index}-idNumber`]}
            </p>
          )}
        </div>

        {/* Current Profession */}
        <div className="space-y-2 col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Current Profession/Study
          </label>
          <input
            type="text"
            value={period.userDetails?.currentProfession || ""}
            onChange={(e) =>
              handleIndividualChange(
                period,
                "currentProfession",
                e.target.value
              )
            }
            className="w-full p-2 border rounded-md"
            placeholder="Studying? Working? Where?"
          />
        </div>
      </div>
    </div>
  );

  if (isEligible === false) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">
            Unfortunately, you are not eligible to proceed with this booking
          </h2>

          <div className="space-y-2 mb-6">
            {apiErrors.map((error, index) => (
              <p key={index} className="text-sm">
                • {error}
              </p>
            ))}
          </div>

          <Image
            src="/images/booking-error.svg"
            alt="Booking error"
            width={400}
            height={300}
            className="mx-auto"
          />
        </div>

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-xl font-semibold">Recommended Alternatives</h3>

          {state.bookingPeriods.map((period, index) => (
            <div key={index} className="border-b pb-4 mb-4">
              <h4 className="font-medium">{period.propertyTitle}</h4>
              <p className="text-gray-600">
                {period.roomTitle} | {period.year} | {period.semester}
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm">
                  Original Price: €{period.price.toFixed(2)}
                </p>
                <p className="text-sm text-green-600">
                  Suggested Alternative: €{(period.price * 0.9).toFixed(2)} (10%
                  discount)
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setIsEligible(null);
              setApiErrors([]);
            }}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            Modify Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Mode Selection - Updated to use context setters */}
      <div className="flex flex-col gap-2 mb-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="guestDetailsType"
            value="common"
            className="text-gray-900  accent-black"
            checked={useCommonDetails}
            onChange={() => setUseCommonDetails(true)}
          />
          <span className="opacity-65">All bookings belong to one guest</span>
        </label>

        <label
          className={`${state.bookingPeriods.length <= 1 ? "pointer-events-none cursor-not-allowed opacity-25" : "cursor-pointer"} flex items-center gap-2`}
        >
          <input
            className="text-gray-900  accent-black"
            type="radio"
            name="guestDetailsType"
            value="separate"
            checked={!useCommonDetails}
            onChange={() => setUseCommonDetails(false)}
          />
          <span className="opacity-65">
            Specify guest details for each booking
          </span>
        </label>
      </div>

      {/* Dynamic Form Sections */}
      {useCommonDetails ? (
        renderCommonFields()
      ) : (
        <>
          {state.bookingPeriods.map(renderIndividualFields)}
          {/* Total Price */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700">Total Price:</span>
              <span className="font-bold text-lg text-gray-800">
                €{state.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Updated Submit Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gray-900 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 transition-colors font-medium text-lg disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Checking...
            </div>
          ) : (
            "Check Eligibility"
          )}
        </button>
      </div>
    </div>
  );
};

export default EligibilityCheck;

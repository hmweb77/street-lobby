"use client";

import { useBookingState } from "@/context/BookingContext";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUrlSearchParams } from "@/context/UrlSearchParamsContext";

const EligibilityCheck = ({ onNext, isEligible, setIsEligible }) => {
  const { state, setBooking, setCommonUserDetails, clearAllBookings } =
    useBookingState();
  const { clearParams } = useUrlSearchParams();
  const [errors, setErrors] = useState({});
  const [useCommonDetails, setUseCommonDetails] = useState(true);
  const [apiErrors, setApiErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.bookingPeriods.length === 0 && isEligible !== false) {
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

      if (state.commonUserDetails.age) {
        const age = parseInt(state.commonUserDetails.age);
        if (age < 20 || age > 40) {
          newErrors["common-age"] = "Age must be between 20 and 40";
        }
      }

      if (
        state.commonUserDetails.email &&
        !emailRegex.test(state.commonUserDetails.email)
      ) {
        newErrors["common-email"] = "Invalid email format";
      }
    } else {
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

        if (period.userDetails?.age) {
          const age = parseInt(period.userDetails.age);
          if (age < 20 || age > 40) {
            newErrors[`${index}-age`] = "Age must be between 20 and 40";
          }
        }

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
      const response = await fetch("/api/eligibility-check", {
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
        clearParams();
        clearAllBookings();
      }
    } catch (error) {
      setApiErrors(["Failed to check eligibility"]);
      clearAllBookings();
      clearParams();
      setIsEligible(false);
    } finally {
      setLoading(false);
    }
  };

  const renderCommonFields = () => (
    <div className="bg-white space-y-4">
      <div className="mb-6 space-y-4">
        <h4 className="text-md font-semibold mb-1">Selected Bookings</h4>
        {state.bookingPeriods.map((period, index) => (
          <div key={index} className="flex gap-2">
            <p className="font-medium text-gray-800">
              {period.propertyTitle}, {period.roomTitle}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {period.year} | {period.semester} - €{period.price.toFixed(2)}{" "}
              {period.semester === "Summer" ? "/ Month" : "/ Month"}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6"></div>

      <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Age* (20-40)
          </label>
          <input
            type="number"
            name="age"
            value={state.commonUserDetails.age || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
            min="20"
            max="40"
          />
          {errors["common-age"] && (
            <p className="text-red-500 text-sm">{errors["common-age"]}</p>
          )}
        </div>

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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Genre*
          </label>
          <select
            name="genre"
            value={state.commonUserDetails.genre || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a genre</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors["common-genre"] && (
            <p className="text-red-500 text-sm">{errors["common-genre"]}</p>
          )}
        </div>

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
        <div className="space-y-2 col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Current Profession*
          </label>
          <input
            type="text"
            name="currentProfession"
            value={state.commonUserDetails.currentProfession || ""}
            onChange={handleCommonChange}
            className="w-full p-2 border rounded-md"
            placeholder="Studying? Working? Where?*"
          />
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
          {period.semester} | €{period.price.toFixed(2)}{" "}
          {period.semester === "Summer" ? "/ Month" : "/ Month"}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Age* (20-40)
          </label>
          <input
            type="number"
            value={period.userDetails?.age || ""}
            onChange={(e) =>
              handleIndividualChange(period, "age", e.target.value)
            }
            className="w-full p-2 border rounded-md"
            min="20"
            max="40"
          />
          {errors[`${index}-age`] && (
            <p className="text-red-500 text-sm">{errors[`${index}-age`]}</p>
          )}
        </div>

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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Genre*
          </label>
          <select
            value={period.userDetails?.genre || ""}
            onChange={(e) =>
              handleIndividualChange(period, "genre", e.target.value)
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a genre</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors[`${index}-genre`] && (
            <p className="text-red-500 text-sm">{errors[`${index}-genre`]}</p>
          )}
        </div>

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
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="bg-white p-4 rounded-lg">
          <h1 className="font-semibold text-2xl">OOPS...</h1>
          <h2 className="text-md">
            Unfortunately you are not eligible to proceed with this booking.
          </h2>
          <button
            onClick={() => {
              setIsEligible(null);
              setApiErrors([]);
            }}
            className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            Modify Booking
          </button>

          <Image
            src="/oops.jpg"
            alt="Booking error"
            width={500}
            height={380}
            className="mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2 mb-8">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="guestDetailsType"
            value="common"
            className="text-gray-900 accent-black"
            checked={useCommonDetails}
            onChange={() => setUseCommonDetails(true)}
          />
          <span className="opacity-65">All bookings belong to one guest</span>
        </label>

        <label
          className={`${state.bookingPeriods.length <= 1 ? "pointer-events-none cursor-not-allowed opacity-25" : "cursor-pointer"} flex items-center gap-2`}
        >
          <input
            className="text-gray-900 accent-black"
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

      {useCommonDetails ? (
        renderCommonFields()
      ) : (
        <>
          {state.bookingPeriods.map(renderIndividualFields)}
          <div className="border-t border-gray-200 pt-4 mb-6"></div>
        </>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gray-900 text-white px-8 py-3 rounded-2xl hover:bg-[#4AE54A] transition-colors font-medium text-lg disabled:opacity-50"
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
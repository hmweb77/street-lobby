import Link from "next/link";
import React from "react";
import { initialState, useBookingState } from "@/context/BookingContext";
import { useParams } from "next/navigation";

// Conflict configuration for semester selection
const semesterConflicts = {
  "1st Semester": ["Both Semesters", "Full Year"],
  "2nd Semester": ["Both Semesters", "Full Year"],
  "Both Semesters": ["1st Semester", "2nd Semester", "Full Year"],
  "Full Year": ["1st Semester", "2nd Semester", "Both Semesters", "Summer"],
  "Summer": ["Full Year"], // Summer conflicts with Full Year
};

const RoomCard = ({ room , isReversed = false }) => {

    const params = useParams();
    const propertySlug = params.slug;

  const { state, setBookingPeriod, addBookingPeriod, setServices, setState } = useBookingState();
  let { availableSemesters = [], bookedPeriods = [] } = room || {};
  console.log("🚀 ~ RoomCard ~ bookedPeriods:", bookedPeriods)


  // Filter available semesters considering existing bookings
  const filteredAvailable = availableSemesters.filter((available) => {
    if (!Array.isArray(bookedPeriods) || bookedPeriods.length === 0) {
      return true; // No booked periods, so all available semesters remain available.
    }
  
    const bookedForSameYear = bookedPeriods.filter(
      (booked) => booked.year === available.year
    );
  
    for (const booked of bookedForSameYear) {
      const bookedSemester = booked.semester;
      const availableSemester = available.semester;
  
      if (bookedSemester === "Full Year") return false;
      if (
        bookedSemester === "Both Semesters" &&
        ["1st Semester", "2nd Semester", "Both Semesters", "Full Year"].includes(availableSemester)
      ) {
        return false;
      }
      if (
        bookedSemester === "1st Semester" &&
        ["1st Semester", "Both Semesters", "Full Year"].includes(availableSemester)
      ) {
        return false;
      }
      if (
        bookedSemester === "2nd Semester" &&
        ["2nd Semester", "Both Semesters", "Full Year"].includes(availableSemester)
      ) {
        return false;
      }
      if (bookedSemester === "Summer" && availableSemester === "Summer") return false;
    }
    return true;
  });
  

  if (filteredAvailable.length === 0) return null;

  // Group available semesters by academic year
  const groupedByYear = filteredAvailable.reduce((acc, curr) => {
    if (!acc[curr.year]) acc[curr.year] = [];
    acc[curr.year].push(curr.semester);
    return acc;
  }, {});

  // Check if a semester is disabled based on current selections
  const isSemesterDisabled = (yearKey, semester) => {
    const selectedSemesters = state.bookingPeriods
      .filter((bp) => bp.year === yearKey)
      .map((bp) => bp.semester);
  
    // If selecting a new room, ignore past selections
    if (state.room.id !== room._id) return false;
  
    // Check if the semester is already selected (allow deselection)
    if (selectedSemesters.includes(semester)) return false;
  
    // Check if any selected semester conflicts with the one being checked
    return selectedSemesters.some((selected) =>
      semesterConflicts[selected]?.includes(semester)
    );
  };

  // Calculate price based on the selected semester
  const calculatePrice = (semester) => {
    switch (semester) {
      case "Full Year":
        return room.priceWinter + room.priceSummer; // Full Year = Winter + Summer
      case "Both Semesters":
        return room.priceWinter; // Both Semesters = Winter price
      case "1st Semester":
      case "2nd Semester":
        return room.priceWinter / 2; // Single Semester = Winter price / 2
      case "Summer":
        return room.priceSummer; // Summer = Summer price
      default:
        return 0;
    }
  };

  // Handle semester selection with conflict checking and dynamic pricing
  const handleSemesterClick = (yearKey, semester) => {
    if (isSemesterDisabled(yearKey, semester)) return;
  
    setState((prev) => {
      const isNewRoom = prev.room.id !== room._id;
      const updatedBookingPeriods = isNewRoom
        ? [{ year: yearKey, semester, price: calculatePrice(semester) }]
        : prev.bookingPeriods.some((bp) => bp.year === yearKey && bp.semester === semester)
        ? prev.bookingPeriods.filter((bp) => !(bp.year === yearKey && bp.semester === semester))
        : [...prev.bookingPeriods, { year: yearKey, semester, price: calculatePrice(semester) }];
  
      // Calculate total price
      const newTotalPrice = updatedBookingPeriods.reduce((sum, period) => sum + period.price, 0);
  
      return {
        ...initialState, // Reset to initial state
        room: {
          id: room._id,
          title: room.roomNumber,
          propertyTitle: room.property.propertyName,
        },
        bookingPeriods: updatedBookingPeriods,
        totalPrice: newTotalPrice, // Explicitly set total price
        services: isNewRoom ? [] : prev.services,
      };
    });
  };
  
  

  // Service selection handler
  const handleServiceClick = (service) => {
    setState((prev) => {
      const isNewRoom = prev.room.id !== room._id;
  
      return {
        ...initialState, // Reset to initial state if new room
        room: {
          id: room._id,
          title: room.roomNumber,
          propertyTitle: room.property.propertyName,
        },
        services: isNewRoom
          ? [service] // Start fresh with only the selected service
          : prev.services.includes(service)
          ? prev.services.filter((s) => s !== service)
          : [...prev.services, service],
        bookingPeriods: isNewRoom ? [] : prev.bookingPeriods, // Reset booking periods if new room
        totalPrice: isNewRoom ? 0 : prev.totalPrice, // Reset total price if new room
      };
    });
  };
  

  return (
    <div className={` ${ isReversed ? 'flex flex-col' : '' }bg-white rounded-lg shadow-md`}>
      {/* Room image and basic info */}
      <div>
      {room.imageUrl && (
        <img
          src={room.imageUrl}
          alt={`Room ${room.roomNumber}`}
          className="w-full h-48 object-cover"
        />
      )}
      </div>
      <div className="p-4">
        <div className="flex justify-between gap-10 items-center mb-4">
          <div>
            <h3 className="font-semibold">
              {room.property.propertyName}, Room {room.roomNumber}
            </h3>
            <p className="text-sm text-gray-500">
              {room.roomType} - ${room.priceWinter}/Both semester
            </p>
          </div>
          <Link className={`${room.slug === propertySlug ? 'hidden' : ''}`} href={`/rooms/${room.slug}`}>
            <button className="px-4 py-2 border rounded-full bg-gray-800 text-white hover:bg-gray-600">
              Book Now!
            </button>
          </Link>
        </div>

        {/* Availability section */}
        <details open={state.room.id === room._id} className="mb-3">
          <summary className="cursor-pointer font-medium">Availability</summary>
          <div className="mt-2 pl-4">
            {Object.keys(groupedByYear)
              .sort((a, b) => a.split("/")[0] - b.split("/")[0])
              .map((yearKey) => (
                <div key={yearKey} className="mb-3">
                  <h4 className="font-medium">{yearKey}</h4>
                  {groupedByYear[yearKey]
                    .sort((a, b) => 
                      ["1st Semester", "2nd Semester", "Summer"].indexOf(a) -
                      ["1st Semester", "2nd Semester", "Summer"].indexOf(b)
                    )
                    .map((semester) => {
                      const disabled = isSemesterDisabled(yearKey, semester);
                      return (
                        <label 
                          key={semester}
                          className={`flex items-center ${disabled ? "opacity-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={state.bookingPeriods.some(
                              (bp) => bp.year === yearKey && bp.semester === semester && state.room.id === room._id
                            )}
                            onChange={() => handleSemesterClick(yearKey, semester)}
                            disabled={disabled}
                            className="mr-2"
                          />
                          <span className={disabled ? "line-through" : ""}>
                            {semester} - ${calculatePrice(semester).toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                </div>
              ))}
          </div>
        </details>

        {/* Services section */}
        <details open={state.room.id === room._id} >
          <summary className="cursor-pointer font-medium">Services</summary>
          <div className="mt-2 pl-4">
            {(room.services || ["Weekly room cleaning"]).map((service) => (
              <label key={service} className="flex items-center">
                <input
                  type="checkbox"
                  checked={state.services.includes(service === "" ? "Weekly room cleaning" : service) && state.room.id === room._id}
                  onChange={() => handleServiceClick(service === "" ? "Weekly room cleaning" : service)}
                  className="mr-2"
                />
                {service === "" ? "Weekly room cleaning" : service}
              </label>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default RoomCard;
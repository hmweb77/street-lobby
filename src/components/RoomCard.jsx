import Link from "next/link";
import React, { useEffect, useState } from "react";
import { initialState, useBookingState } from "@/context/BookingContext";
import { useParams } from "next/navigation";

const semesterConflicts = {
  "1st Semester": ["Both Semesters", "Full Year"],
  "2nd Semester": ["Both Semesters", "Full Year"],
  "Both Semesters": ["1st Semester", "2nd Semester", "Full Year"],
  "Full Year": ["1st Semester", "2nd Semester", "Both Semesters", "Summer"],
  "Summer": ["Full Year"],
};

const RoomCard = ({ room, isReversed = false }) => {
  const params = useParams();
  const propertySlug = params.slug;
  const { 
    state: globalState, 
    setBooking, 
    removeBooking,
    getBooking,
    addServiceToBooking,
    removeServiceFromBooking
  } = useBookingState();
  
  // Local state management with room details
  const [localState, setLocalState] = useState({
    roomDetails: {
      id: "",
      title: "",
      propertyTitle: "",
      imageUrl: "",
      roomType: "",
      priceWinter: 0,
      priceSummer: 0
    },
    bookingPeriods: [],
    services: [],
    totalPrice: 0
  });

  // Initialize local state with room details
  useEffect(() => {
    const globalBooking = globalState.bookingPeriods.filter(bp => bp.roomId === room._id);
    const initialServices = globalBooking.flatMap(bp => bp.services);
    
    setLocalState({
      roomDetails: {
        id: room._id,
        title: room.roomNumber,
        propertyTitle: room.property?.propertyName,
        imageUrl: room.imageUrl,
        roomType: room.roomType,
        priceWinter: room.priceWinter,
        priceSummer: room.priceSummer
      },
      bookingPeriods: globalBooking,
      services: initialServices,
      totalPrice: globalBooking.reduce((sum, bp) => sum + bp.price, 0)
    });
  }, [room, globalState]);

  // Helper to get room details object
  const getRoomDetails = () => ({
    roomTitle: room.roomNumber,
    propertyTitle: room.property?.propertyName,
    imageUrl: room.imageUrl,
    roomType: room.roomType,
    priceWinter: room.priceWinter,
    priceSummer: room.priceSummer
  });

  const isSemesterDisabled = (yearKey, semester) => {
    const selectedSemesters = localState.bookingPeriods
      .filter((bp) => bp.year === yearKey)
      .map((bp) => bp.semester);

    if (selectedSemesters.includes(semester)) return false;

    return selectedSemesters.some((selected) =>
      semesterConflicts[selected]?.includes(semester)
    );
  };

  const calculatePrice = (semester) => {
    switch (semester) {
      case "Full Year": return room.priceWinter + room.priceSummer;
      case "Both Semesters": return room.priceWinter;
      case "1st Semester":
      case "2nd Semester": return room.priceWinter / 2;
      case "Summer": return room.priceSummer;
      default: return 0;
    }
  };

  const handleSemesterClick = (yearKey, semester) => {
    if (isSemesterDisabled(yearKey, semester)) return;

    setLocalState(prev => {
      const existingIndex = prev.bookingPeriods.findIndex(
        bp => bp.year === yearKey && bp.semester === semester
      );

      let updatedPeriods;
      if (existingIndex >= 0) {
        updatedPeriods = prev.bookingPeriods.filter((_, i) => i !== existingIndex);
      } else {
        updatedPeriods = [...prev.bookingPeriods, {
          ...getRoomDetails(),
          roomId: room._id,
          year: yearKey,
          semester,
          price: calculatePrice(semester)
        }];
      }

      return {
        ...prev,
        bookingPeriods: updatedPeriods,
        totalPrice: updatedPeriods.reduce((sum, p) => sum + p.price, 0)
      };
    });
  };

  const handleServiceClick = (service) => {
    setLocalState(prev => ({
      ...prev,
      services: prev.services.some(s => s.id === service.id)
        ? prev.services.filter(s => s.id !== service.id)
        : [...prev.services, { ...service, roomId: room._id }]
    }));
  };

  const handleIncludeBooking = () => {
    // Update global bookings with room details
    localState.bookingPeriods.forEach(bp => {
      setBooking(
        room._id,
        getRoomDetails(),
        bp.year,
        bp.semester,
        {
          ...bp,
          services: localState.services,
          price: calculatePrice(bp.semester)
        }
      );
    });

    // Sync services with room context
    localState.services.forEach(service => {
      localState.bookingPeriods.forEach(bp => {
        addServiceToBooking(
          room._id,
          bp.year,
          bp.semester,
          { ...service, roomId: room._id }
        );
      });
    });

    // Cleanup removed bookings
    const globalRoomBookings = globalState.bookingPeriods.filter(bp => bp.roomId === room._id);
    globalRoomBookings.forEach(globalBp => {
      if (!localState.bookingPeriods.some(localBp => 
        localBp.year === globalBp.year && 
        localBp.semester === globalBp.semester
      )) {
        removeBooking(room._id, globalBp.year, globalBp.semester);
      }
    });
  };

  // Group available semesters by academic year
  const groupedByYear = (room.availableSemesters || []).reduce((acc, curr) => {
    if (!acc[curr.year]) acc[curr.year] = [];
    acc[curr.year].push(curr.semester);
    return acc;
  }, {});

  return (
    <div className={`${isReversed ? 'flex flex-col' : ''} bg-white rounded-lg shadow-md`}>
      {/* Room image and basic info */}
      <div>
        {localState.roomDetails.imageUrl && (
          <img
            src={localState.roomDetails.imageUrl}
            alt={`Room ${localState.roomDetails.title}`}
            className="w-full h-48 object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between gap-10 items-center mb-4">
          <div>
            <h3 className="font-semibold">
              {localState.roomDetails.propertyTitle}, Room {localState.roomDetails.title}
            </h3>
            <p className="text-sm text-gray-500">
              {localState.roomDetails.roomType} - ${localState.roomDetails.priceWinter}/Both semester
            </p>
          </div>
          <button 
            onClick={handleIncludeBooking}
            className="px-4 py-2 border rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {localState.bookingPeriods.length > 0 ? "Update Booking" : "Include Booking"}
          </button>
        </div>

        {/* Availability section */}
        <details open={localState.roomDetails.id === room._id} className="mb-3">
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
                            checked={localState.bookingPeriods.some(
                              bp => bp.year === yearKey && bp.semester === semester
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
        <details open={localState.roomDetails.id === room._id}>
          <summary className="cursor-pointer font-medium">Services</summary>
          <div className="mt-2 pl-4">
            {(room.services || ["Weekly room cleaning"]).map((service) => (
              <label key={service.id || service} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localState.services.some(s => s.id === (service.id || service))}
                  onChange={() => handleServiceClick(typeof service === 'string' ? 
                    { id: service, name: service, price: 0 } : service
                  )}
                  className="mr-2"
                />
                {service.name || (service === "" ? "Weekly room cleaning" : service)}
              </label>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default RoomCard;
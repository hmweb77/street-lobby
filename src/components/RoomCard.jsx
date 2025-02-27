import React, { useEffect, useState } from "react";
import { useBookingState } from "@/context/BookingContext";
import { useParams } from "next/navigation";
import Link from "next/link";

const semesterConflicts = {
  "1st Semester": ["Both Semesters", "Full Year"],
  "2nd Semester": ["Both Semesters", "Full Year"],
  "Both Semesters": ["1st Semester", "2nd Semester", "Full Year"],
  "Full Year": ["1st Semester", "2nd Semester", "Both Semesters", "Summer"],
  Summer: ["Full Year"],
};

const RoomCard = ({ room, isReversed = false }) => {
  const params = useParams();
  const propertySlug = params.slug;

  console.log(room);
  const {
    state: globalState,
    setBooking,
    removeBooking,
    addServiceToBooking,
    removeServiceFromBooking,
  } = useBookingState();

  const [localState, setLocalState] = useState({
    roomDetails: {
      id: "",
      title: "",
      propertyTitle: "",
      imageUrl: "",
      roomType: "",
      priceWinter: 0,
      priceSummer: 0,
    },
    bookingPeriods: [],
    services: [],
    totalPrice: 0,
  });

  const [showIncludeButton, setShowIncludeButton] = useState(false);

  // Initialize local state
  useEffect(() => {
    const globalBooking = globalState.bookingPeriods.filter(
      (bp) => bp.roomId === room.id
    );
    const initialServices = globalBooking.flatMap((bp) => bp.services);

    setLocalState({
      roomDetails: {
        id: room.id,
        title: room.roomNumber,
        propertyTitle: room.propertyDetails?.propertyName,
        imageUrl: room.imageUrl,
        roomType: room.roomType,
        priceWinter: room.priceWinter,
        priceSummer: room.priceSummer,
      },
      bookingPeriods: globalBooking,
      services: initialServices,
      totalPrice: globalBooking.reduce((sum, bp) => sum + bp.price, 0),
    });
  }, [room, globalState]);

  // Detect changes between local and global state
  useEffect(() => {
    const globalBookingPeriods = globalState.bookingPeriods.filter(
      (bp) => bp.roomId === room.id
    );
    const globalServices = globalBookingPeriods.flatMap((bp) => bp.services);

    const bookingPeriodsMatch =
      localState.bookingPeriods.length === globalBookingPeriods.length &&
      localState.bookingPeriods.every((localBp) => {
        const globalBp = globalBookingPeriods.find(
          (gbp) =>
            gbp.year === localBp.year &&
            gbp.semester === localBp.semester &&
            gbp.price === localBp.price
        );
        return !!globalBp;
      });

    const servicesMatch =
      localState.services.length === globalServices.length &&
      localState.services.every((localSvc) =>
        globalServices.some((globalSvc) => globalSvc.id === localSvc.id)
      );

    setShowIncludeButton(!bookingPeriodsMatch || !servicesMatch);
  }, [localState, globalState, room.id]);

  const getRoomDetails = () => ({
    roomTitle: room.roomNumber,
    propertyTitle: room.propertyDetails?.propertyName,
    imageUrl: room.imageUrl,
    roomType: room.roomType,
    priceWinter: room.priceWinter,
    priceSummer: room.priceSummer,
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
      case "Full Year":
        return room.priceWinter + room.priceSummer;
      case "Both Semesters":
        return room.priceWinter;
      case "1st Semester":
      case "2nd Semester":
        return room.priceWinter / 2;
      case "Summer":
        return room.priceSummer;
      default:
        return 0;
    }
  };

  const handleSemesterClick = (yearKey, semester) => {
    if (isSemesterDisabled(yearKey, semester)) return;

    setLocalState((prev) => {
      const existingIndex = prev.bookingPeriods.findIndex(
        (bp) => bp.year === yearKey && bp.semester === semester
      );

      let updatedPeriods;
      if (existingIndex >= 0) {
        updatedPeriods = prev.bookingPeriods.filter(
          (_, i) => i !== existingIndex
        );
      } else {
        updatedPeriods = [
          ...prev.bookingPeriods,
          {
            ...getRoomDetails(),
            roomId: room.id,
            year: yearKey,
            semester,
            price: calculatePrice(semester),
          },
        ];
      }

      return {
        ...prev,
        bookingPeriods: updatedPeriods,
        totalPrice: updatedPeriods.reduce((sum, p) => sum + p.price, 0),
      };
    });
  };

  const handleServiceClick = (service) => {
    setLocalState((prev) => ({
      ...prev,
      services: prev.services.some((s) => s.id === service.id)
        ? prev.services.filter((s) => s.id !== service.id)
        : [...prev.services, { ...service, roomId: room.id }],
    }));
  };

  const handleIncludeBooking = () => {
    // Update global state
    localState.bookingPeriods.forEach((bp) => {
      setBooking(room.id, getRoomDetails(), bp.year, bp.semester, {
        ...bp,
        services: localState.services,
        price: calculatePrice(bp.semester),
      });
    });

    // Cleanup removed bookings
    const globalRoomBookings = globalState.bookingPeriods.filter(
      (bp) => bp.roomId === room.id
    );
    globalRoomBookings.forEach((globalBp) => {
      if (
        !localState.bookingPeriods.some(
          (localBp) =>
            localBp.year === globalBp.year &&
            localBp.semester === globalBp.semester
        )
      ) {
        removeBooking(room.id, globalBp.year, globalBp.semester);
      }
    });
  };

  const groupedByYear = (room.remainingSemesters || []).reduce((acc, curr) => {
    if (!acc[curr.year]) acc[curr.year] = [];
    acc[curr.year].push(curr.semester);
    return acc;
  }, {});

  return (
    <div
      className={`${isReversed ? "flex flex-col" : ""} bg-white rounded-lg shadow-md`}
    >
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
              {localState.roomDetails.propertyTitle}, Room{" "}
              {localState.roomDetails.title}
            </h3>
            <p className="text-sm text-gray-500">
              {localState.roomDetails.roomType} - $
              {localState.roomDetails.priceWinter}/Both semester
            </p>
          </div>
          <div className="flex h-20 flex-col gap-2">
            {!propertySlug && (
              <Link
                href={`/rooms/${room.slug.current}`}
                className="px-4 py-2 w-40 text-center rounded-full text-black border border-black hover:bg-black hover:text-white  transition-colors"
              >
                Details
              </Link>
            )}

            {showIncludeButton && (
              <button
                onClick={handleIncludeBooking}
                className="px-4 py-2 w-40 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Include Booking
              </button>
            )}
          </div>
        </div>

        <details open={localState.roomDetails.id === room.id} className="mb-3">
          <summary className="cursor-pointer font-medium">Availability</summary>
          <div className="mt-2 pl-4">
            {Object.keys(groupedByYear)
              .sort((a, b) => a.split("/")[0] - b.split("/")[0])
              .map((yearKey) => (
                <div key={yearKey} className="mb-3">
                  <h4 className="font-medium">{yearKey}</h4>
                  {groupedByYear[yearKey]
                    .sort(
                      (a, b) =>
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
                              (bp) =>
                                bp.year === yearKey && bp.semester === semester
                            )}
                            onChange={() =>
                              handleSemesterClick(yearKey, semester)
                            }
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

        <details open={localState.roomDetails.id === room.id}>
          <summary className="cursor-pointer font-medium">Services</summary>
          <div className="mt-2 pl-4">
            {(room.services || ["Weekly room cleaning"]).filter(service => (service !== "" || service !== null || service !== undefined )).map((service) => (
              <label key={service.id || service} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localState.services.some(
                    (s) => s.id === (service.id || service)
                  )}
                  onChange={() =>
                    handleServiceClick(
                      typeof service === "string"
                        ? { id: service, name: service, price: 0 }
                        : service
                    )
                  }
                  className="mr-2"
                />
                {service.name || service}
              </label>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

export default RoomCard;

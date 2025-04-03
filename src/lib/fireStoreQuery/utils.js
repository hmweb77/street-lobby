import { validateBookingDeadline } from "@/apiServices/bookings-services";

export const getRemainingAvailableSemesters = (
  room,
  prices,
  periodFiltered,
  year
) => {
  // 1. Validate periodFiltered as array with new summer months
  if (!Array.isArray(periodFiltered)) {
    periodFiltered = ["1st Semester", "2nd Semester", "July", "August"];
  }

  const { availableSemesters = [], bookedPeriods = [] } = room;
  const { minPrice, maxPrice } = prices || {};
  const min = minPrice !== undefined ? minPrice : 0;
  const max = maxPrice !== undefined ? maxPrice : Infinity;

  // Convert prices to numbers safely
  const priceSummer = Number(room.priceSummer) || 0;
  const priceWinter = Number(room.priceWinter) || 0;

  const filterSemester = (available) => {
    // 2. Match exact period names (including new summer months)
    const isPeriodFiltered = periodFiltered.includes(available.semester);

    // 3. Get correct price for period type
    const isSummerMonth = ["July", "August"].includes(available.semester);
    const semesterPrice = isSummerMonth ? priceSummer : priceWinter;

    // Price validation
    const priceValid = semesterPrice >= min && semesterPrice <= max;

    // Booking check
    const isBooked = bookedPeriods.some(
      (booked) =>
        booked.year === available.year && booked.semester === available.semester
    );

    const isDeadlineValid = validateBookingDeadline(available.year, available.semester);

    return isPeriodFiltered && priceValid && !isBooked && isDeadlineValid;
  };

  // Year filtering
  return availableSemesters.filter(
    (available) =>
      (!year || available.year === year) && filterSemester(available)
  );
};

// Updated price calculator for new summer months
export const calculatePrice = (roomData, semester) => {
  if (!semester) {
    return {
      priceWinter: roomData.priceWinter || 0,
      priceSummer: roomData.priceSummer || 0,
    };
  } else if (Array.isArray(semester)) {
    return semester.reduce((total, sem) => {
      return total + (["July", "August"].includes(sem) 
        ? (roomData.priceSummer || 0)
        : (roomData.priceWinter || 0));
    }, 0);
  } else {
    return ["July", "August"].includes(semester)
      ? (roomData.priceSummer || 0)
      : (roomData.priceWinter || 0);
  }
};

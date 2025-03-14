export const getRemainingAvailableSemesters = (
  room,
  prices,
  periodFiltered,
  year
) => {
  // 1. Validate periodFiltered as array
  if (!Array.isArray(periodFiltered) || periodFiltered.length === 0) {
    periodFiltered = ["1st Semester", "2nd Semester", "Summer"];
  }

  const { availableSemesters = [], bookedPeriods = [] } = room;
  const { minPrice, maxPrice } = prices || {};
  const min = minPrice !== undefined ? minPrice : 0;
  const max = maxPrice !== undefined ? maxPrice : Infinity;

  // Convert prices to numbers safely
  const priceSummer = Number(room.priceSummer) || 0;
  const priceWinter = Number(room.priceWinter) || 0;

  const filterSemester = (available) => {
    // 2. Match exact semester names
    const isPeriodFiltered = periodFiltered.includes(available.semester);

    // 3. Get correct price for semester type
    const semesterPrice =
      available.semester === "Summer" ? priceSummer : priceWinter;

    // Price validation
    const priceValid = semesterPrice >= min && semesterPrice <= max;

    // Booking check
    const isBooked = bookedPeriods.some(
      (booked) =>
        booked.year === available.year && booked.semester === available.semester
    );

    return isPeriodFiltered && priceValid && !isBooked;
  };

  // Year filtering
  return availableSemesters.filter(
    (available) =>
      (!year || available.year === year) && filterSemester(available)
  );
};

// Helper function to calculate price based on semester(s)
export const calculatePrice = (roomData, semester) => {
  if (!semester) {
    // If no semester is provided, return both prices
    return {
      priceWinter: roomData.priceWinter || 0,
      priceSummer: roomData.priceSummer || 0,
    };
  } else if (Array.isArray(semester)) {
    // If semester is an array, calculate the total price for all semesters
    const totalPrice = semester.reduce((total, sem) => {
      if (sem === "Summer") {
        return total + (roomData.priceSummer || 0);
      } else {
        return total + (roomData.priceWinter || 0);
      }
    }, 0);
    return totalPrice;
  } else {
    // If semester is a single value, return the price for that semester
    if (semester === "Summer") {
      return roomData.priceSummer || 0;
    } else {
      return roomData.priceWinter || 0;
    }
  }
};

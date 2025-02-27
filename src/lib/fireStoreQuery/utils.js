export const getRemainingAvailableSemesters = (room, year) => {
  const { availableSemesters = [], bookedPeriods = [] } = room;

  // 1. Handle case where year is NOT provided
  if (!year) {
    // Return all available semesters that aren't booked in THEIR OWN YEAR
    return availableSemesters.filter((available) => {
      return !bookedPeriods.some(
        (booked) =>
          booked.year === available.year && // Match the available semester's year
          booked.semester === available.semester
      );
    });
  }

  // 2. Handle case where year IS provided
  const availableForYear = availableSemesters.filter(
    (available) => available.year === year
  );

  const bookedForYear = bookedPeriods.filter((booked) => booked.year === year);

  return availableForYear.filter((available) => {
    return !bookedForYear.some(
      (booked) => booked.semester === available.semester
    );
  });
};

// Helper function to calculate price based on semester(s)
export  const calculatePrice = (roomData, semester) => {
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

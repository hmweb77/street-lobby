export function validateBookingPeriods(bookedPeriods) {
  const errors = [];
  const yearMap = new Map();

  bookedPeriods.forEach((period) => {
    const { semester, year } = period;
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        fullYear: false,
        bothSemesters: false,
        semesters: new Set(),
      });
    }
    const yearData = yearMap.get(year);

    if (semester === "Full Year") {
      if (yearData.fullYear || yearData.bothSemesters || yearData.semesters.size > 0) {
        errors.push(
          `Conflict detected: "Full Year" cannot be booked with other semesters or "Both Semesters" in ${year}.`
        );
      }
      yearData.fullYear = true;
    } else if (semester === "Both Semesters") {
      if (yearData.bothSemesters || yearData.fullYear) {
        errors.push(
          `Conflict detected: "Both Semesters" cannot be booked with "Full Year" or another "Both Semesters" in ${year}.`
        );
      }
      if (yearData.semesters.has("1st Semester") || yearData.semesters.has("2nd Semester")) {
        errors.push(
          `Conflict detected: "Both Semesters" cannot be booked with "1st Semester" or "2nd Semester" in ${year}.`
        );
      }
      yearData.bothSemesters = true;
    } else {
      if (yearData.fullYear) {
        errors.push(
          `Conflict detected: "${semester}" cannot be booked because "Full Year" is already booked in ${year}.`
        );
      }
      if (yearData.bothSemesters && ["1st Semester", "2nd Semester"].includes(semester)) {
        errors.push(
          `Conflict detected: "${semester}" cannot be booked because "Both Semesters" is already booked in ${year}.`
        );
      }
      if (yearData.semesters.has(semester)) {
        errors.push(
          `Conflict detected: "${semester}" has already been booked for ${year}.`
        );
      }
      yearData.semesters.add(semester);
    }
  });

  return errors;
}
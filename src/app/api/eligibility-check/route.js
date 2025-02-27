import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";

export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingPeriods } = body;

    if (!bookingPeriods || bookingPeriods.length === 0) {
      return NextResponse.json(
        { message: "Missing booking periods" },
        { status: 400 }
      );
    }

    // Group proposed periods by room ID
    const proposedPeriodsByRoom = new Map();
    for (const period of bookingPeriods) {
      const roomId = period.roomId;
      if (!proposedPeriodsByRoom.has(roomId)) {
        proposedPeriodsByRoom.set(roomId, []);
      }
      proposedPeriodsByRoom.get(roomId).push({
        semester: period.semester,
        year: period.year
      });
    }

    const validationErrors = [];

    // Validate each room's availability
    for (const [roomId, proposedPeriods] of proposedPeriodsByRoom) {
      // Get existing booked periods from Sanity
      const roomData = await sanityAdminClient.getDocument(roomId);
      if (!roomData) {
        validationErrors.push(`Room ${roomId} not found`);
        continue;
      }

      const existingPeriods = roomData.bookedPeriods || [];
      
      // Create combined periods list (existing + proposed)
      const combinedPeriods = [
        ...existingPeriods,
        ...proposedPeriods.map(p => ({
          ...p,
          _key: `temp_${Math.random().toString(36).substr(2, 9)}` // Temporary key for validation
        }))
      ];

      // Validate combined periods
      const errors = validateBookingPeriods(combinedPeriods);
      if (errors.length > 0) {
        validationErrors.push(`Room ${roomId}: ${errors.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          message: "Booking conflicts detected",
          errors: validationErrors,
          eligible: false
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: "No conflicts detected", 
        eligible: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error checking eligibility:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Reuse the existing validation function
function validateBookingPeriods(bookedPeriods) {
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
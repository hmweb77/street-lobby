import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import { deleteAddedDocs, getValidProposedPeriods, storeProposedPeriodsBatch } from "@/utils/proposedBookingPeriods";

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

    const proposedBookedPeriods = await getValidProposedPeriods();
    const addedDocsIds = [];
    const validationErrors = [];

    const existingPeriodKeys = new Set(
      proposedBookedPeriods.map(
        (period) => `${period.roomId}_${period.semester}_${period.year}`
      )
    );

    const proposedPeriodsByRoom = new Map();

    for (const period of bookingPeriods) {
      const roomId = period.roomId;
      const docId = `${roomId}_${period.semester}_${period.year}`;

      if (existingPeriodKeys.has(docId)) {
        validationErrors.push(
          `Room ${roomId} is already booked for Period ${period.semester}, Year ${period.year}`
        );
        continue;
      }

      addedDocsIds.push({docId , roomId, semester: period.semester, year: period.year });

      if (!proposedPeriodsByRoom.has(roomId)) {
        proposedPeriodsByRoom.set(roomId, []);
      }
      proposedPeriodsByRoom.get(roomId).push({
        semester: period.semester,
        year: period.year,
      });
    }

    for (const [roomId, proposedPeriods] of proposedPeriodsByRoom) {
      const roomData = await sanityAdminClient.getDocument(roomId);
      if (!roomData) {
        validationErrors.push(`Room ${roomId} not found`);
        continue;
      }

      const existingPeriods = roomData.bookedPeriods || [];

      const combinedPeriods = [
        ...existingPeriods,
        ...proposedPeriods.map((p) => ({
          ...p,
          _key: `temp_${Math.random().toString(36).substr(2, 9)}`,
        })),
      ];

      const errors = validateBookingPeriods(combinedPeriods);
      if (errors.length > 0) {
        validationErrors.push(`Room ${roomId}: ${errors.join(", ")}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          message: "Booking conflicts detected",
          errors: validationErrors,
          eligible: false,
        },
        { status: 400 }
      );
    }

    await storeProposedPeriodsBatch(addedDocsIds);

    return NextResponse.json(
      {
        message: "No conflicts detected",
        eligible: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error checking eligibility:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function validateBookingPeriods(bookedPeriods) {
  const errors = [];
  const yearMap = new Map();

  bookedPeriods.forEach((period) => {
    const { semester, year } = period;
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        fullYear: false,
        bothSemesters: false,
        periods: new Set(),
      });
    }
    const yearData = yearMap.get(year);

    if (semester === "Full Year") {
      if (
        yearData.fullYear ||
        yearData.bothSemesters ||
        yearData.periods.size > 0
      ) {
        errors.push(
          `Conflict detected: "Full Year" cannot be booked with other periods in ${year}.`
        );
      }
      yearData.fullYear = true;
    } else if (semester === "Both Semesters") {
      if (yearData.bothSemesters || yearData.fullYear) {
        errors.push(
          `Conflict detected: "Both Semesters" cannot be booked with "Full Year" in ${year}.`
        );
      }
      if (
        yearData.periods.has("1st Semester") ||
        yearData.periods.has("2nd Semester")
      ) {
        errors.push(
          `Conflict detected: "Both Semesters" cannot be booked with individual semesters in ${year}.`
        );
      }
      yearData.bothSemesters = true;
    } else {
      if (yearData.fullYear) {
        errors.push(
          `Conflict detected: "${semester}" cannot be booked because "Full Year" is already booked in ${year}.`
        );
      }
      if (
        yearData.bothSemesters &&
        ["1st Semester", "2nd Semester"].includes(semester)
      ) {
        errors.push(
          `Conflict detected: "${semester}" cannot be booked because "Both Semesters" is already booked in ${year}.`
        );
      }
      if (yearData.periods.has(semester)) {
        errors.push(
          `Conflict detected: "${semester}" period has already been booked for ${year}.`
        );
      }
      yearData.periods.add(semester);
    }
  });

  return errors;
}
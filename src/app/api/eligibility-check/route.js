import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import {
  deleteAddedDocs,
  getValidProposedPeriods,
  storeProposedPeriodsBatch,
} from "@/utils/proposedBookingPeriods";
import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
import { sendEmail, sendEmailWithAttachment } from "@/emailSendingService/emailSender";
import { headers } from "next/headers";
import path from 'path';



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

    console.log(bookingPeriods);

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
      if (!period.roomId || !period.semester || !period.year) {
        validationErrors.push("Missing required fields");
        continue;
      }
      if (!period.userDetails) {
        validationErrors.push("Missing user details");
        continue;
      }
      if (!period.userDetails.email) {
        validationErrors.push("Missing user email");
        continue;
      }
      if (!period.userDetails.name) {
        validationErrors.push("Missing user name");
        continue;
      }

      const userAge = Number.parseInt(period.userDetails.age);
      if (isNaN(userAge)) validationErrors.push("Missing user age");
      if (userAge < 20) validationErrors.push("User age must be at least 20");
      if (userAge > 40) validationErrors.push("User age must be at most 40");

      const roomId = period.roomId;
      const docId = `${roomId}_${period.semester}_${period.year}`;

      if (existingPeriodKeys.has(docId)) {
        validationErrors.push(
          `Room ${roomId} is already booked for Period ${period.semester}, Year ${period.year}`
        );
        continue;
      }

      addedDocsIds.push({
        docId,
        roomId,
        semester: period.semester,
        year: period.year,
      });

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

    generateBookingPeriodsExcel({ bookingPeriods, eligible: validationErrors.length === 0 });

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


export async function generateBookingPeriodsExcel({
  bookingPeriods,
  eligible,
}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Booking Periods");

  worksheet.columns = [
    { header: "Room ID", key: "roomId", width: 15 },
    { header: "Property Title", key: "propertyTitle", width: 20 },
    { header: "Room Title", key: "roomTitle", width: 20 },
    { header: "Semester", key: "semester", width: 15 },
    { header: "Year", key: "year", width: 10 },
    { header: "Price (€)", key: "price", width: 12 },
    { header: "Full Name", key: "name", width: 20 },
    { header: "Email", key: "email", width: 25 },
    { header: "Age", key: "age", width: 10 },
    { header: "Genre", key: "genre", width: 12 },
    { header: "Permanent Address", key: "permanentAddress", width: 25 },
    { header: "Nationality", key: "nationality", width: 20 },
    { header: "ID Number", key: "idNumber", width: 20 },
    { header: "Current Profession", key: "currentProfession", width: 25 },
    { headers: "Date And Time", key: "dateAndTime", width: 25 },
  ];

  for (const period of bookingPeriods) {
    console.log(period);
    const user = period.userDetails || {};
    worksheet.addRow({
      roomId: period.roomId,
      propertyTitle: period.propertyTitle,
      roomTitle: period.roomTitle,
      semester: period.semester,
      year: period.year,
      price: period.price?.toFixed?.(2) || "",
      name: user.name || "",
      email: user.email || "",
      age: user.age || "",
      genre: user.genre || "",
      permanentAddress: user.permanentAddress || "",
      nationality: user.nationality || "",
      idNumber: user.idNumber || "",
      currentProfession: user.currentProfession || "",
      dateAndTime: new Date().toISOString(),
    });
  }

  // Append status
  worksheet.addRow([]);
  worksheet.addRow(["Status", eligible ? "Eligible" : "Not Eligible"]);

  const fileName = `booking-periods-${uuidv4()}.xlsx`;

  // Generate Excel file in memory
  const buffer = await workbook.xlsx.writeBuffer();

  // Convert buffer to base64 for email attachment
  const base64File = buffer.toString('base64');


  await sendEmailWithAttachment({
    to: process.env.BREVO_OWNER_SENDER_EMAIL,
    subject: `Booking Periods Report ${new Date().toISOString()}`,
    htmlContent: "<p>Here is the booking periods report.</p>",
    attachments: [
      {
        base64Content: base64File,
        name: "booking-periods.xlsx",
      },
    ],
  });
  console.log("Email sent successfully to " + process.env.BREVO_OWNER_SENDER_EMAIL);
}


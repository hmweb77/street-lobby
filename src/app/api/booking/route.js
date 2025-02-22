import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
const { v4: uuidv4 } = require("uuid");

export async function POST(req) {
  try {
    const body = await req.json();
    const { roomId, userDetails, bookingPeriods, totalPrice, services } = body;

    if (!roomId || !userDetails || !bookingPeriods || !totalPrice) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const existingUsers = await sanityAdminClient.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: userDetails.email }
    );

    let userId;
    if (!existingUsers) {
      const newUser = {
        _type: "user",
        name: userDetails.name,
        age: Number(userDetails.age) ?? 18,
        genre: userDetails.genre,
        email: userDetails.email,
        permanentAddress: userDetails.permanentAddress,
        nationality: userDetails.nationality,
        idNumber: userDetails.idNumber,
        currentProfession: userDetails.currentProfession,
        currentLocation: userDetails.currentLocation,
      };
      const createdUser = await sanityAdminClient.create(newUser);
      userId = createdUser._id;
    } else {
      userId = existingUsers._id;
      const updates = {};
      [
        "name",
        "age",
        "genre",
        "permanentAddress",
        "nationality",
        "idNumber",
        "currentProfession",
        "currentLocation",
      ].forEach((field) => {
        if (existingUsers[field] !== userDetails[field]) {
          updates[field] = userDetails[field];
        }
      });

      if (Object.keys(updates).length > 0) {
        await sanityAdminClient.patch(userId).set(updates).commit();
      }
    }

    const roomData = await sanityAdminClient.getDocument(roomId);
    let updatedBookedPeriods = roomData.bookedPeriods || [];
    
    const bookingData = {
      _type: "booking",
      room: { _type: "reference", _ref: roomId },
      user: { _type: "reference", _ref: userId },
      bookedPeriod: bookingPeriods.map((period) => ({
        _key: uuidv4(),
        semester: period.semester,
        price: period.price,
        year: period.year,
        services: services?.toString() || "",
      })),
      bookingDate: new Date().toISOString(),
      status: "pending",
      totalPrice,
      notes: "",
    };

    const response = await sanityAdminClient.create(bookingData);
    
    const newPeriods = bookingPeriods.map((period) => ({
      _key: `${response._id}__^^__${uuidv4()}`,
      semester: period.semester,
      year: period.year,
      services: period.services || "",
    }));

    const allBookedPeriods = [...updatedBookedPeriods, ...newPeriods];

    const errors = validateBookingPeriods(allBookedPeriods);
    if (errors.length > 0) {
      await sanityAdminClient.delete(response._id);
      return NextResponse.json({ message: errors.join(" ") }, { status: 400 });
    }

    await sanityAdminClient.patch(roomId).set({ bookedPeriods: allBookedPeriods }).commit();

    return NextResponse.json({ message: "Booking successful", data: response }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
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

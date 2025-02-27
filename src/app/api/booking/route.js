import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
const { v4: uuidv4 } = require("uuid");
import { adminAccessDb as db } from '@/lib/firebase-admin'

export async function POST(req) {
  try {
    const bookingTrackerId = uuidv4();
    const body = await req.json();
    const {
      bookingPeriods,
      commonUserDetails,
      useCommonDetails,
      totalPrice,
      paymentMethod,
      paymentStatus
    } = body;

    console.log(JSON.stringify(body));

    if (!bookingPeriods || bookingPeriods.length <= 0 || !commonUserDetails || totalPrice === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Process common user (used for all periods if useCommonDetails is true)
    let commonUser;
    if (useCommonDetails) {
      const existingUser = await sanityAdminClient.fetch(
        `*[_type == "user" && email == $email][0]`,
        { email: commonUserDetails.email }
      );

      if (!existingUser) {
        const newUser = {
          _type: "user",
          ...commonUserDetails,
          age: Number(commonUserDetails.age) || 18
        };
        commonUser = await sanityAdminClient.create(newUser);
      } else {
        commonUser = existingUser;
        const updates = {};
        [
          "name", "age", "genre", "permanentAddress",
          "nationality", "idNumber", "currentProfession", "currentLocation"
        ].forEach(field => {
          if (existingUser[field] !== commonUserDetails[field]) {
            updates[field] = commonUserDetails[field];
          }
        });
        if (Object.keys(updates).length > 0) {
          await sanityAdminClient.patch(commonUser._id).set(updates).commit();
        }
      }
    }

    const processedUsers = new Map();
    const roomUpdatesMap = new Map();
    const bookedPeriods = [];

    // Process all booking periods
    for (const period of bookingPeriods) {
      let userRef;
      
      if (useCommonDetails) {
        userRef = commonUser._id;
      } else {
        // Process individual user for each period
        const userDetails = period.userDetails;
        let user;

        if (processedUsers.has(userDetails.email)) {
          user = processedUsers.get(userDetails.email);
        } else {
          const existingUser = await sanityAdminClient.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email: userDetails.email }
          );

          if (!existingUser) {
            const newUser = {
              _type: "user",
              ...userDetails,
              age: Number(userDetails.age) || 18
            };
            user = await sanityAdminClient.create(newUser);
          } else {
            user = existingUser;
            const updates = {};
            [
              "name", "age", "genre", "permanentAddress",
              "nationality", "idNumber", "currentProfession", "currentLocation"
            ].forEach(field => {
              if (existingUser[field] !== userDetails[field]) {
                updates[field] = userDetails[field];
              }
            });
            if (Object.keys(updates).length > 0) {
              await sanityAdminClient.patch(user._id).set(updates).commit();
            }
          }
          processedUsers.set(userDetails.email, user);
        }
        userRef = user._id;
      }

      console.log("Here!");

      // Prepare booked period data
      const periodKey = uuidv4();
      bookedPeriods.push({
        _key: periodKey,
        user: { _type: "reference", _ref: userRef },
        room: { _type: "reference", _ref: period.roomId },
        semester: period.semester,
        price: period.price,
        year: period.year,
        services: period.services?.join(',') || ""
      });

      // Track room updates
      const roomId = period.roomId;
      if (!roomUpdatesMap.has(roomId)) {
        const roomData = await sanityAdminClient.getDocument(roomId);
        roomUpdatesMap.set(roomId, {
          currentPeriods: roomData.bookedPeriods || [],
          newPeriods: []
        });
      }

      roomUpdatesMap.get(roomId).newPeriods.push({
        _key: `${bookingTrackerId}__^^__${periodKey}`,
        semester: period.semester,
        year: period.year,
        services: period.services?.join(',') || ""
      });
    }

    // Validate room availability for all rooms
    const validationErrors = [];
    for (const [roomId, { currentPeriods, newPeriods }] of roomUpdatesMap) {
      const updatedPeriods = [...currentPeriods, ...newPeriods];
      const errors = validateBookingPeriods(updatedPeriods);
      if (errors.length > 0) {
        validationErrors.push(`Room ${roomId}: ${errors.join(' ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { message: validationErrors.join('; ') },
        { status: 400 }
      );
    }

    // Create single booking document
    const bookingData = {
      tracker : bookingTrackerId, 
      _type: "booking",
      bookedPeriod: bookedPeriods,
      bookingDate: new Date().toISOString(),
      status: "pending",
      totalPrice,
      paymentMethod,
      paymentStatus: paymentStatus || "pending",
      notes: ""
    };

    const createdBooking = await sanityAdminClient.create(bookingData);

    // Update rooms with new periods
    for (const [roomId, { currentPeriods, newPeriods }] of roomUpdatesMap) {
      const updatedPeriods = [...currentPeriods, ...newPeriods];
      
      await sanityAdminClient.patch(roomId)
        .set({ bookedPeriods: updatedPeriods })
        .commit();

      await db.collection("room")
        .doc(roomId)
        .set({ bookedPeriods: updatedPeriods }, { merge: true });
    }


    return NextResponse.json(
      { message: "Booking successful", data: { bookingId: createdBooking._id } },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Keep the existing validateBookingPeriods function
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
import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
const { v4: uuidv4 } = require("uuid");
import { adminAccessDb as db } from '@/lib/firebase-admin'
import { validateBookingPeriods } from "@/utils/validation";

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


      // Prepare booked period data
      const periodKey = uuidv4();
      bookedPeriods.push({
        _key: periodKey,
        user: { _type: "reference", _ref: userRef },
        room: { _type: "reference", _ref: period.roomId },
        semester: period.semester,
        price: period.price,
        year: period.year,
        services: JSON.stringify(
          Array.isArray(period?.services)
            ? period.services.every(item => typeof item === "object" && item !== null)
              ? period.services.map(item => item?.name).join(", ")
              : period.services.join(", ")
            : period?.services
        ),
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
        services: JSON.stringify(
          Array.isArray(period?.services)
            ? period.services.every(item => typeof item === "object" && item !== null)
              ? period.services.map(item => item?.name).join(", ")
              : period.services.join(", ")
            : period?.services
        ),
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

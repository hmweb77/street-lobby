import { sanityAdminClient } from "@/lib/sanityAdmin";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
const { v4: uuidv4 } = require("uuid");
import { adminAccessDb as db } from '@/lib/firebase-admin'

export async function POST(req) {
  try {
    // Handle CORS headers
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Verify Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Missing token" },
        { status: 403, headers }
      );
    }

    // Verify JWT
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, process.env.SIGNATURE_KEY);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 403, headers }
      );
    }

    const operation = req.headers.get("sanity-operation");

    const sanityProjectId = req.headers.get("sanity-project-id");
    if (sanityProjectId !== process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      return NextResponse.json(
        { error: "Unauthorized project/dataset" },
        { status: 403, headers }
      );
    }

    // Process booking data
    const booking = await req.json();
    const { bookedPeriod, status, _id, tracker, cancellationKey } = booking;

    if (_id.includes("draft")) {
      return NextResponse.json(
        { error: "Make to a published booking" },
        { status: 200, headers }
      );
    }

    // Validate booked periods
    if (!booking || !bookedPeriod || !bookedPeriod.length) {
      return NextResponse.json(
        { error: "Invalid booking data" },
        { status: 400, headers }
      );
    }

    // Get unique room IDs from all booked periods
    const roomIds = Array.from(new Set(
      bookedPeriod.map(period => period.room?._ref).filter(Boolean)
    ));

    if (roomIds.length === 0) {
      return NextResponse.json(
        { error: "No valid room references found" },
        { status: 400, headers }
      );
    }

    // Handle cancellation/deletion
    if (status === "cancelled" || operation === "delete") {
      // Process each room in booked periods
      for (const roomId of roomIds) {
        const roomData = await sanityAdminClient.getDocument(roomId);
        if (!roomData) {
          console.error(`Room ${roomId} not found`);
          continue;
        }

        // Filter out periods linked to this booking
        let updatedBookedPeriods = (roomData.bookedPeriods || []).filter(
          period => period._key.split("__^^__")[0] !== tracker
        );

        // Update Sanity
        await sanityAdminClient
          .patch(roomId)
          .set({ bookedPeriods: updatedBookedPeriods })
          .commit();

        // Update Firestore
        await db.collection("room").doc(roomId).set(
          { bookedPeriods: updatedBookedPeriods }, 
          { merge: true }
        );
      }

      // Update cancellation key if needed
      if (status === "cancelled" && !cancellationKey?.startsWith("cancelled+")) {
        await sanityAdminClient
          .patch(_id)
          .set({ cancellationKey: `cancelled+${uuidv4()}` })
          .commit();
      }
    }

    return NextResponse.json(
      { message: "Rooms updated successfully" },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Booking Update Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

import { sanityAdminClient } from "@/lib/sanityAdmin";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
const { v4: uuidv4 } = require("uuid");
import { adminAccessDb as db } from '@/lib/firebase-admin'
import { cancelSubscriptionImmediately } from "../stripe-webhook/route";

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
    const { semester, year, status, _id, cancellationKey , paymentMethod   } = booking;


    // Validate required fields
    if (!semester || !year) {
      return NextResponse.json(
        { error: "Missing semester or year in booking data" },
        { status: 400, headers }
      );
    }

    // Get room reference from booking
    const roomId = booking.room?._ref;
    if (!roomId) {
      return NextResponse.json(
        { error: "No valid room reference found" },
        { status: 400, headers }
      );
    }

    // Handle cancellation/deletion
    if (status === "cancelled" || operation === "delete") {
      const roomData = await sanityAdminClient.getDocument(roomId);
      if (!roomData) {
        return NextResponse.json(
          { error: "Room not found" },
          { status: 404, headers }
        );
      }

      if(paymentMethod == "Stripe") {
        cancelSubscriptionImmediately(_id);
      }

      if(paymentMethod == "PayPal") {
        const paymentInfo = await getPaypalPaymentInfoByBookingId(_id);
        if (paymentInfo) {
          await cancelPaypalSubscription(paymentInfo.subscriptionId, "cancelled by admin dashboard");
        }
      }

      // Filter out periods matching the semester and year
      const updatedBookedPeriods = (roomData.bookedPeriods || []).filter(
        period => !(period.semester === semester && period.year === year)
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

      // Update cancellation key if needed
      if (status === "cancelled" && !cancellationKey?.startsWith("cancelled+")) {
        await sanityAdminClient
          .patch(_id)
          .set({ cancellationKey: `cancelled+${uuidv4()}` })
          .commit();
      }
    }

    return NextResponse.json(
      { message: "Room updated successfully" },
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




import fetch from 'node-fetch';
import { getPaypalPaymentInfoByBookingId } from "@/utils/StorePaypalPaymentsInfo";

export async function getPaypalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    try {
        const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error_description || 'Failed to fetch access token');

        return data.access_token;
    } catch (error) {
        console.error('Error getting PayPal access token:', error.message);
        throw error;
    }
}

export async function cancelPaypalSubscription(subscriptionId, reason = '') {
    const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    try {
        const accessToken = await getPaypalAccessToken();
        const cancelUrl = `${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`;

        const response = await fetch(cancelUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reason: reason,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error canceling subscription');
        }

        console.log(`Subscription ${subscriptionId} canceled successfully.`);
        return { success: true, message: 'Subscription canceled successfully' };
    } catch (error) {
        console.error(`Error canceling subscription ${subscriptionId}:`, error.message);
        return { success: false, message: error.message };
    }
}


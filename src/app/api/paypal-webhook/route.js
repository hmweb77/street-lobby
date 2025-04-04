import { NextRequest, NextResponse } from "next/server";
import * as paypal from "@paypal/checkout-server-sdk";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import { v4 as uuidv4 } from "uuid";
import { adminAccessDb as db } from "@/lib/firebase-admin";

import {
  addFieldsToPaypalPaymentInfo,
  getPaypalPaymentInfoById,
} from "@/utils/StorePaypalPaymentsInfo";
import { generateCancellationKey } from "../stripe-webhook/route";
import {
  createPaymentCompletedEmail,
  createPaymentFailedEmail,
  createSubscriptionActivatedEmail,
} from "@/emailSendingService/paypalEmail";
import { sendEmail } from "@/emailSendingService/emailSender";

// Initialize PayPal client
const createPayPalClient = () => {
  const environment =
    process.env.PAYPAL_ENVIRONMENT === "live"
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );

  return new paypal.core.PayPalHttpClient(environment);
};

export async function POST(req) {
  const rawBody = await req.text();

  try {
    const body = JSON.parse(rawBody);
    console.log("Received PayPal event:", body.event_type);
    console.log(body.resource);

    // Route events to appropriate handlers
    switch (body.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        const paymentInfoId = body.resource.custom_id;
        const paymentInfo = await getPaypalPaymentInfoById(paymentInfoId);
        const bookingId = await createBooking(paymentInfo);

        console.log(paymentInfo);
        addBookingToRoom(paymentInfo.roomId, {
          semester: paymentInfo.semester,
          year: paymentInfo.year,
          services: paymentInfo.services,
        });

        addFieldsToPaypalPaymentInfo(paymentInfoId, {
          subscriptionId: body.resource.id,
          bookingId: bookingId,
          cancelUrl: body.resource.links.filter(
            (link) => link.rel === "cancel"
          )[0].href,
        });

        const activationEmailHtml = createSubscriptionActivatedEmail({
          userName: paymentInfo.name,
          roomDetails: paymentInfo.roomTitle,
          paymentDetails: paymentInfo,
        });

        sendEmail({
          to: paymentInfo.email,
          subject: "Subscription Activated",
          htmlContent: activationEmailHtml,
          params: {
            userName: paymentInfo.name,
            roomName: paymentInfo.roomTitle,
            amount: paymentInfo.amount,
          },
        });

        sendEmail({
          to: process.env.BREVO_OWNER_SENDER_EMAIL,
          subject: "Subscription Activated",
          htmlContent: activationEmailHtml,
          params: {
            userName: paymentInfo.name,
            roomName: paymentInfo.roomTitle,
            amount: paymentInfo.amount,
          },
        });

        break;
      // case "PAYMENT.SALE.PENDING":
      case "PAYMENT.SALE.COMPLETED":
        if (body.resource.billing_agreement_id) {
          const subscription = await getSubscriptionDetails(
            body.resource.billing_agreement_id
          );
          await handleSubscriptionPayment(subscription?.custom_id);
        }

        break;

      case "PAYMENTS.PAYMENT.CREATED":
        // await handlePaymentCreated(body.resource);
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        // await handleCaptureCompleted(body.resource);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        // await handleSubscriptionCancelled(body.resource);
        break;

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.FAILED": {
        if (body.resource.billing_agreement_id) {
          const subscription = await getSubscriptionDetails(
            body.resource.billing_agreement_id
          );
          const paymentDetails = await getPaypalPaymentInfoById(
            subscription.custom_id
          );

          // Get renew approval link
          const renewLink = subscription.links.find(
            (link) => link.rel === "approve"
          )?.href;

          if (renewLink) {
            const failedEmailHtml = createPaymentFailedEmail({
              userName: paymentDetails.name,
              amount: parseFloat(body.resource.amount.total) * 100,
              description: `Payment for ${paymentDetails.roomTitle}`,
              renewUrl: renewLink,
            });

            sendEmail({
              to: paymentDetails.email,
              subject: "Payment Failed - Action Required",
              htmlContent: failedEmailHtml,
              params: {
                userName: paymentDetails.name,
                amount: body.resource.amount.total,
                renewUrl: renewLink,
              },
            });

            sendEmail({
              to: process.env.BREVO_OWNER_SENDER_EMAIL,
              subject: "Payment Failed - Action Required",
              htmlContent: failedEmailHtml,
              params: {
                userName: paymentDetails.name,
                amount: body.resource.amount.total,
                renewUrl: renewLink,
              },
            });

            // Update payment info with new renew link
            await addFieldsToPaypalPaymentInfo(subscription.custom_id, {
              renewUrl: renewLink,
              lastFailure: new Date().toISOString(),
            });
          }
        }
        break;
      }
      default:
        console.warn("Unhandled event type:", body.event_type);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

const handleSubscriptionPayment = async (custom_id) => {
  const paymentId = custom_id;
  const paymentDetails = await getPaypalPaymentInfoById(paymentId);
  if (paymentDetails.semester !== "July" || paymentDetails.semester !== "August") {
    const bookingId = paymentDetails.bookingId;
    const roomId = paymentDetails.roomId;
    await updateSemesterPayment(bookingId, paymentDetails.semester, new Date());
  }

  const paymentEmailHtml = createPaymentCompletedEmail({
    userName: paymentDetails.bookedForUser.name,
    amount: parseFloat(body.resource.amount.total) * 100,
    paymentDate: body.resource.create_time,
    description: `Monthly payment for ${paymentDetails.room.name}`,
  });

  sendEmail({
    to: paymentDetails.bookedForUser.email,
    subject: "Payment Processed",
    htmlContent: paymentEmailHtml,
    params: {
      userName: paymentDetails.bookedForUser.name,
      amount: body.resource.amount.total,
      date: new Date(body.resource.create_time).toLocaleDateString(),
    },
  });
};

export async function addBookingToRoom(roomId, { semester, year, services }) {
  const room = await sanityAdminClient.getDocument(roomId);

  const updatedPeriods = [
    ...(room.bookedPeriods || []),
    {
      _key: uuidv4(),
      semester,
      year,
      services,
    },
  ];

  await sanityAdminClient
    .patch(roomId)
    .set({ bookedPeriods: updatedPeriods })
    .commit();

  await db
    .collection("room")
    .doc(roomId)
    .set({ bookedPeriods: updatedPeriods }, { merge: true });
}

export async function createBooking(bookingData) {
  try {
    const allowedMonths = {
      "1st Semester": ["September", "October", "November", "December"],
      "2nd Semester": ["February", "March", "April", "May"],
    }[bookingData.semester];

    const startDate = new Date();
    const midCharge = bookingData.midCharge;
    const isSameMonthAndYear = bookingData.isSameMonthAndYear;

    const fullBooking = {
      _type: "booking",
      bookedBy: bookingData.bookedByUser,
      bookedFor: bookingData.bookedForUser,
      room: bookingData.room,
      roomTitle: bookingData.roomTitle ?? bookingData.room.name,
      status: "confirmed",
      semester: bookingData.semester,
      year: bookingData.year,
      services: bookingData.services,
      price: bookingData.amount,
      bookingDate: new Date().toISOString(),
      cancellationKey: generateCancellationKey(),
      paymentMethod: "PayPal",
    };

    // Initialize semester payments with proper structure
    if (bookingData.semester === "1st Semester") {
      fullBooking.firstSemesterPayments = {
        securityDeposit: "paid",
        months: [],
      };
    }

    if (bookingData.semester === "2nd Semester") {
      fullBooking.secondSemesterPayments = {
        securityDeposit: "paid",
        months: [],
      };
    }

    if (bookingData.semester === "July") {
      fullBooking.julyPayment = {
        totalPayment: "paid",
      };
    }

    if (bookingData.semester === "August") {
      fullBooking.augustPayment = {
        totalPayment: "paid",
      };
    }

    // Add months with proper object structure
    if (allowedMonths) {
      const paymentsField =
        bookingData.semester === "1st Semester"
          ? fullBooking.firstSemesterPayments
          : fullBooking.secondSemesterPayments;

      if (midCharge) {
        const currentMonth = startDate.toLocaleString("en-US", {
          month: "long",
        });
        paymentsField.months.push({
          month: currentMonth,
          status: "paid", // Set initial status for mid-charge month
        });
      }

      if (isSameMonthAndYear) {
        const lastMonth = allowedMonths[allowedMonths.length - 1];
        paymentsField.months.push({
          month: lastMonth,
          status: "paid", // Set initial status for same month/year
        });
      }
    }

    const response = await sanityAdminClient.create(fullBooking);
    return response._id;
  } catch (error) {
    console.error("Booking creation failed:", error);
    // throw new Error(`Failed to create booking: ${error.message}`);
  }
}

async function updateSemesterPayment(bookingId, semester, paymentDate) {
  const fieldMap = {
    "1st Semester": "firstSemesterPayments",
    "2nd Semester": "secondSemesterPayments",
  };

  const semesterField = fieldMap[semester];
  if (!semesterField) throw new Error("Invalid semester");

  const adjustedDate = new Date(
    paymentDate.getTime() + 3 * 24 * 60 * 60 * 1000
  );
  const monthName = adjustedDate.toLocaleString("en-US", {
    month: "long",
    timeZone: "Europe/Paris",
  });

  const allowedMonths = {
    "1st Semester": ["September", "October", "November", "December"],
    "2nd Semester": ["February", "March", "April", "May"],
  }[semester];

  if (!allowedMonths.includes(monthName)) {
    throw new Error(`Invalid payment month ${monthName} for ${semester}`);
  }

  await sanityAdminClient
    .patch(bookingId)
    .insert("after", `${semesterField}.months[-1]`, [
      {
        _key: uuidv4(),
        month: monthName,
        status: "paid",
      },
    ])
    .commit();
}

async function getSubscriptionDetails(billingAgreementId) {
  const baseUrl =
    process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Obtain access token
  const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const authData = await authResponse.json();
  const accessToken = authData.access_token;

  // Fetch subscription details
  const subscriptionResponse = await fetch(
    `${baseUrl}/v1/billing/subscriptions/${billingAgreementId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!subscriptionResponse.ok) {
    console.error(
      "Failed to fetch subscription details:",
      await subscriptionResponse.json()
    );
    return null;
  }

  return await subscriptionResponse.json();
}

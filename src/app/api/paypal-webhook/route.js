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

    switch (body.event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const paymentInfoId = body.resource.custom_id;
        const paymentInfo = await getPaypalPaymentInfoById(paymentInfoId);
        const isSummerMonth = ["July", "August"].includes(paymentInfo.semester);

        const bookingId = await createBooking(paymentInfo);

        // Only add to room for semester bookings
        if (!isSummerMonth) {
          await addBookingToRoom(paymentInfo.roomId, {
            semester: paymentInfo.semester,
            year: paymentInfo.year,
            services: paymentInfo.services,
          });
        }

        await addFieldsToPaypalPaymentInfo(paymentInfoId, {
          subscriptionId: body.resource.id,
          bookingId: bookingId,
          cancelUrl: body.resource.links.find(link => link.rel === "cancel")?.href,
        });

        const emailContent = createSubscriptionActivatedEmail({
          userName: paymentInfo.name,
          roomDetails: paymentInfo.roomTitle,
          paymentType: isSummerMonth ? "one-time" : "recurring",
          month: paymentInfo.semester,
          year: paymentInfo.year,
        });

        await sendEmail({
          to: paymentInfo.email,
          subject: `Booking ${isSummerMonth ? "Confirmed" : "Subscription Activated"}`,
          htmlContent: emailContent,
        });

        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        if (body.resource.billing_agreement_id) {
          const subscription = await getSubscriptionDetails(body.resource.billing_agreement_id);
          const paymentInfo = await getPaypalPaymentInfoById(subscription.custom_id);
          
          if (["July", "August"].includes(paymentInfo.semester)) {
            await markSummerPaymentComplete(paymentInfo.bookingId, paymentInfo.semester);
          } else {
            await handleSemesterPayment(subscription.custom_id, body.resource);
          }
        }
        break;
      }

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.FAILED": {
        if (body.resource.billing_agreement_id) {
          const subscription = await getSubscriptionDetails(body.resource.billing_agreement_id);
          const paymentDetails = await getPaypalPaymentInfoById(subscription.custom_id);
          
          const renewLink = subscription.links.find(
            link => link.rel === "approve"
          )?.href;

          if (renewLink) {
            const failedEmailHtml = createPaymentFailedEmail({
              userName: paymentDetails.name,
              amount: parseFloat(body.resource.amount.total),
              description: `${paymentDetails.semester} payment for ${paymentDetails.roomTitle}`,
              renewUrl: renewLink,
            });

            await sendEmail({
              to: paymentDetails.email,
              subject: "Payment Failed - Action Required",
              htmlContent: failedEmailHtml,
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

async function createBooking(bookingData) {
  try {
    const fullBooking = {
      _type: "booking",
      bookedBy: bookingData.bookedByUser,
      bookedFor: bookingData.bookedForUser,
      room: bookingData.room,
      roomTitle: bookingData.roomTitle,
      status: "confirmed",
      semester: bookingData.semester,
      year: bookingData.year,
      services: bookingData.services,
      price: bookingData.amount,
      bookingDate: new Date().toISOString(),
      cancellationKey: generateCancellationKey(),
      paymentMethod: "PayPal",
    };

    // Handle payment type
    if (["July", "August"].includes(bookingData.semester)) {
      fullBooking[`${bookingData.semester.toLowerCase()}Payment`] = {
        totalPayment: "paid",
      };
    } else {
      const paymentField = bookingData.semester === "1st Semester" 
        ? "firstSemesterPayments" 
        : "secondSemesterPayments";
      
      fullBooking[paymentField] = {
        securityDeposit: "paid",
        months: [],
      };
    }

    const response = await sanityAdminClient.create(fullBooking);
    return response._id;
  } catch (error) {
    console.error("Booking creation failed:", error);
    throw error;
  }
}

async function markSummerPaymentComplete(bookingId, month) {
  await sanityAdminClient
    .patch(bookingId)
    .set({ 
      [`${month.toLowerCase()}Payment.totalPayment`]: "paid",
      status: "completed"
    })
    .commit();
}

async function handleSemesterPayment(paymentInfoId, resource) {
  const paymentDetails = await getPaypalPaymentInfoById(paymentInfoId);
  await updateSemesterPayment(
    paymentDetails.bookingId,
    paymentDetails.semester,
    new Date(resource.create_time)
  );

  const emailContent = createPaymentCompletedEmail({
    userName: paymentDetails.name,
    amount: parseFloat(resource.amount.total),
    paymentDate: resource.create_time,
    description: `Monthly payment for ${paymentDetails.roomTitle}`,
  });

  await sendEmail({
    to: paymentDetails.email,
    subject: "Monthly Payment Processed",
    htmlContent: emailContent,
  });
}

async function updateSemesterPayment(bookingId, semester, paymentDate) {
  const fieldMap = {
    "1st Semester": "firstSemesterPayments",
    "2nd Semester": "secondSemesterPayments",
  };

  const semesterField = fieldMap[semester];
  const adjustedDate = new Date(paymentDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const monthName = adjustedDate.toLocaleString("en-US", { month: "long" });

  const allowedMonths = {
    "1st Semester": ["September", "October", "November", "December"],
    "2nd Semester": ["February", "March", "April", "May"],
  }[semester];

  if (!allowedMonths.includes(monthName)) {
    throw new Error(`Invalid payment month ${monthName} for ${semester}`);
  }

  await sanityAdminClient
    .patch(bookingId)
    .insert("after", `${semesterField}.months[-1]`, [{
      _key: uuidv4(),
      month: monthName,
      status: "paid",
    }])
    .commit();
}

async function getSubscriptionDetails(billingAgreementId) {
  const client = createPayPalClient();
  const request = new paypal.subscriptions.SubscriptionsGetRequest(billingAgreementId);
  const response = await client.execute(request);
  return response.result;
}

async function addBookingToRoom(roomId, { semester, year, services }) {
  const room = await sanityAdminClient.getDocument(roomId);
  const updatedPeriods = [...(room.bookedPeriods || []), {
    _key: uuidv4(),
    semester,
    year,
    services,
  }];

  await sanityAdminClient
    .patch(roomId)
    .set({ bookedPeriods: updatedPeriods })
    .commit();

  await db
    .collection("room")
    .doc(roomId)
    .set({ bookedPeriods: updatedPeriods }, { merge: true });
}
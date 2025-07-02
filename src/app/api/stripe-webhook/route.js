import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import { v4 as uuidv4 } from "uuid";
import { cleanupExpiredPeriods } from "@/utils/proposedBookingPeriods";
import { adminAccessDb as db } from "@/lib/firebase-admin";

import Stripe from "stripe";
import {
  deletePaymentInfo,
  getPaymentInfo,
} from "@/utils/StorePaymentInforFireStore";
import { updatePaymentMethodAndSetDefault } from "../stripe-pay/route";
import {
  BookingConfirmationEmail,
  PaymentUpdateConfirmationEmail,
  PaymentUpdateEmail,
  RecurringPaymentEmail,
} from "@/emailSendingService/stripeBookingLinkEmail";
import { sendEmail } from "@/emailSendingService/emailSender";

// Load your secret key from an environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    console.log('Webhook received at:', new Date().toISOString());
    
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    // Environment-based secret selection
    const endpointSecret = process.env.NODE_ENV === 'production' 
      ? process.env.STRIPE_WEBHOOK_SECRET_LIVE 
      : process.env.STRIPE_WEBHOOK_SECRET;

    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasSecret: !!endpointSecret,
      secretPrefix: endpointSecret?.substring(0, 15)
    });

    if (!endpointSecret) {
      console.error("Webhook secret not configured for environment:", process.env.NODE_ENV);
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error("No signature header found");
      return NextResponse.json(
        { error: "No signature header found" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      console.log(`✅ Webhook signature verified for event: ${event.type}`);
    } catch (err) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Processing event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(event);
          break;
        case "invoice.paid":
          await handleInvoicePaid(event);
          break;
        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (handlerError) {
      console.error(`Error in ${event.type} handler:`, handlerError);
      
      // Send error notification
      try {
        await sendEmail({
          to: process.env.BREVO_OWNER_SENDER_EMAIL,
          subject: `🚨 Webhook Handler Error - ${event.type}`,
          htmlContent: `
            <h2>Webhook Processing Error</h2>
            <p><strong>Event Type:</strong> ${event.type}</p>
            <p><strong>Event ID:</strong> ${event.id}</p>
            <p><strong>Error:</strong> ${handlerError.message}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <pre>${handlerError.stack}</pre>
          `,
        });
      } catch (notificationError) {
        console.error('Failed to send error notification:', notificationError);
      }
      
      throw handlerError;
    }

    console.log(`✅ Successfully processed ${event.type} event`);

    return NextResponse.json(
      {
        message: "Webhook processed successfully",
        received: true,
        eventType: event.type,
        eventId: event.id
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      { 
        message: "Internal Server Error", 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(event) {
  try {
    console.log('Processing checkout.session.completed event');
    
    let session = event.data.object;
    const paymentType = session.metadata?.paymentType;
    
    if (paymentType === "update_payment_method") {
      return await handlePaymentMethodUpdate(session);
    }

    const sessionId = session.id;
    
    // Expand the session to get payment intent details
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const paymentIntent = session.payment_intent;
    
    if (!paymentIntent) {
      console.error(`No payment intent found for session: ${sessionId}`);
      return;
    }
    
    const paymentMethodId = paymentIntent.payment_method;

    console.log(`Processing checkout session: ${sessionId}`);

    // Get payment info from your storage
    const paymentInfo = await getPaymentInfo(sessionId);
    if (!paymentInfo) {
      console.error(`No payment info found for session: ${sessionId}`);
      return;
    }

    // Update payment method
    if (paymentInfo.stripeCustomerId && paymentMethodId) {
      await updatePaymentMethodAndSetDefault(
        paymentInfo.stripeCustomerId,
        paymentMethodId
      );
    }

    const bookingPeriods = paymentInfo.bookingInformation;
    const roomUpdatesMap = new Map(JSON.parse(paymentInfo.roomUpdatesMap));
    const bookingIds = [];

    // Create bookings and subscriptions
    for (const period of bookingPeriods) {
      try {
        const bookingId = await createBooking(period);
        bookingIds.push(bookingId);

        if (period.semester === "1st Semester" || period.semester === "2nd Semester") {
          await createSubscriptionForSemester(period, paymentInfo.stripeCustomerId, bookingId);
        }
      } catch (bookingError) {
        console.error(`Error creating booking for period:`, period, bookingError);
        // Continue with other periods
      }
    }

    // Update room availability
    try {
      await addBookingToRoom(roomUpdatesMap);
    } catch (roomUpdateError) {
      console.error('Error updating room availability:', roomUpdateError);
      // Don't throw - booking is created, room update can be manual
    }

    // Send confirmation emails
    try {
      await sendBookingConfirmationEmails(bookingPeriods, customerEmail, customerName, sessionId);
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError);
      // Don't throw - booking is created, email can be sent manually
    }

    // Cleanup
    try {
      await deletePaymentInfo(sessionId);
      await cleanupExpiredPeriods();
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
      // Don't throw - main process is complete
    }

    console.log(`Successfully processed booking for session: ${sessionId}`);
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
    throw error;
  }
}

async function createSubscriptionForSemester(period, customerId, bookingId) {
  try {
    const { semester, winterPriceMonthly, roomTitle, year } = period;
    
    // Calculate subscription dates
    let startDate = semester === "1st Semester"
      ? new Date(period.startYear, 8, 1) // September 1st
      : new Date(period.endYear, 1, 1); // February 1st

    const endDate = semester === "1st Semester"
      ? new Date(period.startYear, 11, 31, 23, 59, 59, 999) // End of December
      : new Date(period.endYear, 4, 31, 23, 59, 59, 999); // End of May

    const now = new Date();

    // Skip if end date has already passed
    if (endDate <= now) {
      console.log(`Skipping subscription creation - end date passed for ${semester} ${year}`);
      return;
    }

    // Adjust start date if in the past
    if (startDate <= now) {
      startDate = new Date(now.getTime() + 300000); // Add 5 minutes
    }

    // Final validation
    if (startDate >= endDate) {
      console.log(`Skipping subscription - invalid date range for ${semester} ${year}`);
      return;
    }

    const product = await getOrCreateProduct(period.roomId, semester, roomTitle);
    const price = await stripe.prices.create({
      currency: "eur",
      product: product.id,
      unit_amount: winterPriceMonthly * 100,
      recurring: { interval: "month" },
      metadata: {
        description: `${year}-${semester} Accommodation - Room ${roomTitle}`,
      },
    });

    const isSameMonthAndYear = startDate.getFullYear() === endDate.getFullYear() &&
                               startDate.getMonth() === endDate.getMonth();

    let billingAnchorDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1, 0, 0, 0, 0
    );

    if (isSameMonthAndYear) {
      billingAnchorDate = startDate;
    }

    const subscriptionParams = {
      customer: customerId,
      description: `${year} - ${semester} Accommodation - Room ${roomTitle}`,
      items: [{ price: price.id }],
      proration_behavior: "create_prorations",
      metadata: {
        type: "recurring",
        bookingId: bookingId,
        booking_period: semester,
        academic_year: `${period.startYear}-${period.endYear}`,
      },
      cancel_at: Math.floor(endDate.getTime() / 1000),
    };

    const currentTimestamp = Math.floor(now.getTime() / 1000);
    const billingAnchor = Math.floor(billingAnchorDate.getTime() / 1000);

    if (billingAnchor > currentTimestamp && !isSameMonthAndYear) {
      subscriptionParams.trial_end = billingAnchor;
    } else {
      subscriptionParams.billing_cycle_anchor = billingAnchor;
    }

    await stripe.subscriptions.create(subscriptionParams);
    console.log(`Created subscription for ${semester} ${year} - Booking ${bookingId}`);
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

async function handleInvoicePaid(event) {
  try {
    console.log('Processing invoice.paid event:', event.data.object.id);
    
    const invoice = event.data.object;
    const customer = await stripe.customers.retrieve(invoice.customer);

    const paymentUpdates = [];
    const paymentItems = [];

    // Add better error handling for line items
    if (!invoice.lines || !invoice.lines.data || invoice.lines.data.length === 0) {
      console.log('No line items found in invoice:', invoice.id);
      return;
    }

    for (const lineItem of invoice.lines.data) {
      try {
        // Check if price exists and has type property
        if (!lineItem.price) {
          console.warn('Line item missing price:', lineItem.id);
          continue;
        }

        if (!lineItem.price.type) {
          console.warn('Line item price missing type:', lineItem.id);
          continue;
        }

        if (lineItem.price.type === "recurring") {
          // Check if subscription exists
          if (!lineItem.subscription) {
            console.warn('Recurring line item missing subscription:', lineItem.id);
            continue;
          }

          const subscription = await stripe.subscriptions.retrieve(lineItem.subscription);
          
          if (!subscription.metadata) {
            console.warn('Subscription missing metadata:', lineItem.subscription);
            continue;
          }

          const metadata = subscription.metadata;

          // Add to payment updates
          paymentUpdates.push(updateBookingPayment(metadata, lineItem.period));

          // Add to payment items for email
          paymentItems.push({
            description: metadata.description || `Booking ${metadata.bookingId || "N/A"}`,
            amount: lineItem.amount || 0,
            periodStart: lineItem.period?.start ? lineItem.period.start * 1000 : Date.now(),
            periodEnd: lineItem.period?.end ? lineItem.period.end * 1000 : Date.now(),
            currency: invoice.currency?.toUpperCase() || 'EUR',
          });
        }
      } catch (lineItemError) {
        console.error(`Error processing line item ${lineItem.id}:`, lineItemError);
        // Continue processing other line items
        continue;
      }
    }

    // Process payment updates
    if (paymentUpdates.length > 0) {
      await Promise.all(paymentUpdates);
      console.log(`Updated ${paymentUpdates.length} booking payments`);
    }

    // Send email if we have payment items and customer email
    if (customer.email && paymentItems.length > 0) {
      try {
        const totalAmount = paymentItems.reduce((sum, item) => sum + item.amount, 0);
        const emailContent = RecurringPaymentEmail({
          customerName: customer.name || "Valued Customer",
          paymentItems,
          totalAmount,
          invoiceId: invoice.id,
          currency: invoice.currency?.toUpperCase() || 'EUR',
        });

        await Promise.all([
          sendEmail({
            to: customer.email,
            subject: `Payment Processed - ${new Date().toLocaleDateString()}`,
            htmlContent: emailContent,
          }),
          sendEmail({
            to: process.env.BREVO_OWNER_SENDER_EMAIL,
            subject: `Payment Processed - ${new Date().toLocaleDateString()}`,
            htmlContent: emailContent,
          })
        ]);

        console.log('Payment confirmation emails sent successfully');
      } catch (emailError) {
        console.error('Error sending payment emails:', emailError);
        // Don't throw - email failure shouldn't fail the webhook
      }
    } else {
      console.log('Skipping email - missing customer email or payment items');
    }

  } catch (error) {
    console.error("Error processing invoice payment:", error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(event) {
  try {
    const invoice = event.data.object;
    const customer = await stripe.customers.retrieve(invoice.customer);

    const updateSession = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: invoice.customer,
      payment_method_types: ["card"],
      success_url: `${process.env.NEXTAUTH_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment-canceled`,
      metadata: {
        paymentType: "update_payment_method",
        invoiceId: invoice.id,
        customerId: invoice.customer,
      },
    });

    const emailContent = PaymentUpdateEmail({
      customerName: customer.name || "Valued Customer",
      updateUrl: updateSession.url,
    });

    await Promise.all([
      sendEmail({
        to: customer.email,
        subject: "Action Required: Update Payment Method",
        htmlContent: emailContent,
      }),
      sendEmail({
        to: process.env.BREVO_OWNER_SENDER_EMAIL,
        subject: "Action Required: Update Payment Method",
        htmlContent: emailContent,
      })
    ]);
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

async function handlePaymentMethodUpdate(session) {
  try {
    const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent);
    const paymentMethodId = setupIntent.payment_method;

    await stripe.customers.update(session.customer, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    if (session.metadata.invoiceId) {
      await stripe.invoices.pay(session.metadata.invoiceId);
    }

    const customer = await stripe.customers.retrieve(session.customer);
    const confirmContent = PaymentUpdateConfirmationEmail({
      customerName: customer.name,
    });

    await Promise.all([
      sendEmail({
        to: customer.email,
        subject: "Payment Method Updated Successfully",
        htmlContent: confirmContent,
      }),
      sendEmail({
        to: process.env.BREVO_OWNER_SENDER_EMAIL,
        subject: "Payment Method Updated Successfully",
        htmlContent: confirmContent,
      })
    ]);
  } catch (error) {
    console.error("Error processing payment update:", error);
    throw error;
  }
}

async function sendBookingConfirmationEmails(bookingPeriods, customerEmail, customerName, sessionId) {
  const paymentDetails = bookingPeriods.map((period) => ({
    description: `${period.roomTitle} - ${period.semester} ${period.year}`,
    amount: period.winterPriceMonthly * 100,
  }));

  const totalPaid = paymentDetails.reduce((sum, item) => sum + item.amount, 0);

  const emailContent = BookingConfirmationEmail({
    userName: customerName,
    paymentIntents: paymentDetails,
    totalPaid: totalPaid,
    bookingDate: new Date().toISOString(),
    bookingId: sessionId,
  });

  await Promise.all([
    sendEmail({
      to: customerEmail,
      subject: `Booking Confirmation #${sessionId.slice(-6)}`,
      htmlContent: emailContent,
    }),
    sendEmail({
      to: process.env.BREVO_OWNER_SENDER_EMAIL,
      subject: `New Booking #${sessionId.slice(-6)}`,
      htmlContent: emailContent,
    })
  ]);
}

// Keep existing helper functions
export async function getOrCreateProduct(roomId, semester, title) {
  try {
    const productKey = `room_${roomId}_semester_${semester}`;

    const searchResults = await stripe.products.search({
      query: `metadata['product_key']:'${productKey}'`,
    });

    if (searchResults.data.length > 0) {
      return searchResults.data[0];
    }

    const newProduct = await stripe.products.create({
      name: `${semester} Accommodation - Room ${title}`,
      description: `Accommodation for ${semester} in Room ${title} - id:- ${roomId}`,
      metadata: {
        product_key: productKey,
        room_id: roomId,
        semester: semester,
      },
    });

    return newProduct;
  } catch (error) {
    console.error("Error in getOrCreateProduct:", error);
    throw error;
  }
}

export async function createBooking(bookingData) {
  try {
    const fullBooking = {
      _type: "booking",
      bookedBy: bookingData.bookedByUser,
      bookedFor: bookingData.bookedForUser,
      roomTitle: bookingData.roomTitle,
      room: bookingData.room,
      status: "confirmed",
      semester: bookingData.semester,
      year: bookingData.year,
      services: bookingData.services,
      price: ["July", "August"].includes(bookingData.semester)
        ? bookingData.summerPrice
        : bookingData.winterPriceMonthly,
      bookingDate: new Date().toISOString(),
      cancellationKey: generateCancellationKey(),
      paymentMethod: "Stripe",
    };

    // Handle semester payments
    if (bookingData.semester === "1st Semester") {
      fullBooking.firstSemesterPayments = {
        securityDeposit: "paid",
        months: [],
      };
    } else if (bookingData.semester === "2nd Semester") {
      fullBooking.secondSemesterPayments = {
        securityDeposit: "paid",
        months: [],
      };
    } else if (bookingData.semester === "July") {
      fullBooking.julyPayment = { totalPayment: "paid" };
    } else if (bookingData.semester === "August") {
      fullBooking.augustPayment = { totalPayment: "paid" };
    }

    const response = await sanityAdminClient.create(fullBooking);
    console.log(`Created booking in Sanity: ${response._id}`);
    return response._id;
  } catch (error) {
    console.error("Booking creation failed:", error);
    throw error;
  }
}

export function generateCancellationKey() {
  return `${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
}

export async function addBookingToRoom(roomUpdatesMap) {
  try {
    const updates = [];
    
    for (const [roomId, { currentPeriods, newPeriods }] of roomUpdatesMap) {
      const updatedPeriods = [...currentPeriods, ...newPeriods];

      // Update Sanity
      const sanityUpdate = sanityAdminClient
        .patch(roomId)
        .set({ bookedPeriods: updatedPeriods })
        .commit();

      // Update Firestore
      const firestoreUpdate = db
        .collection("room")
        .doc(roomId)
        .set({ bookedPeriods: updatedPeriods }, { merge: true });

      updates.push(sanityUpdate, firestoreUpdate);
    }

    await Promise.all(updates);
    console.log("Successfully updated room availability");
  } catch (error) {
    console.error("Error updating room availability:", error);
    throw error;
  }
}

export async function updateBookingPayment(metadata, period) {
  if (metadata.type !== "recurring") return;

  const bookingId = metadata.bookingId;
  const bookingPeriod = metadata.booking_period;

  let semesterField;
  switch (bookingPeriod) {
    case "1st Semester":
      semesterField = "firstSemesterPayments";
      break;
    case "2nd Semester":
      semesterField = "secondSemesterPayments";
      break;
    default:
      console.error(`Unsupported booking period: ${bookingPeriod}`);
      return;
  }

  const startDate = new Date(period.start * 1000);
  const adjustedDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const monthName = adjustedDate.toLocaleString("en-US", {
    month: "long",
    timeZone: "Europe/Paris",
  });

  const allowedMonths = {
    "1st Semester": ["September", "October", "November", "December"],
    "2nd Semester": ["February", "March", "April", "May"],
  }[bookingPeriod];

  if (!allowedMonths.includes(monthName)) {
    console.error(`Month ${monthName} invalid for ${bookingPeriod}`);
    return;
  }

  try {
    const booking = await sanityAdminClient.getDocument(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (booking.semester !== bookingPeriod) {
      throw new Error("Semester mismatch between booking and metadata");
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

    console.log(`Updated ${monthName} payment status for ${bookingId}`);
  } catch (error) {
    console.error("Error updating booking:", error.message);
  }
}

export async function cancelSubscriptionImmediately(bookingId) {
  try {
    const subscriptions = await stripe.subscriptions.search({
      query: `metadata['bookingId']:'${bookingId}'`,
    });

    if (subscriptions.data.length === 0) {
      console.log("No active subscription found for the given bookingId.");
      return;
    }

    const subscriptionId = subscriptions.data[0].id;
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    console.log("Subscription canceled immediately:", canceledSubscription.id);
    return canceledSubscription;
  } catch (error) {
    console.error("Error canceling subscription:", error.message);
  }
}
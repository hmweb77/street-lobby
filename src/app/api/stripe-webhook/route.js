import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import { v4 as uuidv4 } from "uuid";
import { cleanupExpiredPeriods } from "@/utils/proposedBookingPeriods";
import { adminAccessDb as db } from "@/lib/firebase-admin";

const endpointSecret =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_LdyO0R2FT1jJGYk9gRsyK7r3UV5HSRjs";
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
    // Request Body.
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
//const
    // const { event  } = body;
    // console.log("🚀 ~ POST ~ event:", event)
    const event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers.get("stripe-signature"),
      endpointSecret
    );

    switch (event.type) {
      case "checkout.session.completed":
        // Handle payment method updates
        let session = event.data.object;
        const paymentType = session.metadata?.paymentType;
        if (paymentType === "update_payment_method") {
          try {
            const setupIntent = await stripe.setupIntents.retrieve(
              session.setup_intent
            );
            const paymentMethodId = setupIntent.payment_method;

            // Update customer's default payment method
            await stripe.customers.update(session.customer, {
              invoice_settings: {
                default_payment_method: paymentMethodId,
              },
            });

            // Retry failed invoice if exists
            if (session.metadata.invoiceId) {
              await stripe.invoices.pay(session.metadata.invoiceId);
            }

            // Send confirmation email
            const customer = await stripe.customers.retrieve(session.customer);
            const confirmContent = PaymentUpdateConfirmationEmail({
              customerName: customer.name,
            });

            sendEmail({
              to: customer.email,
              subject: "Payment Method Updated Successfully",
              htmlContent: confirmContent,
              senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
              senderName: process.env.BREVO_OWNER_SENDER_NAME,
            });

            sendEmail({
              to: process.env.BREVO_OWNER_SENDER_EMAIL,
              subject: "Payment Method Updated Successfully",
              htmlContent: confirmContent,
              senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
              senderName: process.env.BREVO_OWNER_SENDER_NAME,
            });
          } catch (error) {
            console.error("Error processing payment update:", error);
          }
          return NextResponse.json({ received: true });
        }

        const sessionId = event.data.object.id;
        session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["payment_intent"],
        });
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name;

        const paymentIntent = session.payment_intent;
        const paymentMethodId = paymentIntent.payment_method;

        const paymentInfo = await getPaymentInfo(sessionId);
        if (!paymentInfo) {
          break;
        }
        const updatedCustomer = await updatePaymentMethodAndSetDefault(
          paymentInfo.stripeCustomerId,
          paymentMethodId
        );

        const bookingPeriods = paymentInfo.bookingInformation;
        const roomUpdatesMap = new Map(JSON.parse(paymentInfo.roomUpdatesMap));
        const bookingIds = [];
        const orderedByUserId =
          paymentInfo.bookingInformation[0].bookedByUser._ref;

        for (const period of bookingPeriods) {
          const { semester, winterPriceMonthly, roomId, roomTitle, year } =
            period;
          const bookingId = await createBooking(period);

          if (semester === "1st Semester" || semester === "2nd Semester") {
            // Original date calculations
            let startDate =
              semester === "1st Semester"
                ? new Date(period.startYear, 8, 1) // September 1st (0-based month)
                : new Date(period.endYear, 1, 1); // February 1st

            const endDate =
              semester === "1st Semester"
                ? new Date(period.startYear, 11, 31, 23, 59, 59, 999) // End of December
                : new Date(period.endYear, 4, 31, 23, 59, 59, 999); // End of May

            const now = new Date();

            // Skip if end date has already passed
            if (endDate <= now) {
              continue;
            }

            let billingAnchorDate;

            // Adjust start date to 1 hour from now if it's in the past
            if (startDate <= now) {
              billingAnchorDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
                0,
                0,
                0,
                0
              );
              startDate = new Date(now.getTime() + 300); // Add 1 hour
            } else {
              billingAnchorDate = startDate;
            }

            // Final validation to ensure start is before end
            if (startDate >= endDate) {
              continue;
            }

            const isSameMonthAndYear =
              startDate.getFullYear() === endDate.getFullYear() &&
              startDate.getMonth() === endDate.getMonth();

            bookingIds.push(bookingId);

            const cancelAt = Math.floor(endDate.getTime() / 1000);

            const product = await getOrCreateProduct(
              roomId,
              semester,
              roomTitle
            );

            // Then create the price for this product
            const price = await stripe.prices.create({
              currency: "eur",
              product: product.id,
              unit_amount: winterPriceMonthly * 100,
              recurring: {
                interval: "month",
              },
              metadata: {
                description: `${year}-${semester} Accommodation - Room ${roomTitle}`,
              },
            });

            // Calculate billing anchor date (1st of current/next month)

            let nextBillingAnchorDate;
            // If we're past the 1st, use next month's 1st
            if (now > billingAnchorDate) {
              nextBillingAnchorDate = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                1,
                0,
                0,
                0,
                0
              );

              if (isSameMonthAndYear) nextBillingAnchorDate = startDate;
            }

            // Convert to Unix timestamp
            const billingAnchor = Math.floor(
              billingAnchorDate.getTime() / 1000
            );

            const currentTimestamp = Math.floor(now.getTime() / 1000);

            // Configure base subscription parameters
            const subscriptionParams = {
              customer: paymentInfo.stripeCustomerId,
              description: `${year} - ${semester} Accommodation - Room ${roomTitle}`,
              items: [{ price: price.id }],
              proration_behavior: "create_prorations",
              metadata: {
                type: "recurring",
                bookingId: bookingId,
                booking_period: semester,
                academic_year: `${period.startYear}-${period.endYear}`,
              },
              cancel_at: cancelAt, // Your existing cancel_at calculation
            };

            // Conditional logic for billing cycle
            if (billingAnchor > currentTimestamp && !isSameMonthAndYear) {
              subscriptionParams.trial_end = billingAnchor;
            } else {
              subscriptionParams.billing_cycle_anchor = Math.floor(
                nextBillingAnchorDate.getTime() / 1000
              );

              // subscriptionParams.backdate_start_date = currentTimestamp;
            }
            await stripe.subscriptions.create(subscriptionParams);
          }
        }

        const paymentDetails = bookingPeriods.map((period) => ({
          description: `${period.roomTitle} - ${period.semester} ${period.year}`,
          amount: period.winterPriceMonthly * 100,
        }));

        const totalPaid = paymentDetails.reduce(
          (sum, item) => sum + item.amount,
          0
        );

        (async () => {
          const emailContent = BookingConfirmationEmail({
            userName: customerName,
            paymentIntents: paymentDetails,
            totalPaid: totalPaid,
            bookingDate: new Date().toISOString(),
            bookingId: sessionId, // or your custom booking ID
          });

          await sendEmail({
            to: customerEmail,
            subject: `Booking Confirmation #${sessionId.slice(-6)}`,
            htmlContent: emailContent,
            senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
            senderName: process.env.BREVO_OWNER_SENDER_NAME,
          });

          await sendEmail({
            to: process.env.BREVO_OWNER_SENDER_EMAIL,
            subject: `New Booking #${sessionId.slice(-6)}`,
            htmlContent: emailContent,
            senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
            senderName: process.env.BREVO_OWNER_SENDER_NAME,
          });
        })();

        addBookingToRoom(roomUpdatesMap);
        // await createOrder(orderedByUserId, bookingIds);
        deletePaymentInfo(sessionId);
        cleanupExpiredPeriods();

        // console.log("Checkout session completed:", event.data.object);
        break;
      case "invoice.paid":
        try {
          const invoice = event.data.object;
          const customer = await stripe.customers.retrieve(invoice.customer);

          // Maintain existing metadata collection pattern
          const paymentUpdates = [];
          const paymentItems = [];

          console.log(invoice.lines.data);

          for (const lineItem of invoice.lines.data) {
            const subscription = await stripe.subscriptions.retrieve(
                lineItem.parent.subscription_item_details.subscription
              );

              // Keep existing metadata handling
              const metadata = subscription.metadata;
            if (metadata?.type === "recurring") {
              
              const period = {
                start: lineItem.period.start,
                end: lineItem.period.end,
              };

              console.log(metadata);

              // Preserve original update pattern
              paymentUpdates.push(
                updateBookingPayment(metadata, lineItem.period)
              );

              // Collect items for email
              paymentItems.push({
                description:
                  metadata.description ||
                  `Booking ${metadata.bookingId || "N/A"}`,
                amount: lineItem.amount,
                periodStart: lineItem.period.start * 1000,
                periodEnd: lineItem.period.end * 1000,
                currency: invoice.currency.toUpperCase(),
              });
            }
          }

          // Wait for all updates to complete first (preserve original flow)
          await Promise.all(paymentUpdates);

          // Send single email after all updates
          if (customer.email && paymentItems.length > 0) {
            const totalAmount = paymentItems.reduce(
              (sum, item) => sum + item.amount,
              0
            );

            const emailContent = RecurringPaymentEmail({
              customerName: customer.name || "Valued Customer",
              paymentItems,
              totalAmount,
              invoiceId: invoice.id,
              currency: invoice.currency.toUpperCase(),
            });

            sendEmail({
              to: customer.email,
              subject: `Payment Processed - ${new Date().toLocaleDateString()}`,
              htmlContent: emailContent,
              senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
              senderName: process.env.BREVO_OWNER_SENDER_NAME,
            });

            sendEmail({
              to: process.env.BREVO_OWNER_SENDER_EMAIL,
              subject: `Payment Processed - ${new Date().toLocaleDateString()}`,
              htmlContent: emailContent,
              senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
              senderName: process.env.BREVO_OWNER_SENDER_NAME,
            });
          }
        } catch (error) {
          console.error("Error processing invoice payment:", error);
        }
        break;

      case "invoice.payment_failed":
        try {
          const invoice = event.data.object;
          const customerId = invoice.customer;
          const invoiceId = invoice.id;

          // Retrieve customer details
          const customer = await stripe.customers.retrieve(customerId);

          // Create Checkout Session for payment method update
          const updateSession = await stripe.checkout.sessions.create({
            mode: "setup",
            customer: customerId,
            payment_method_types: ["card"],
            success_url: `${process.env.NEXTAUTH_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/payment-canceled`,
            metadata: {
              paymentType: "update_payment_method",
              invoiceId: invoiceId,
              customerId: customerId,
            },
          });

          // Send payment method update email
          const emailContent = PaymentUpdateEmail({
            customerName: customer.name || "Valued Customer",
            updateUrl: updateSession.url,
          });

          sendEmail({
            to: customer.email,
            subject: "Action Required: Update Payment Method",
            htmlContent: emailContent,
            senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
            senderName: process.env.BREVO_OWNER_SENDER_NAME,
          });

          sendEmail({
            to: process.env.BREVO_OWNER_SENDER_EMAIL,
            subject: "Action Required: Update Payment Method",
            htmlContent: emailContent,
            senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
            senderName: process.env.BREVO_OWNER_SENDER_NAME,
          });
        } catch (error) {
          console.error("Error handling payment failure:", error);
        }
        break;
    }

    return NextResponse.json(
      {
        message: "No conflicts detected",
        received: true,
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

export async function getOrCreateProduct(roomId, semester, title) {
  try {
    const productKey = `room_${roomId}_semester_${semester}`;

    // Check if the product exists by searching by name
    const searchResults = await stripe.products.search({
      query: `metadata['product_key']:'${productKey}'`,
    });

    if (searchResults.data.length > 0) {
      console.log("Product found:", searchResults.data[0].id);
      return searchResults.data[0]; // Return the existing product
    }

    // Create a new product if not found
    const newProduct = await stripe.products.create({
      name: `${semester} Accommodation - Room ${title}`,
      description: `Accommodation for ${semester} in Room ${title} - id:- ${roomId}`,
      metadata: {
        product_key: productKey, // Store the key in metadata
        room_id: roomId,
        semester: semester,
      },
    });

    console.log("New product created:", newProduct.id);
    return newProduct;
  } catch (error) {
    console.error("Error in getOrCreateProduct:", error);
    // throw error;
  }
}

export async function createOrder(userId, bookingIds, notes = "") {
  try {
    const newOrder = {
      _type: "order",
      orderBy: {
        _type: "reference",
        _ref: userId, // _id of the user placing the order
      },
      bookings: bookingIds.map((id) => ({
        _key: id,
        _type: "reference",
        _ref: id, // _id of each booking
      })),
      notes,
    };

    const result = await sanityAdminClient.create(newOrder);
    console.log("Order created:", result);
    return result;
  } catch (err) {
    console.error("Error creating order:", err);
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
    }
    // Handle summer months
    else if (bookingData.semester === "July") {
      fullBooking.julyPayment = { totalPayment: "paid" };
    } else if (bookingData.semester === "August") {
      fullBooking.augustPayment = { totalPayment: "paid" };
    }

    const response = await sanityAdminClient.create(fullBooking);
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
  for (const [roomId, { currentPeriods, newPeriods }] of roomUpdatesMap) {
    const updatedPeriods = [...currentPeriods, ...newPeriods];

    await sanityAdminClient
      .patch(roomId)
      .set({ bookedPeriods: updatedPeriods })
      .commit();

    await db
      .collection("room")
      .doc(roomId)
      .set({ bookedPeriods: updatedPeriods }, { merge: true });
  }
}

export async function updateBookingPayment(metadata, period) {
  if (metadata.type !== "recurring") return;

  const bookingId = metadata.bookingId;
  const bookingPeriod = metadata.booking_period;
  const academicYear = metadata.academic_year;

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

  // console.log("🚀");
  // console.log(bookingPeriod);
  // console.log(adjustedDate.toLocaleString());
  // console.log(monthName);

  const allowedMonths = {
    "1st Semester": ["September", "October", "November", "December"],
    "2nd Semester": ["February", "March", "April", "May"],
  }[bookingPeriod];

  console.log(allowedMonths);

  if (!allowedMonths.includes(monthName)) {
    console.error(
      `Month ${monthName} invalid for ${bookingPeriod} after 3-day adjustment`
    );
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

    console.log(
      `Updated ${monthName} (adjusted +3 days) payment status for ${bookingId}`
    );
  } catch (error) {
    console.error("Error updating booking:", error.message);
  }
}

export async function cancelSubscriptionImmediately(bookingId) {
  try {
    // Search for the subscription with the given bookingId in metadata
    const subscriptions = await stripe.subscriptions.search({
      query: `metadata['bookingId']:'${bookingId}'`,
    });

    if (subscriptions.data.length === 0) {
      console.log("No active subscription found for the given bookingId.");
      return;
    }

    // Get the first matching subscription (assuming unique bookingId)
    const subscriptionId = subscriptions.data[0].id;

    // Cancel the subscription immediately
    const canceledSubscription =
      await stripe.subscriptions.cancel(subscriptionId);

    console.log("Subscription canceled immediately:", canceledSubscription.id);
    return canceledSubscription;
  } catch (error) {
    console.error("Error canceling subscription:", error.message);
  }
}
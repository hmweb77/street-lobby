import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import { deleteAddedDocs, getValidProposedPeriods, storeProposedPeriodsBatch } from "@/utils/proposedBookingPeriods";

// pages/api/payment.js
import Stripe from "stripe";
import {
  findOrCreateUser,
  processBookingPeriods,
} from "@/apiServices/bookings-services";
import { storePaymentInfo } from "@/utils/StorePaymentInforFireStore";
import { sendBookingEmails } from "@/emailSendingService/stripeBookingLinkEmail";

// Load your secret key from an environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      bookingPeriods,
      commonUserDetails,
      useCommonDetails,
    } = body;

    if (!bookingPeriods || bookingPeriods.length <= 0 || !commonUserDetails) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const bookedByUser = await findOrCreateUser(
      commonUserDetails.email,
      commonUserDetails,
      sanityAdminClient
    );
    const { bookedPeriods, roomUpdatesMap, validationErrors } =
      await processBookingPeriods(
        bookingPeriods,
        useCommonDetails,
        bookedByUser,
        sanityAdminClient
      );

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { message: validationErrors.join("; ") },
        { status: 400 }
      );
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { message: validationErrors.join("; ") },
        { status: 400 }
      );
    }

    //stripe sections

    const stripeCustomer = await createOrFetchCustomer(
      { email: commonUserDetails.email, name: commonUserDetails.name },
      bookedByUser._id
    );

    const paymentIntents = [];

    for (const period of bookedPeriods) {
      const { semester, winterPriceMonthly, summerPrice , roomTitle } =  period;
      console.log(roomTitle);
      if (semester === "1st Semester" || semester === "2nd Semester") {
        // Create a payment intent for the initial deposit
        const paymentIntent = await stripe.paymentIntents.create({
          amount: winterPriceMonthly * 100, // Convert to cents
          currency: "eur",
          customer: stripeCustomer.id,
          description: `Security one month deposit for ${semester} year (${period.year})- ${roomTitle}`,
          setup_future_usage: "off_session", // Save the card for future payments
          metadata: {
            type: "initialDeposit",
            periodDetails: JSON.stringify({
              roomId: period.roomId,
              year: period.year,
              semester: period.semester,
              startYear: period.startYear,
              endYear: period.endYear,
            }),
          },
        });

        // Store the payment intent in the array
        paymentIntents.push(paymentIntent);
      } else if (semester === "Summer") {
        // Create a payment intent for the full one-time payment
        const paymentIntent = await stripe.paymentIntents.create({
          amount: summerPrice * 100, // Convert to cents
          currency: "eur",
          customer: stripeCustomer.id,
          description: `Full payment for Summer - ${period.year} - ${period.roomTitle}`,
          setup_future_usage: "off_session", // Save the card for future payments
          metadata: {
            periodDetails: JSON.stringify({
              roomId: period.roomId,
              year: period.year,
              semester: period.semester,
              startYear: period.startYear,
              endYear: period.endYear,
            }),
          },
        });
        // Store the payment intent in the array
        paymentIntents.push(paymentIntent);
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card',           // Includes Apple Pay & Google Pay
        // 'paypal',         // PayPal (enable in Stripe Dashboard)
        'link',           // Stripe’s fast checkout
      ],
      line_items: paymentIntents.map((intent) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: intent.description,
          },
          unit_amount: intent.amount,
        },
        quantity: 1,
      })),
      payment_intent_data: {
        setup_future_usage: "off_session", // Saves card for later use
      },

      // metadata: {
      //   bookedPeriods: JSON.stringify(bookedPeriods),
      // },
      mode: "payment", // Use 'payment' mode for one-time payments
      customer: stripeCustomer.id,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-cancel`,
    });

    console.log("Session ID:", session.id);

    await storePaymentInfo(bookedPeriods, roomUpdatesMap , stripeCustomer.id , session.id);

    console.log("Here!!!- 150");
    console.log(commonUserDetails.email);
    await sendBookingEmails({userName: commonUserDetails.name, customerEmail: commonUserDetails.email, paymentIntents: paymentIntents, sessionUrl: session.url});


    return NextResponse.json(
      {
        message: "Payment initiated successfully",
        paymentDetails: [{approvalUrl : session.url}] ,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("Error checking eligibility:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function createOrFetchCustomer(userDetails, _id) {
  try {
    // Check if the customer already exists
    const existingCustomers = await stripe.customers.list({
      email: userDetails.email,
      limit: 1,
    });
    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create a new customer if not found
    const customer = await stripe.customers.create({
      email: userDetails.email,
      name: userDetails.name,
      metadata: {
        _id: _id,
      },
      payment_method: "pm_card_visa", // Placeholder, update based on actual user input
      invoice_settings: {
        default_payment_method: null, // Will be set when a payment method is added
      },
    });

    return customer;
  } catch (error) {
    console.error("Error creating or fetching customer:", error);
    throw error;
  }
}



export async function updatePaymentMethodAndSetDefault(customerId, paymentMethodId) {
  try {
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Update the customer to set the new payment method as default for invoices
    const updatedCustomer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return updatedCustomer;
  } catch (error) {
    console.error("Error updating payment method:", error);
    throw error;
  }
}


// for (const period of bookingPeriods) {
//   const { semester, winterPriceMonthly, summerPrice } = period;

//   if (semester === "1st Semester" || semester === "2nd Semester") {
//     // Initial deposit (One-time payment)
//     await stripe.paymentIntents.create({
//       amount: winterPriceMonthly * 100, // Convert to cents
//       currency: "usd",
//       customer: stripeCustomer.id,
//       description: `Initial deposit for ${semester} year (${period.year})`,
//     });

//     // Subscription setup
//     const startDate =
//       semester === "1st Semester"
//         ? new Date(period.startYear, 8, 1) // September
//         : new Date(period.startYear, 1, 1); // February
//     const endDate =
//       semester === "1st Semester"
//         ? new Date(period.endYear, 11, 31) // December-end
//         : new Date(period.endYear, 4, 31); // May-end

//     await stripe.subscriptions.create({
//       customer: stripeCustomer.id,
//       items: [{ price_data: {
//         currency: "usd",
//         product: "prod_xxxx", // Replace with actual Stripe product ID
//         unit_amount: winterPriceMonthly * 100,
//         recurring: { interval: "month" }
//       }}],
//       trial_period_days: 0,
//       billing_cycle_anchor: Math.floor(startDate.getTime() / 1000),
//     });

//   } else if (semester === "Summer") {
//     // Full one-time payment
//     await stripe.paymentIntents.create({
//       amount: summerPrice * 100, // Convert to cents
//       currency: "usd",
//       customer: stripeCustomer.id,
//       description: "Full payment for Summer Semester",
//     });
//   }
// }

// const bookingData = {
//   tracker : bookingTrackerId,
//   _type: "booking",
//   bookedPeriod: bookedPeriods,
//   bookingDate: new Date().toISOString(),
//   status: "pending",
//   totalPrice,
//   paymentMethod,
//   paymentStatus: paymentStatus || "pending",
//   notes: ""
// };

// const createdBooking = await sanityAdminClient.create(bookingData);

// // Update rooms with new periods
// for (const [roomId, { currentPeriods, newPeriods }] of roomUpdatesMap) {
//   const updatedPeriods = [...currentPeriods, ...newPeriods];

//   await sanityAdminClient.patch(roomId)
//     .set({ bookedPeriods: updatedPeriods })
//     .commit();

//   await db.collection("room")
//     .doc(roomId)
//     .set({ bookedPeriods: updatedPeriods }, { merge: true });
// }

import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import { deleteAddedDocs, getValidProposedPeriods, storeProposedPeriodsBatch } from "@/utils/proposedBookingPeriods";
import Stripe from "stripe";
import {
  findOrCreateUser,
  processBookingPeriods,
} from "@/apiServices/bookings-services";
import { storePaymentInfo } from "@/utils/StorePaymentInforFireStore";
import { sendBookingEmails } from "@/emailSendingService/stripeBookingLinkEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingPeriods, commonUserDetails, useCommonDetails } = body;

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

    const stripeCustomer = await createOrFetchCustomer(
      { email: commonUserDetails.email, name: commonUserDetails.name },
      bookedByUser._id
    );

    const paymentIntents = [];

    for (const period of bookedPeriods) {
      const { semester, winterPriceMonthly, summerPrice, roomTitle } = period;
      
      if (["1st Semester", "2nd Semester"].includes(semester)) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: winterPriceMonthly * 100,
          currency: "eur",
          customer: stripeCustomer.id,
          description: `Security deposit for ${semester} ${period.year} - ${roomTitle}`,
          setup_future_usage: "off_session",
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
        paymentIntents.push(paymentIntent);
      } 
      else if (["July", "August"].includes(semester)) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: summerPrice * 100,
          currency: "eur",
          customer: stripeCustomer.id,
          description: `Full payment for ${semester} ${period.year} - ${roomTitle}`,
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
        paymentIntents.push(paymentIntent);
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
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
        setup_future_usage: "off_session",
      },
      mode: "payment",
      customer: stripeCustomer.id,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-cancel`,
    });

    await storePaymentInfo(bookedPeriods, roomUpdatesMap, stripeCustomer.id, session.id);
    //  sendBookingEmails({
    //   userName: commonUserDetails.name,
    //   customerEmail: commonUserDetails.email,
    //   paymentIntents: paymentIntents,
    //   sessionUrl: session.url
    // });

    return NextResponse.json({
      message: "Payment initiated successfully",
      paymentDetails: [{ approvalUrl: session.url }],
    }, { status: 200 });

  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Customer handling functions remain the same
export async function createOrFetchCustomer(userDetails, _id) {
  try {
    const existingCustomers = await stripe.customers.list({
      email: userDetails.email,
      limit: 1,
    });
    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    return await stripe.customers.create({
      email: userDetails.email,
      name: userDetails.name,
      metadata: { _id },
      invoice_settings: { default_payment_method: null },
    });
  } catch (error) {
    console.error("Customer handling error:", error);
    // throw error;
  }
}

export async function updatePaymentMethodAndSetDefault(customerId, paymentMethodId) {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    return await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });
  } catch (error) {
    console.error("Payment method update error:", error);
    // throw error;
  }
}
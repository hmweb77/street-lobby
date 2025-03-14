import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
// import { deleteAddedDocs, getValidProposedPeriods, storeProposedPeriodsBatch } from "@/utils/proposedBookingPeriods";

// pages/api/payment.js
import Stripe from 'stripe';

// Load your secret key from an environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      bookingPeriods,
      commonUserDetails,
      useCommonDetails,
      totalPrice,
      paymentMethod,
      paymentStatus
    } = body;


    if (!bookingPeriods || bookingPeriods.length <= 0 || !commonUserDetails) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }


    let bookedByUser;

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
      bookedByUser = await sanityAdminClient.create(newUser);
    } else {
      bookedByUser = existingUser;
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
        await sanityAdminClient.patch(bookedByUser._id).set(updates).commit();
      }
    }

   const stripeCustomer = await createOrFetchCustomer({ email : commonUserDetails.email, name: commonUserDetails.name } , bookedByUser._id);


    console.log(stripeCustomer);

    return NextResponse.json(
      {
        message: "No conflicts detected",
        eligible: true,
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




async function createOrFetchCustomer(userDetails, _id ) {
  try {
    // Check if the customer already exists
    const existingCustomers = await stripe.customers.list({ email: userDetails.email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create a new customer if not found
    const customer = await stripe.customers.create({
      email: userDetails.email,
      name: userDetails.name,
      metadata: {
        _id: _id
      },
      payment_method: 'pm_card_visa', // Placeholder, update based on actual user input
      invoice_settings: {
        default_payment_method: null, // Will be set when a payment method is added
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating or fetching customer:', error);
    throw error;
  }
}

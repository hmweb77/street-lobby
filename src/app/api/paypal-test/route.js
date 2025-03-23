import { NextRequest, NextResponse } from "next/server";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import { deleteAddedDocs, getValidProposedPeriods, storeProposedPeriodsBatch } from "@/utils/proposedBookingPeriods";
import checkout from "paypal-rest-sdk";
import {
  findOrCreateUser,
  processBookingPeriods,
} from "@/apiServices/bookings-services";
import { storePaymentInfo } from "@/utils/StorePaymentInforFireStore";

// Configure PayPal SDK
checkout.configure({
  mode: "sandbox", // Use 'live' for production
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      bookingPeriods,
      commonUserDetails,
      useCommonDetails,
      totalPrice,
      paymentMethod,
      paymentStatus,
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

    // Create PayPal payment items
    const items = bookedPeriods.map(period => {
      const isSemester = period.semester.includes("Semester");
      const amount = isSemester ? period.winterPriceMonthly : period.summerPrice;
      
      return {
        name: `${period.roomTitle} - ${period.semester} ${period.year}`,
        description: `Payment for ${period.semester} ${period.year}`,
        quantity: 1,
        price: amount.toFixed(2),
        currency: "EUR",
        sku: period.roomId
      };
    });

    // Calculate total amount
    const total = items.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);

    // Create PayPal payment payload
    const create_payment_json = {
      intent: "SALE",
      payer: {
        payment_method: "paypal"
      },
      redirect_urls: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-cancel`
      },
      transactions: [{
        item_list: {
          items: items
        },
        amount: {
          currency: "EUR",
          total: total
        },
        description: "Room booking payment",
        custom: JSON.stringify({
          userId: bookedByUser._id,
        })
      }]
    };

    

    // Create PayPal payment
    const payment = await new Promise((resolve, reject) => {
      checkout.payment.create(create_payment_json, (error, payment) => {
        console.log(error);
        if (error) reject(error.response);
        else resolve(payment);
      });
    });

    // console.log("I am in here! Line -118");

    // Store payment information
    await storePaymentInfo(
      bookedPeriods,
      roomUpdatesMap,
      bookedByUser._id,
      payment.id,
    );

    

    console.log("Payment created:", payment.id);
    console.log(payment);
    // Find approval URL
    const approvalUrl = payment.links.find(
      link => link.rel === "approval_url"
    ).href;

    return NextResponse.json(
      {
        message: "Payment initiated successfully",
        redirectUrl: approvalUrl,
        paymentId: payment.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Add PayPal webhook handler if needed
export async function GET(req) {
  return NextResponse.json(
    { message: "Method not allowed" },
    { status: 405 }
  );
}
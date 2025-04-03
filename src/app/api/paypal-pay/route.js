import {
  findOrCreateUser,
  processBookingPeriods,
} from "@/apiServices/bookings-services";
import { NextResponse } from "next/server";
import fetch from "node-fetch";
import { sanityAdminClient } from "@/lib/sanityAdmin";
import {
  addFieldsToPaypalPaymentInfo,
  storePaypalPaymentInfo,
} from "@/utils/StorePaypalPaymentsInfo";
import { sendPaypalApprovalEmail } from "@/emailSendingService/paypalEmail";

export async function POST(req) {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

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

    // Auth token generation
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    const approvedUrlAndDetails = [];

    for (const period of bookedPeriods) {
      const {
        semester,
        winterPriceMonthly,
        summerPrice,
        roomId,
        roomTitle,
        year,
        bookedByUser,
        bookedForUser,
      } = period;

      // Determine payment type
      const isSummerMonth = semester === "July" || semester === "August";
      const amount = isSummerMonth ? Number(summerPrice) : Number(winterPriceMonthly);

      // Date calculations
      let startDate, endDate;
      if (isSummerMonth) {
        const yearNumber = parseInt(year.split('/')[1]);
        const month = semester === "July" ? 6 : 7; // JS months are 0-based
        startDate = new Date(yearNumber, month, 1);
        endDate = new Date(yearNumber, month + 1, 0);
      } else {
        startDate = semester === "1st Semester" 
          ? new Date(period.startYear, 8, 1) // September 1st
          : new Date(period.endYear, 1, 1); // February 1st
        
        endDate = semester === "1st Semester"
          ? new Date(period.startYear, 11, 31) // December 31st
          : new Date(period.endYear, 4, 31); // May 31st
      }

      // Skip if end date passed
      if (endDate <= new Date()) {
        console.log(`Skipping ${semester}: End date has passed`);
        continue;
      }

      // Create PayPal product
      const paypalProduct = await createOrGetProduct(accessToken, {
        customId: `${roomId}_${semester.replace(" ", "_")}`,
        name: `${roomTitle} - ${semester}`,
        description: `${semester} ${year} Accommodation`,
      });

      // Create payment plan
      const { planData, customDetails } = await createPlan(
        accessToken,
        paypalProduct,
        {
          isSummerMonth,
          amount,
          startDate,
          endDate,
          semester,
          year,
          roomId,
          bookedByUser,
          bookedForUser,
          bookedByUserEmail: commonUserDetails.email,
        }
      );

      // Store payment info
      const paymentInfoId = await storePaypalPaymentInfo({
        ...customDetails,
        roomId,
        roomTitle,
        semester,
        year,
        amount,
        startDate,
        endDate,
        planId: planData.id,
        productId: paypalProduct.id,
        room: period.room,
        services: period.services,
        email: commonUserDetails.email,
        name: commonUserDetails.name
      });

      // Create subscription
      const subscriptionResponse = await fetch(
        `${baseUrl}/v1/billing/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan_id: planData.id,
            custom_id: paymentInfoId,
            start_time: new Date(Date.now() + 1000).toISOString(),
            subscriber: {
              name: {
                given_name: commonUserDetails.name?.split(' ')[0] || "Customer",
                surname: commonUserDetails.name?.split(' ')[1] || "Name",
              },
              email_address: commonUserDetails.email,
            },
            payment_source: {
              paypal: {
                item_name: `${roomTitle} - ${semester} ${year}`,
                currency_code: "EUR",
              },
            },
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
          }),
        }
      );

      const subscriptionData = await subscriptionResponse.json();
      if (!subscriptionResponse.ok) {
        console.error("Subscription error:", subscriptionData);
        continue;
      }

      // Store approval URL
      const approvalUrl = subscriptionData.links.find(
        (link) => link.rel === "approve"
      ).href;

      approvedUrlAndDetails.push({
        approvalUrl,
        details: {
          roomTitle,
          semester,
          year,
          amount: amount.toFixed(2),
          currency: "EUR"
        }
      });
    }

    // Send confirmation email
    sendPaypalApprovalEmail(
      commonUserDetails.email,
      commonUserDetails.name,
      approvedUrlAndDetails
    );

    return NextResponse.json(
      { paymentDetails: approvedUrlAndDetails },
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

// Helper functions
export async function createOrGetProduct(accessToken, productDetails) {
  const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
  
  try {
    const searchResponse = await fetch(`${baseUrl}/v1/catalogs/products?page_size=50`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const searchData = await searchResponse.json();
    const existingProduct = searchData.products?.find(
      p => p.id === productDetails.customId
    );
    
    if (existingProduct) return existingProduct;

    const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: productDetails.customId,
        name: productDetails.name,
        description: productDetails.description,
        type: "SERVICE",
        category: "ACCOMMODATION"
      })
    });

    return await productResponse.json();
  } catch (error) {
    console.error("Product creation failed:", error);
    throw error;
  }
}

export async function createPlan(
  accessToken,
  paypalProduct,
  {
    isSummerMonth,
    amount,
    startDate,
    endDate,
    semester,
    year,
    roomId,
    bookedByUser,
    bookedForUser,
    bookedByUserEmail
  }
) {
  const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
  
  const customDetails = {
    roomId,
    semester,
    year,
    bookedByUser,
    bookedForUser,
    bookedByUserEmail,
    amount,
    isSummerMonth
  };

  const planConfig = {
    product_id: paypalProduct.id,
    name: `${paypalProduct.name} Payment`,
    description: `${semester} ${year} payment for ${paypalProduct.name}`,
    status: "ACTIVE",
    billing_cycles: [{
      frequency: {
        interval_unit: isSummerMonth ? "YEAR" : "MONTH",
        interval_count: 1
      },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: isSummerMonth ? 1 : calculateCycles(startDate, endDate),
      pricing_scheme: {
        fixed_price: {
          value: amount.toFixed(2),
          currency_code: "EUR"
        }
      }
    }],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: "0.00",
        currency_code: "EUR"
      },
      setup_fee_failure_action: "CONTINUE"
    },
    custom_id: JSON.stringify(customDetails)
  };

  const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(planConfig)
  });

  const planData = await planResponse.json();
  return { planData, customDetails };
}

function calculateCycles(start, end) {
  const months = (end.getFullYear() - start.getFullYear()) * 12;
  return months - start.getMonth() + end.getMonth() + 1;
}
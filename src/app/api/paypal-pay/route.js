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
    const baseUrl =
      process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

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

    // auth token generation steps

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

    // auth token generation steps end

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
        bookedByUserEmail,
      } = period;

      const semesterStartYear =
        semester === "1st Semester" ? period.startYear : period.endYear;

      const name = roomTitle;
      const description = `Product of - ${semester} -  ${year}`;
      const isSemester = semester.includes("Semester");
      const amount = isSemester
        ? Number(winterPriceMonthly)
        : Number(summerPrice);

      let billingAnchorDate;
      let billingEndDate;

      let startDate =
        semester === "1st Semester"
          ? new Date(period.startYear, 8, 1) // September 1st
          : new Date(period.endYear, 1, 1); // February 1st

      const endDate =
        semester === "1st Semester"
          ? new Date(period.startYear, 11, 31, 23, 59, 59, 999) // December 31st
          : new Date(period.endYear, 4, 31, 23, 59, 59, 999); // May 31st

      const now = new Date();

      // Skip if end date has already passed
      if (endDate <= now) {
        console.log("Skipping: End date has already passed.");
        if (semester !== "Summer") continue;
      } else {
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
          startDate = new Date(now.getTime() + 36000); // Add 1 hour
        } else {
          billingAnchorDate = startDate;
        }

        // Final validation to ensure start is before end
        if (startDate < endDate) {
          billingEndDate = endDate;
        } else {
          console.log("Skipping: Start date is after end date.");
          if (semester !== "Summer") continue;
        }

        if (now > billingAnchorDate) {
          billingAnchorDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1,
            0,
            0,
            0,
            0
          );
        }
      }

      let isSameMonthAndYear =
        billingAnchorDate.getFullYear() === billingEndDate.getFullYear() &&
        billingAnchorDate.getMonth() === billingEndDate.getMonth();

      const isAnchorAfterEnd = billingAnchorDate > billingEndDate;

      if (isSameMonthAndYear || isAnchorAfterEnd)
        billingAnchorDate = new Date(now.getTime() + 300);

      isSameMonthAndYear =
        billingAnchorDate.getFullYear() === billingEndDate.getFullYear() &&
        billingAnchorDate.getMonth() === billingEndDate.getMonth();

      const paypalProduct = await createOrGetProduct(accessToken, {
        customId: `${roomId}_${period.semester.replace(" ", "_")}`,
        name,
        description,
      }); // Create Product

      const { planData, customDetails } = await createPlan(
        accessToken,
        paypalProduct,
        {
          semesterStartYear,
          amount,
          billingAnchorDate,
          billingEndDate,
          isSameMonthAndYear,
          semester,
          year,
          bookedByUser,
          bookedForUser,
          bookedByUserEmail: commonUserDetails.email,
          roomId,
        }
      );

      // console.log(billingAnchorDate.toLocaleDateString());

      const paymentInfoId = await storePaypalPaymentInfo({
        ...customDetails,
        roomId,
        roomTitle,
        semester,
        year,
        amount,
        billingAnchorDate,
        billingEndDate,
        isSameMonthAndYear,
        planId: planData.id,
        productId: paypalProduct.id,
        room: period.room,
        services: period.services,
        email: commonUserDetails.email,
        name: commonUserDetails.name
      });

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
            start_time:
              isSameMonthAndYear || semester.includes("Summer")
                ? new Date(Date.now() + 1000).toISOString()
                : billingAnchorDate.toISOString(), // Start in 5 minutes
            subscriber: {
              name: {
                given_name: commonUserDetails.email.split("@")[0],
                surname: commonUserDetails.email.split("@")[0],
              },
              email_address: commonUserDetails.email,
            },
            payment_source: {
              paypal: {
                custom: JSON.stringify(customDetails),
                item_name: `Booking for ${period.roomTitle} - ${period.semester} ${period.year}`,
                currency: "EUR",
              }, // This tells PayPal to use the balance if available
            },
            return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success`, // Redirect URL after success
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`, // Redirect URL after cancellation
          }),
        }
      );

      const subscriptionData = await subscriptionResponse.json();
      if (!subscriptionResponse.ok) {
        console.error("Error creating subscription:", subscriptionData);
        return NextResponse.json(
          {
            message: subscriptionData.message || "Error creating subscription",
          },
          { status: 500 }
        );
      }

      // addFieldsToPaypalPaymentInfo(paymentInfoId, { subscriptionId: subscriptionData.id });

      // Extract approval URL
      const approvalUrl = subscriptionData.links.find(
        (link) => link.rel === "approve"
      ).href;

      customDetails.roomTitle = period.roomTitle;
      approvedUrlAndDetails.push({
        approvalUrl,
        planData,
        customDetails,
      });
    }

    const customerEmail = commonUserDetails.email;
    const customerName = commonUserDetails.name || customerEmail.split("@")[0];

    sendPaypalApprovalEmail(customerEmail, customerName, approvedUrlAndDetails);

    // Return approval URL for frontend redirection
    return NextResponse.json(
      { paymentDetails: approvedUrlAndDetails },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in subscription flow:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Create Product Function
export async function createOrGetProduct(accessToken, productDetails) {
  const baseUrl =
    process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

  // Extract details from the productDetails object
  const {
    customId,
    name,
    description,
    type = "SERVICE",
    category = "SOFTWARE",
  } = productDetails;

  // Step 1: Check if a product with the given customId exists
  const searchResponse = await fetch(
    `${baseUrl}/v1/catalogs/products?page_size=50`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error("Failed to fetch existing products");
  }

  const searchData = await searchResponse.json();
  const existingProduct = searchData.products?.find(
    (product) => product.id === customId
  );

  if (existingProduct) {
    return existingProduct; // Return existing product ID
  }

  // Step 2: If not found, create a new product
  const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: customId, // Assign the custom ID (if PayPal allows this)
      name,
      description,
      type,
      category,
    }),
  });

  const productData = await productResponse.json();

  console.log(productData);
  if (!productResponse.ok) {
    throw new Error(
      `Error creating product: ${productData.message || "Unknown error"}`
    );
  }

  return productData; // Return newly created Product ID
}

// Create Plan Function
export async function createPlan(
  accessToken,
  paypalProduct,
  {
    semesterStartYear,
    amount,
    billingAnchorDate,
    billingEndDate,
    isSameMonthAndYear,
    semester,
    year,
    bookedByUser,
    bookedForUser,
    bookedByUserEmail,
    roomId,
  }
) {
  const baseUrl =
    process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";
  let securityDeposit = Number(amount);
  console.log(paypalProduct, "From Line 343");

  let currentDate = new Date();
  let currentYear = currentDate.getFullYear().toString(); // Get current year as a string
  let currentMonth = currentDate.getMonth() + 1; // Get month (0-based index, so +1)
  let currentDay = currentDate.getDate(); // Get current day

  // List of months to check (February, March, ..., December)
  const validMonths = [2, 3, 4, 5, 9, 10, 11, 12]; // February, March, ..., December
  let totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Last day of current month

  // Calculate remaining days in the current month
  let remainingDays = totalDaysInMonth - currentDay;
  const midCharge =
    semesterStartYear.toString() === currentYear &&
    validMonths.includes(currentMonth);

  if (midCharge) {
    securityDeposit =
      Number(amount) + (Number(amount) * remainingDays) / totalDaysInMonth;
  }

  const cycles = getMonthsBetweenDates(billingAnchorDate, billingEndDate) + 1;

  const customDetails = {
    roomId,
    semester,
    year,
    bookedByUser,
    bookedForUser,
    bookedByUserEmail,
    amount,
    midCharge,
    isSameMonthAndYear,
  };
  const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: paypalProduct.id, // Use the product ID from the previous step
      name: `${paypalProduct.name} ${semester === "Summer" ? "Total" : "Monthly"} Subscription`,
      description: `${semester === "Summer" ? "Total" : "Monthly"} subscription for ${paypalProduct.name}. If Setup fee will be count as security deposit/on going month payment.`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles:
            isSameMonthAndYear || semester === "Summer" ? 1 : cycles,
          pricing_scheme: {
            fixed_price: {
              value:
                isSameMonthAndYear && semester !== "Summer" ? "0.01" : amount,
              currency_code: "EUR",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value:
            semester === "Summer" ? "0.01" : Number(securityDeposit).toFixed(2),
          currency_code: "EUR",
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
      custom_id: JSON.stringify(customDetails),
    }),
  });

  const planData = await planResponse.json();
  console.log(planData);
  if (!planResponse.ok) {
    throw new Error(
      `Error creating plan: ${planData.message || "Unknown error"}`
    );
  }

  return { planData, customDetails }; // Return Plan ID for later use
}

function getPayPalFormattedDate(date) {
  return date.toISOString().split(".")[0] + "Z"; // Removes milliseconds for PayPal
}

function getMonthsBetweenDates(startDate, endDate) {
  // Get the year and month of both dates
  let startYear = startDate.getFullYear();
  let startMonth = startDate.getMonth(); // Month is 0-indexed

  let endYear = endDate.getFullYear();
  let endMonth = endDate.getMonth(); // Month is 0-indexed

  // Calculate the total months difference
  let monthDifference = (endYear - startYear) * 12 + (endMonth - startMonth);

  return monthDifference;
}

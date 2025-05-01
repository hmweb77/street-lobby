import React from 'react';
import { sendEmail } from "./emailSender";

export const CustomerBookingEmail = ({ userName, paymentIntents = [], sessionUrl }) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Booking Confirmation</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto;">
      <div style="background: #f4f4f4; padding: 10px; text-align: center;">
        <h2 style="color: #333; margin: 0;">Booking Confirmation</h2>
      </div>
      
      <div style="padding: 20px;">
        <p style="color: #333;">Hi ${userName},</p>
        <p style="color: #333;">Your booking has been successfully processed. Below are the details:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tbody>
            <tr style="background: #f8f9fa;">
              <th style="padding: 8px; border: 1px solid #ddd;">Description</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Amount</th>
            </tr>
            ${paymentIntents.map((intent, index) => `
            <tr key="${index}">
              <td style="padding: 8px; border: 1px solid #ddd;">${intent.description}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${(intent.amount / 100).toFixed(2)} EUR</td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        <p style="color: #333;">Click the link below to complete your payment:</p>
        <a href="${sessionUrl}" 
           style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">
          Complete Payment
        </a>
      </div>
      
      <div style="background: #f4f4f4; padding: 10px; text-align: center;">
        <p style="color: #333; margin: 0;">Thank you for booking with us!</p>
      </div>
    </div>
  </body>
  </html>
  `;

  return htmlContent;
};

export const OwnerBookingEmail = ({ ownerName, userName, paymentIntents = [], customerEmail }) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>New Booking Alert</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto;">
      <div style="background: #f4f4f4; padding: 10px; text-align: center;">
        <h2 style="color: #333; margin: 0;">New Booking Alert</h2>
      </div>
      
      <div style="padding: 20px;">
        <p style="color: #333;">Hi ${ownerName},</p>
        <p style="color: #333;">You have a new booking processed from ${customerEmail}:</p>
        <p style="color: #333;">A new booking has been processed by ${userName}. Below are the payment details:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tbody>
            <tr style="background: #f8f9fa;">
              <th style="padding: 8px; border: 1px solid #ddd;">Description</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Amount</th>
            </tr>
            ${paymentIntents.map((intent, index) => `
            <tr key="${index}">
              <td style="padding: 8px; border: 1px solid #ddd;">${intent.description}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${(intent.amount / 100).toFixed(2)} EUR</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="background: #f4f4f4; padding: 10px; text-align: center;">
        <p style="color: #333; margin: 0;">Please review the booking details in your admin panel.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  return htmlContent;
}

export const sendBookingEmails = async ({ 
  userName, 
  customerEmail, 
  paymentIntents, 
  sessionUrl 
}) => {
  try {
    console.log(customerEmail);
    // Generate HTML email content
    const customerEmailHtml =
      CustomerBookingEmail ( {
        userName: userName ,
        paymentIntents: paymentIntents, 
        sessionUrl:sessionUrl
      }
    );

    const ownerEmailHtml = OwnerBookingEmail({
      customerEmail:customerEmail,
        ownerName: process.env.BREVO_OWNER_SENDER_NAME, 
        userName:userName, 
        paymentIntents: paymentIntents 
    });

    // Send email to Customer
     sendEmail({
      to: customerEmail,
      subject: "Booking Confirmation",
      htmlContent: customerEmailHtml,
      senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
      senderName: process.env.BREVO_OWNER_SENDER_NAME,
      params: {  // Add template parameters if needed
        userName,
        sessionUrl,
        paymentIntents
      }
    });

    // Send email to Owner
     sendEmail({
      to: process.env.BREVO_OWNER_SENDER_EMAIL,
      subject: "New Booking Alert",
      htmlContent: ownerEmailHtml,
      senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
      senderName: process.env.BREVO_OWNER_SENDER_NAME,
      params: {
        customerEmail,
        userName,
        paymentIntents
      }
    });

    console.log("Emails sent successfully!");
  } catch (error) {
    console.log(error);
    console.error("Error sending booking emails:", error);
    // throw error;
  }
};


export const BookingConfirmationEmail = ({ 
  userName, 
  paymentIntents = [], 
  totalPaid,
  bookingDate,
  bookingId
}) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Booking Confirmation</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f7f7f7;">
      <!-- Header -->
      <div style="background-color: #007bff; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">Booking Confirmed!</h1>
      </div>

      <!-- Main Content -->
      <div style="padding: 30px 20px; background-color: #ffffff;">
        <p style="font-size: 16px; margin: 0 0 15px 0;">Dear ${userName},</p>
        <p style="font-size: 16px; margin: 0 0 20px 0;">Thank you for your booking. Here are your payment details:</p>

        <!-- Booking Summary -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #007bff; margin: 0 0 10px 0;">Booking Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">Booking ID:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee;">Booking Date:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${new Date(bookingDate).toLocaleDateString()}</td>
            </tr>
          </table>
        </div>

        <!-- Payment Details -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #007bff; margin: 0 0 10px 0;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${paymentIntents.map(intent => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${intent.description}</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">€${(intent.amount / 100).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Total Paid -->
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px;">
            <table style="width: 100%;">
              <tr>
                <td style="font-weight: bold;">Total Paid:</td>
                <td style="text-align: right; font-weight: bold; color: #28a745;">€${(totalPaid / 100).toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Payment Confirmation -->
        <div style="background-color: #e9f5ff; padding: 15px; border-radius: 4px; margin-top: 20px;">
          <p style="margin: 0; font-size: 14px; color: #004085;">
            <strong>Payment Confirmation:</strong> 
            This email serves as confirmation of your payment. 
            Your transaction was completed on ${new Date().toLocaleDateString()}.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 20px; text-align: center; background-color: #f7f7f7;">
        <p style="font-size: 12px; color: #666666; margin: 0;">
          Need help? Contact us at <a href="mailto:support@yourcompany.com" style="color: #007bff; text-decoration: none;">support@yourcompany.com</a>
        </p>
        <p style="font-size: 12px; color: #666666; margin: 10px 0 0 0;">
          © ${new Date().getFullYear()} Your Company Name. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;

  return htmlContent;
};



export const RecurringPaymentEmail = ({ 
  customerName,
  paymentItems,
  totalAmount,
  currency = "EUR",
  invoiceId
}) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Payment Confirmation</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; color: #333333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f7f7f7;">
      <!-- Header -->
      <div style="background-color: #007bff; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Recurring Payment Summary</h1>
      </div>

      <!-- Main Content -->
      <div style="padding: 30px 20px; background-color: #ffffff;">
        <p style="font-size: 16px; margin: 0 0 15px 0;">Hello ${customerName},</p>
        <p style="font-size: 16px; margin: 0 0 20px 0;">We've processed your recurring payments:</p>

        <!-- Payment Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Period</th>
            </tr>
          </thead>
          <tbody>
            ${paymentItems.map((item, index) => `
            <tr key="${index}">
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                ${item.description || `Booking ${item.bookingId}`}
              </td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">
                ${currency === "EUR" ? "€" : "$"}${(item.amount / 100).toFixed(2)}
              </td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">
                ${formatter.format(new Date(item.periodStart))} - ${formatter.format(new Date(item.periodEnd))}
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Total Summary -->
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px;">
          <table style="width: 100%;">
            <tr>
              <td style="font-weight: bold;">Total Paid:</td>
              <td style="text-align: right; font-weight: bold; color: #28a745;">
                ${currency === "EUR" ? "€" : "$"}${(totalAmount / 100).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>Invoice ID:</td>
              <td style="text-align: right;">${invoiceId}</td>
            </tr>
          </table>
        </div>

        <p style="margin-top: 20px; font-size: 14px; color: #666666;">
          Thank you for your continued trust in our service.<br>
          Best regards,<br>
          The ${process.env.BREVO_OWNER_SENDER_NAME || "Booking Team"}
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 20px; text-align: center; background-color: #f7f7f7;">
        <p style="font-size: 12px; color: #666666; margin: 0;">
          Need assistance? Contact us at 
          <a href="mailto:${process.env.BREVO_OWNER_SENDER_EMAIL}" 
             style="color: #007bff; text-decoration: none;">
            ${process.env.BREVO_OWNER_SENDER_EMAIL}
          </a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};


export const PaymentUpdateEmail = ({ customerName, updateUrl }) => `
  <div>
    <h2>Dear ${customerName},</h2>
    <p>We encountered an issue processing your payment. Please update your payment method to continue your subscription.</p>
    <a href="${updateUrl}" style="padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
      Update Payment Method
    </a>
  </div>
`;

export const PaymentUpdateConfirmationEmail = ({ customerName }) => `
  <div>
    <h2>Hello ${customerName},</h2>
    <p>Your payment method has been successfully updated!</p>
    <p>Future payments will be processed using this new method.</p>
  </div>
`;

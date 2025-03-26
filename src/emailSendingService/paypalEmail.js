import { sendEmail } from "./emailSender";

// Add this function to your email templates file (e.g., paypalEmails.ts)
export const PayPalApprovalEmail = ({
  customerName,
  approvalDetails,
  totalAmount,
}) => {
  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }).format(amount);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #003087;">Complete Your Booking Payment</h2>
      <p>Dear ${customerName},</p>
      <p>Please complete your payment by approving the following subscriptions:</p>
      
      ${approvalDetails.map((detail, index) => `
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #003087; margin-top: 0;">
            ${detail.roomTitle} - ${detail.semester} ${detail.year}
          </h3>
          <p>Amount: ${formatCurrency(detail.amount)}</p>
          <a href="${detail.approvalUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #003087; 
                    color: white; text-decoration: none; border-radius: 5px;">
            Approve Payment ${index + 1}
          </a>
        </div>
      `).join('')}

      <div style="margin-top: 30px; font-size: 1.1em;">
        <strong>Total Amount:</strong> ${formatCurrency(totalAmount)}
      </div>
      
      <p style="margin-top: 30px;">
        <em>Please complete all payments to finalize your booking.</em>
      </p>
    </div>
  `;
};

// Add this function to your email sending service
export async function sendPaypalApprovalEmail(
  customerEmail, 
  customerName, 
  approvalDetails
) {
  try {
    const totalAmount = approvalDetails.reduce(
      (sum, detail) => sum + Number(detail.customDetails.amount), 
      0
    );

    const emailContent = PayPalApprovalEmail({
      customerName: customerName || customerEmail.split('@')[0],
      approvalDetails: approvalDetails.map(d => ({
        ...d.customDetails,
        approvalUrl: d.approvalUrl,
        roomTitle: d.customDetails.roomTitle
      })),
      totalAmount
    });

    await sendEmail({
      to: customerEmail,
      subject: `Complete Your Booking Payment - ${approvalDetails.length} Items Pending`,
      htmlContent: emailContent,
      senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
      senderName: process.env.BREVO_OWNER_SENDER_NAME,
    });

    // Optional: Send confirmation to admin
    await sendEmail({
      to: process.env.BREVO_OWNER_SENDER_EMAIL,
      subject: `New PayPal Payment Initiated - ${customerEmail}`,
      htmlContent: emailContent,
      senderEmail: process.env.BREVO_OWNER_SENDER_EMAIL,
      senderName: process.env.BREVO_OWNER_SENDER_NAME,
    });

  } catch (error) {
    console.error('Error sending PayPal approval email:', error);
  }
}


// email-templates.js
export const createSubscriptionActivatedEmail = ({ userName, roomDetails, paymentDetails }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Subscription Activated</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color: #f4f4f4; padding: 10px; text-align: center;">
            <h2 style="margin: 0;">Subscription Activated</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            <p>Hi ${userName},</p>
            <p>Your subscription has been successfully activated. Here are the details:</p>
            
            <table border="0" cellpadding="5" cellspacing="0" style="width: 100%; margin: 20px 0;">
              <tr>
                <td><strong>Room</strong></td>
                <td>${roomDetails}</td>
              </tr>
              <tr>
                <td><strong>Semester</strong></td>
                <td>${paymentDetails.semester} ${paymentDetails.year}</td>
              </tr>
              <tr>
                <td><strong>Initial Payment</strong></td>
                <td>${(paymentDetails.amount).toFixed(2)} EUR</td>
              </tr>
            </table>
            
            <p>You can manage your subscription through your account dashboard.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const createPaymentCompletedEmail = ({ userName, amount, paymentDate, description }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Received</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color: #f4f4f4; padding: 10px; text-align: center;">
            <h2 style="margin: 0;">Payment Received</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            <p>Hi ${userName},</p>
            <p>We've successfully processed your recent payment:</p>
            
            <table border="0" cellpadding="5" cellspacing="0" style="width: 100%; margin: 20px 0;">
              <tr>
                <td><strong>Amount</strong></td>
                <td>${(amount).toFixed(2)} EUR</td>
              </tr>
              <tr>
                <td><strong>Date</strong></td>
                <td>${new Date(paymentDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Description</strong></td>
                <td>${description}</td>
              </tr>
            </table>
            
            <p>Thank you for maintaining your subscription with us!</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};



export const createPaymentFailedEmail = ({ userName, amount, description, renewUrl }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Failed</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background-color: #ffe6e6; padding: 10px; text-align: center;">
            <h2 style="margin: 0; color: #cc0000;">Payment Failed</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            <p>Hi ${userName},</p>
            <p>We were unable to process your recent payment. Please update your payment method to continue your subscription.</p>
            
            <table border="0" cellpadding="5" cellspacing="0" style="width: 100%; margin: 20px 0;">
              <tr>
                <td><strong>Amount</strong></td>
                <td>${(amount).toFixed(2)} EUR</td>
              </tr>
              <tr>
                <td><strong>Description</strong></td>
                <td>${description}</td>
              </tr>
            </table>

            <p>Click below to update your payment details:</p>
            <a href="${renewUrl}" 
               style="display: inline-block; padding: 10px 20px; background-color: #cc0000; 
                      color: white; text-decoration: none; border-radius: 4px; margin-top: 15px;">
              Update Payment Method
            </a>
            
            <p style="margin-top: 20px; color: #666;">
              If you continue to experience issues, please contact our support team.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};




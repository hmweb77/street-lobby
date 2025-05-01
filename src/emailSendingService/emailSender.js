import fetch from 'node-fetch';

export const sendEmail = async ({
  to,
  subject,
  htmlContent,
  senderEmail,
  senderName,
  replyTo,
  headers,
  params,
}) => {
  try {
    // Construct sender object with fallback to environment variables
    const sender = {
      email: senderEmail || process.env.BREVO_OWNER_SENDER_EMAIL,
      name: senderName || process.env.BREVO_OWNER_SENDER_NAME,
    };

  
    // Normalize recipient format
    const recipients = Array.isArray(to) 
      ? to 
      : [{ email: to, name: senderName || sender.name }];

      // console.log(recipients);
    // Construct API request body
    const body = {
      sender,
      to: recipients,
      subject,
      htmlContent,
    };

    // Add optional fields
    if (replyTo) body.replyTo = replyTo;
    if (headers) body.headers = headers;
    if (params) body.params = params;

    // Make API request
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API Error: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Email sending failed:', error);
    // throw error; // Re-throw for upstream handling
  }
};


export const sendEmailWithAttachment = async ({
  to,
  subject,
  htmlContent,
  senderEmail,
  senderName,
  replyTo,
  headers,
  params,
  attachments = [],
}) => {
  try {
    const sender = {
      email: senderEmail || process.env.BREVO_OWNER_SENDER_EMAIL,
      name: senderName || process.env.BREVO_OWNER_SENDER_NAME,
    };

    const recipients = Array.isArray(to)
      ? to
      : [{ email: to, name: senderName || sender.name }];

    const body = {
      sender,
      to: recipients,
      subject,
      htmlContent,
    };

    if (replyTo) body.replyTo = replyTo;
    if (headers) body.headers = headers;
    if (params) body.params = params;

    // ✅ Attachments as Base64 encoded
    if (attachments.length > 0) {
      body.attachment = attachments.map(({ base64Content, name }) => ({
        name: name || "booking-periods.xlsx",
        content: base64Content,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // MIME type for .xlsx
      }));
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Brevo API Error: ${errorData.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Email sending failed:", error);
    // throw error;
  }
};


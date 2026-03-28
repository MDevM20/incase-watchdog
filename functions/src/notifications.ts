import * as admin from "firebase-admin";
import { Resend } from "resend";
import { getEmergencyAccessTemplate } from "./templates";
import { maskEmail } from "./utils";

// Resend is initialized inside the sendEmail function to ensure environment variables are correctly loaded.

/**
 * Sends a push notification via FCM.
 */
export async function sendPushNotification(token: string, title: string, body: string) {
  const message = {
    notification: {
      title,
      body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent FCM message:", response);
  } catch (error) {
    console.error("Error sending FCM message:", error);
  }
}

/**
 * Sends an email via Resend.
 */
export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_your_api_key") {
    console.error("RESEND_API_KEY is not set or is using the placeholder value.");
    return;
  }

  if (!to) {
    console.error("sendEmail called without a recipient address.");
    return;
  }

  const resend = new Resend(apiKey);

  try {
    console.log(`Attempting to send email to: ${maskEmail(to)} (Subject: ${subject})`);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "InCase <incase@queentia.org>";
    const response = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      text,
      html: html || text,
    });

    if (response && (response as any).error) {
      console.error("Error response from Resend:", JSON.stringify((response as any).error));
    } else {
      const emailId = (response as any)?.id || (response as any)?.data?.id;
      if (emailId) {
        console.log("Successfully sent email via Resend. ID:", emailId);
      } else {
        console.warn("Resend reported success but no ID was returned. Full response:", JSON.stringify(response));
      }
    }
  } catch (err) {
    console.error("Unexpected exception in sendEmail:", err);
  }
}

/**
 * Sends a rich Emergency Access notification email.
 */
export async function sendEmergencyAccessEmail(to: string, data: {
  ownerName: string;
  fileUrl: string;
  masterKey: string;
  hint: string;
  fileId: string;
}) {
  const html = getEmergencyAccessTemplate(data);
  const subject = `Emergency Access Granted for ${data.ownerName || "the Vault"}`;
  const text = `Emergency Access has been granted for ${data.ownerName}'s vault. Master Key: ${data.masterKey}, Hint: ${data.hint}.`;
  
  return sendEmail(to, subject, text, html);
}


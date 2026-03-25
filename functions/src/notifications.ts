import * as admin from "firebase-admin";
import { Resend } from "resend";

// Initialize Resend with API Key (should be in Secret Manager or Process Env)
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_your_api_key";
const resend = new Resend(RESEND_API_KEY);

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
  try {
    const { data, error } = await resend.emails.send({
      from: "Watchdog <onboarding@resend.dev>", // Change to your verified sender
      to: [to],
      subject,
      text,
      html: html || text,
    });

    if (error) {
      console.error("Error sending email via Resend:", error);
    } else {
      console.log("Successfully sent email via Resend:", data?.id);
    }
  } catch (err) {
    console.error("Unexpected error sending email via Resend:", err);
  }
}

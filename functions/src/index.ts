import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { WatchdogTimer, DecryptedPayload } from "./types";
import { decryptPayload } from "./crypto";
import { sendPushNotification, sendEmail } from "./notifications";

admin.initializeApp();

/**
 * Daily Sweep Function (CRON-triggered every 24 hours).
 * Checks the last_ping of all active watchdog timers and escalates or triggers.
 */
export const sweepWatchdog = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const twentyDays = 20 * 24 * 60 * 60 * 1000;
    const twentyFiveDays = 25 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const querySnapshot = await db
      .collection("watchdog_timers")
      .where("status", "!=", "triggered")
      .get();

    const batch = db.batch();

    for (const doc of querySnapshot.docs) {
      const data = doc.data() as WatchdogTimer;
      const age = now.toMillis() - data.last_ping.toMillis();

      // Day 30+: Trigger/Release
      if (age >= thirtyDays) {
        try {
          const payload: DecryptedPayload = await decryptPayload(data.encrypted_payload);
          
          await sendEmail(
            payload.recipient_email,
            "Secure Vault Release: Watchdog Triggered",
            `A security watchdog has expired. You are receiving File ID: ${payload.file_id} and Key Part A: ${payload.key_part_a}.`
          );

          batch.update(doc.ref, { status: "triggered" });
          console.log(`Watchdog ${doc.id} triggered.`);
        } catch (error) {
          console.error(`Failed to trigger watchdog ${doc.id}:`, error);
        }
      } 
      // Day 25: Warning 2
      else if (age >= twentyFiveDays && data.status === "warning_1") {
        await sendPushNotification(
          data.fcm_token,
          "Final Warning",
          "Final Warning: Your secure vault will be shared in 5 days."
        );
        // Also send email to the user (if we have their email in the payload or separately)
        // For now, let's assume FCM is the primary warning channel as per requirements.
        
        batch.update(doc.ref, { status: "warning_2" });
        console.log(`Watchdog ${doc.id} set to warning_2.`);
      } 
      // Day 20: Warning 1
      else if (age >= twentyDays && data.status === "active") {
        await sendPushNotification(
          data.fcm_token,
          "Check-in required!",
          "Your watchdog triggers in 10 days."
        );
        batch.update(doc.ref, { status: "warning_1" });
        console.log(`Watchdog ${doc.id} set to warning_1.`);
      }
    }

    await batch.commit();
    return null;
  });

/**
 * Ping Function (HTTPS Caller).
 * Resets the watchdog timer.
 */
export const pingWatchdog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const { blindId } = data;
  if (!blindId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing blindId");
  }

  const db = admin.firestore();
  const watchdogRef = db.collection("watchdog_timers").doc(blindId);

  await watchdogRef.update({
    last_ping: admin.firestore.Timestamp.now(),
    status: "active",
  });

  return { success: true };
});

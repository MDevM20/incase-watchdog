import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { WatchdogTimer, DecryptedPayload } from "./types";
import { decryptPayload } from "./crypto";
import { sendPushNotification, sendEmail } from "./notifications";

admin.initializeApp();

/**
 * Create Function (HTTPS Caller).
 * Initializes a new watchdog and returns a secret_token.
 */
export const createWatchdog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const { blindId, fcm_token, encrypted_payload } = data;
  if (!blindId || !fcm_token || !encrypted_payload) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  // Generate a random secret token
  const secretToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(secretToken).digest("hex");

  const db = admin.firestore();
  await db.collection("watchdog_timers").doc(blindId).set({
    last_ping: admin.firestore.Timestamp.now(),
    status: "active",
    fcm_token,
    encrypted_payload,
    hashed_token: hashedToken,
  });

  return { secret_token: secretToken };
});

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
 * Resets the watchdog timer. Requires the secret_token.
 */
export const pingWatchdog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const { blindId, secret_token } = data;
  if (!blindId || !secret_token) {
    throw new functions.https.HttpsError("invalid-argument", "Missing blindId or secret_token");
  }

  const db = admin.firestore();
  const watchdogRef = db.collection("watchdog_timers").doc(blindId);
  const doc = await watchdogRef.get();

  if (!doc.exists) {
    throw new functions.https.HttpsError("not-found", "Watchdog not found");
  }

  const watchdog = doc.data() as WatchdogTimer;
  const providedHash = crypto.createHash("sha256").update(secret_token).digest("hex");

  if (watchdog.hashed_token !== providedHash) {
    throw new functions.https.HttpsError("permission-denied", "Invalid secret_token");
  }

  await watchdogRef.update({
    last_ping: admin.firestore.Timestamp.now(),
    status: "active",
  });

  return { success: true };
});

/**
 * Delete Function (HTTPS Caller).
 * Completely removes a watchdog timer. Requires the secret_token.
 */
export const deleteWatchdog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const { blindId, secret_token } = data;
  if (!blindId || !secret_token) {
    throw new functions.https.HttpsError("invalid-argument", "Missing blindId or secret_token");
  }

  const db = admin.firestore();
  const watchdogRef = db.collection("watchdog_timers").doc(blindId);
  const doc = await watchdogRef.get();

  if (!doc.exists) {
    return { success: true };
  }

  const watchdog = doc.data() as WatchdogTimer;
  const providedHash = crypto.createHash("sha256").update(secret_token).digest("hex");

  if (watchdog.hashed_token !== providedHash) {
    throw new functions.https.HttpsError("permission-denied", "Invalid secret_token");
  }

  await watchdogRef.delete();

  return { success: true };
});

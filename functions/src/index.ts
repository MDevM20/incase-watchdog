import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { WatchdogTimer, DecryptedPayload } from "./types";
import { decryptPayload } from "./watchdog_crypto";
import { sendPushNotification, sendEmail, sendEmergencyAccessEmail } from "./notifications";

admin.initializeApp();

/**
 * Create Function (HTTPS Caller).
 * Initializes a new watchdog and returns a secret_token.
 */
export const createWatchdog = functions
  .runWith({ secrets: ["RESEND_API_KEY", "WATCHDOG_PRIVATE_KEY"] })
  .https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const { blindId, fcm_token, encrypted_payload, is_test_mode } = data;
  if (!blindId || !fcm_token || !encrypted_payload) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  // 1. Decrypt the payload to extract protocol configuration
  const payload: DecryptedPayload = await decryptPayload(encrypted_payload);

  // 2. Generate a random secret token
  const secretToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(secretToken).digest("hex");

  const lastPing = is_test_mode 
    ? admin.firestore.Timestamp.fromMillis(Date.now() - (31 * 24 * 60 * 60 * 1000))
    : admin.firestore.Timestamp.now();

  // 3. Persist the watchdog with strategy details
  const db = admin.firestore();
  await db.collection("watchdog_timers").doc(blindId).set({
    last_ping: lastPing,
    status: "active",
    fcm_token,
    encrypted_payload, // Keep for legacy/audit
    hashed_token: hashedToken,
    
    // Extracted Fields for easy sweeping
    sharing_strategy: payload.sharing_strategy,
    public_link: payload.public_link || null,
    guardian_emails: payload.guardian_emails || [],
    share_3: payload.share_3,
    file_id: payload.file_id,
    reminder_intervals: payload.reminder_intervals || [10, 15, 20],
    owner_name: payload.owner_name || null,
    hint: payload.hint || null,
  });

  if (is_test_mode) {
    console.log(`Test mode: triggering immediate sweep for ${blindId}`);
    await runSweep();
  }

  return { secret_token: secretToken };
});

/**
 * Daily Sweep Function (CRON-triggered every 24 hours).
 */
export const sweepWatchdog = functions
  .runWith({ secrets: ["RESEND_API_KEY", "WATCHDOG_PRIVATE_KEY"] })
  .pubsub.schedule("every 24 hours")
  .onRun(async (context) => {
    return runSweep();
  });

/**
 * Core Sweep Logic.
 */
async function runSweep() {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  
  console.log(`Starting watchdog sweep at ${now.toDate().toISOString()}`);

  const querySnapshot = await db
    .collection("watchdog_timers")
    .where("status", "!=", "triggered")
    .get();

  for (const doc of querySnapshot.docs) {
    const data = doc.data() as WatchdogTimer;
    if (!data.last_ping) continue;

    const age = now.toMillis() - data.last_ping.toMillis();
    const intervals = data.reminder_intervals || [20, 25, 30];
    
    // Map intervals to millisecond thresholds
    const day20 = intervals[0] * 24 * 60 * 60 * 1000;
    const day25 = intervals[1] * 24 * 60 * 60 * 1000;
    const day30 = intervals[2] * 24 * 60 * 60 * 1000;

    try {
      // Threshold 3: Execution (e.g. Day 30)
      if (age >= day30) {
        console.log(`Watchdog ${doc.id} reached threshold. Executing protocol...`);
        
        // Strategy-specific Execution
        if (data.sharing_strategy === "google_drive_jit") {
          const { grantGuardianAccess } = require("./google_drive_admin");
          await grantGuardianAccess(data.file_id!, data.guardian_emails!);
        }

        // Notify Guardians
        for (const email of data.guardian_emails || []) {
          await sendEmergencyAccessEmail(email, {
            ownerName: data.owner_name || "the Vault Owner",
            fileUrl: data.file_id 
              ? `https://drive.google.com/file/d/${data.file_id}/view` 
              : (data.public_link || "https://drive.google.com"),
            masterKey: data.share_3 || "N/A",
            hint: data.hint || "Please refer to original setup.",
            fileId: data.file_id || "vault_file"
          });
        }

        await doc.ref.update({ status: "triggered", triggered_at: now });
      } 
      // Threshold 2: Warning (e.g. Day 25)
      else if (age >= day25 && data.status === "warning_1") {
        await sendPushNotification(data.fcm_token, "Final Warning", "Watchdog triggers in 5 days.");
        await doc.ref.update({ status: "warning_2" });
      } 
      // Threshold 1: Reminder (e.g. Day 20)
      else if (age >= day20 && data.status === "active") {
        await sendPushNotification(data.fcm_token, "Check-in required!", "Watchdog triggers in 10 days.");
        await doc.ref.update({ status: "warning_1" });
      }
    } catch (error) {
      console.error(`Error processing watchdog ${doc.id}:`, error);
    }
  }
}

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

import { Timestamp } from "firebase-admin/firestore";

export type WatchdogStatus = "active" | "warning_1" | "warning_2" | "triggered";

export interface WatchdogTimer {
  last_ping: Timestamp;
  status: WatchdogStatus;
  fcm_token: string;
  encrypted_payload: string; // Encrypted with Server's Public RSA Key
}

export interface DecryptedPayload {
  recipient_email: string;
  file_id: string;
  key_part_a: string;
}

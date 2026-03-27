import { Timestamp } from "firebase-admin/firestore";

export type WatchdogStatus = "active" | "warning_1" | "warning_2" | "triggered";
export type SharingStrategy = "google_drive_jit" | "google_drive_link" | "icloud_link";

export interface WatchdogTimer {
  last_ping: Timestamp;
  status: WatchdogStatus;
  fcm_token: string;
  encrypted_payload: string; // Encrypted with Server's Public RSA Key
  hashed_token: string;     // Hashed secret token for ownership verification
  
  // New Protocol Fields (Extracted from decrypted payload)
  sharing_strategy?: SharingStrategy;
  public_link?: string;
  guardian_emails?: string[];
  share_3?: string;
  file_id?: string;
  reminder_intervals?: number[]; // [20, 25, 30]
  owner_name?: string;           // Optional: For personalized emails
  hint?: string;                 // Optional: For Part 2 of the recovery key
}

export interface DecryptedPayload {
  sharing_strategy: SharingStrategy;
  public_link?: string;
  guardian_emails: string[];
  share_3: string;
  file_id: string;
  reminder_intervals: number[];
  owner_name?: string;
  hint?: string;
}

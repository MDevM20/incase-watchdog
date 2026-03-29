import { Timestamp } from "firebase-admin/firestore";

export type WatchdogStatus = "active" | "warning_1" | "warning_2" | "triggered";
export type SharingStrategy = 
  | "google_drive_jit" | "googleDriveJit" 
  | "google_drive_link" | "googleDriveLink" 
  | "icloud_link" | "icloudLink" 
  | string;

export interface WatchdogTimer {
  last_ping: Timestamp;
  status: WatchdogStatus;
  fcm_token: string;         // Plain text for now to allow push notifications without decryption if needed?
                             // User specified: "inclusive of guardian_emails...". 
                             // If we want truly private, fcm_token should be encrypted too.
                             // I will keep it in plain text *if* the server needs it for push.
                             // But I will add it to DecryptedPayload later if I move it.
  encrypted_payload: string; // Encrypted with Server's Public RSA Key
  hashed_token: string;     // Hashed secret token for ownership verification
  
  // Custom Protocol Fields (Extracted from decrypted payload)
  // These are now OPTIONAL as they might only live in the encrypted_payload
  sharing_strategy?: SharingStrategy; 
  reminder_intervals?: number[]; // [20, 25, 30]

  // SENSITIVE PII (Deprecated from root document - move to encrypted_payload)
  public_link?: string;
  guardian_emails?: string[];
  share_3?: string;
  file_id?: string;
  owner_name?: string;
  hint?: string;
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
  fcm_token?: string; // New field for encrypted-at-rest FCM tokens
}


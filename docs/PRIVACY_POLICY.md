# Privacy Policy for InCase

**Effective Date: March 28, 2026**

## 1. Introduction
InCase is a digital sanctuary for your most important documents and emergency protocols. Our core mission is to empower users with secure, sovereign control over their data. We operate on a **Zero-Knowledge** principle: we do not have access to your unencrypted files, your master recovery keys, or your personal identification.

## 2. Information We Collect and How We Use It

### A. On-Device Data (Local)
*   **Vault Metadata**: Descriptions, category names, and mapping settings are stored in a secure local database on your device.
*   **Biometric Data**: If enabled, we use system-level biometric authentication (FaceID/TouchID/Fingerprint) to unlock the app. This data is handled exclusively by your operating system and is never accessible to InCase.

### B. Cloud Storage (User-Owned)
*   **Encrypted Vault PDF**: When you perform a backup, an AES-256 encrypted PDF is uploaded to your personal Google Drive or iCloud account. 
*   **Access Control**: We do not store the password to these files. You retain sole ownership and control over your cloud storage.

### C. InCase Watchdog Server
The optional Watchdog service monitors your activity to ensure your data is released to your loved ones if you are unable to do so. The following data is stored on our secure `incase_watchdog` infrastructure:

*   **Blind ID**: A randomly generated identifier used to link your device to the watchdog record without requiring a personal account.
*   **Encrypted Payload**: A package containing operational data, which the server securely decrypts to perform its duties:
    *   **Guardian Emails**: Used solely to notify your designated guardians if an emergency is triggered.
    *   **One Shamir Share**: A single mathematical piece of your recovery key. This share is useless on its own and cannot decrypt your vault without the other pieces held by you or your guardians.
    *   **Cloud File ID/Link**: The identifier for your encrypted vault, provided to guardians only after the protocol is triggered.
    *   **Notifications (FCM Token)**: A temporary token used to send check-in reminders to your device.

### D. Optional Contextual Data
To assist your guardians during a recovery event, you may choose to provide:
*   **Owner Name**: A nickname or name (e.g., "John Doe") so guardians recognize the source of the emergency alert.
*   **Recovery Hint**: A custom textual hint to help guardians remember their part of the manual recovery process.
*   **Reminder Intervals**: Your custom preference for how often the app should remind you to check-in.

## 3. Data Retention and Deletion
*   **Sovereignty**: Your local data remains on your device and is deleted if the app is uninstalled.
*   **Watchdog Deactivation**: You can deactivate the Watchdog protocol at any time within the app. This action immediately and permanently deletes all associated data from the `incase_watchdog` server.
*   **Protocol Completion**: Once an emergency protocol is fully executed (guardian notifications sent), the server-side record is automatically purged.

## 4. Security Measures
*   **Encryption**: All vault data is encrypted using industry-standard AES-256.
*   **Key Management**: We use Shamir's Secret Sharing (SSS) to ensure that no single entity—including InCase—holds the complete key to your data.
*   **Transport**: All communication between the app and the Watchdog server is secured via hybrid RSA-OAEP and AES-GCM encryption.

## 5. Third-Party Services
*   **Firebase**: Used for anonymous authentication and cloud functions (Watchdog logic).
*   **Google Drive / iCloud**: Used for storage of your encrypted vault.
*   **Resend**: Used for sending automated email notifications to guardians.

## 6. Contact Us
For questions regarding this Privacy Policy or our security practices, please contact us via the official repository or support channels.

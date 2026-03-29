# Terms of Service for InCase

**Effective Date: March 29, 2026**

Welcome to InCase ("the App", "we", "our"). By using the InCase application and the InCase Watchdog service (collectively, "the Service"), you agree to the following terms. Please read them carefully.

---

## 1. Description of Service

InCase is a digital sanctuary for your most important documents and emergency protocols. The Service provides two primary functions:
*   **Secure Vault Preservation**: Client-side encryption of your sensitive files using AES-256.
*   **InCase Watchdog**: An automated "Dead Man's Switch" that triggers a recovery protocol if you fail to check-in (ping) within a specified timeframe (defaulting to 30 days).

---

## 2. Zero-Knowledge Architecture & Data Sovereignty

### A. No Access to Unencrypted Data
InCase is built on a **Zero-Knowledge** principle. All encryption occurs locally on your device before any data is transmitted or backed up. We do not have access to your:
*   Unencrypted files or documents.
*   Master recovery keys or passwords.
*   Biometric data.

### B. Shamir's Secret Sharing (SSS)
The Service utilizes mathematical key fragmentation. No single entity—including InCase—holds enough information to decrypt your vault. You are the sole curator of your recovery system.

---

## 3. User Responsibilities (Critical)

Your use of InCase requires strict adherence to these responsibilities. **Failure to do so may result in permanent loss of access to your data.**

*   **Key Management**: You are solely responsible for securing your master recovery key and any manual Shamir shards. If you lose your master key and do not have a functional Watchdog protocol, **your data is unrecoverable.**
*   **Guardian Selection**: You must ensure that your designated guardians are trustworthy and their contact information is accurate.
*   **Watchdog Maintenance**: The Watchdog service depends on your periodic check-ins ("pings"). It is your responsibility to ensure the app is functioning and can communicate with our servers to reset the timer.
*   **Third-Party Accounts**: You are responsible for maintaining access to your Google Drive or iCloud accounts used for encrypted storage.

---

## 4. The Watchdog Protocol Trigger

The Watchdog service monitors your activity. If the timer expires (default 30 days of inactivity):
1.  **Escalation**: We will attempt to notify you via FCM push notifications before the final trigger.
2.  **Release**: Upon expiration, the Watchdog will automatically release a single mathematical key fragment and access instructions to your designated guardians via email.
3.  **Completion**: Once the protocol is executed, your server-side record is purged.

---

## 5. Limitation of Liability

**TO THE MAXIMUM EXTENT PERMITTED BY LAW, INCASE AND ITS DEVELOPERS SHALL NOT BE LIABLE FOR:**
*   **Data Loss**: Any loss of data due to forgotten passwords, lost master keys, or expired cloud storage accounts.
*   **Failed Recovery**: The failure of the Watchdog protocol to trigger or the inability of guardians to successfully reconstruct the key.
*   **Unauthorized Access**: Any unauthorized access to your device or cloud storage that leads to vault compromise.
*   **Service Interruptions**: Temporary unavailability of the Watchdog server or notification systems (FCM, email).

---

## 6. Prohibited Activities

You agree not to use the Service for:
*   Storing illegal material or content that violates third-party rights.
*   Attempting to circumvent our encryption or security measures.
*   Abusing the Watchdog system or harassing guardians.

---

## 7. Account Deletion & Data Retention

You may deactivate your Watchdog and delete your data at any time within the App. This action is **permanent and immediate**. We do not retain backups of your server-side data once deleted or once the protocol is completed.

---

## 8. Changes to Terms

We may update these Terms from time to time. Your continued use of the Service after changes are made constitutes acceptance of the new Terms.

---

## 9. Governing Law

These Terms shall be governed by and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.

---

## 10. Contact Us

For questions regarding these Terms or the technical operation of the Service, please contact us via the official repository or support channels.

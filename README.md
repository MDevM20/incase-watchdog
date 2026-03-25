# InCase Watchdog - Anonymous Dead Man's Switch

A secure, anonymous "Dead Man's Switch" built with Firebase Cloud Functions. It manages a 30-day timer, sends warnings via FCM push notifications, and automatically releases a key fragment to a recipient upon expiration.

## 🚀 Features

- **Anonymous**: Uses client-generated BlindIDs (Hashed Email + DeviceSalt).
- **Secure**: Uses RSA decryption for sensitive payloads, with private keys stored securely in **Google Secret Manager**.
- **Automated**: A daily sweep function (CRON) handles escalation and trigger logic.
- **Multi-channel Notifications**: FCM for push warnings (Day 20/25) and Resend for final key release (Day 30).

## 🛠️ Technology Stack

- **Database**: Firebase Firestore.
- **Execution**: Firebase Cloud Functions (Node.js/TypeScript).
- **Security**: Google Secret Manager.
- **Communication**: FCM (Push) & Resend (Email).
- **Trigger**: Cloud Scheduler (CRON job).

## 📂 Project Structure

- `functions/`: The core backend logic.
  - `src/index.ts`: The `sweepWatchdog` and `pingWatchdog` functions.
  - `src/crypto.ts`: RSA Decryption and Secret Manager integration.
  - `src/notifications.ts`: FCM and Resend utilities.
  - `src/types.ts`: Firestore schema.
- `setup_infrastructure.ps1`: Helper script for RSA keys and Secret Manager setup.

## 🚦 Getting Started

### 1. Prerequisites
- Firebase CLI (`npm install -g firebase-tools`).
- Google Cloud CLI (`gcloud`).
- OpenSSL (for key generation).
    - **Windows**: `winget install openssl` (or install [Git for Windows](https://git-scm.com/download/win)).
    - **macOS**: `brew install openssl`
    - **Linux (Ubuntu/Debian)**: `sudo apt install openssl`
- A [Resend](https://resend.com/) account for email notifications.

### 🛠️ Troubleshooting OpenSSL (Windows)
If `openssl` is not recognized after installation:
1.  **Run the Setup Script**: The `setup_infrastructure.ps1` script now includes advanced detection that can find OpenSSL even if it's not in your PATH (e.g., in `C:\Program Files\OpenSSL-Win64\bin`).
2.  **Manual Path**: If you need to run it manually, it is likely at `C:\Program Files\OpenSSL-Win64\bin\openssl.exe`.
3.  **Add to PATH (Optional)**:
    -   Search for "System Environment Variables" in Windows Search.
    -   Click **Environment Variables** -> Select **Path** under **System variables** -> Click **Edit**.
    -   Click **New** and add: `C:\Program Files\OpenSSL-Win64\bin`.
    -   **Restart your terminal**.

### 2. Firebase Console Setup
Before deploying, you must manually enable the following services in the [Firebase Console](https://console.firebase.google.com/):

#### A. Enable Anonymous Authentication
1. Go to **Build** > **Authentication** > **Get Started**.
2. Go to the **Sign-in method** tab.
3. Select **Anonymous**, enable it, and click **Save**.

#### B. Initialize Firestore
1. Go to **Build** > **Firestore Database** > **Create database**.
2. Choose your location and start in **Production mode** (Security Rules are already provided in the project).
3. Click **Enable**.

### 3. Infrastructure Setup
Run the setup script to generate RSA keys, set your **Project ID**, and upload the private key and **Resend API Key** to Google Secret Manager:
```powershell
./setup_infrastructure.ps1
```

> [!NOTE]
> The script will prompt you for your Resend API Key. This key is stored securely in Secret Manager and accessed by the Cloud Functions at runtime.

### 4. Environment Variables (Local Development)
For local testing or if you prefer not to use Secret Manager for all variables, copy the example environment file:
```bash
cp functions/.env.example functions/.env
```
Update `functions/.env` with your project-specific values.

### 5. Deployment
```bash
cd functions
npm install
npm run deploy
```

## 🔍 Usage

### 1. Register a Watchdog
Insert a new document into the `watchdog_timers` collection in Firestore:
- **ID**: `BlindID`
- **Fields**:
  - `last_ping`: (Timestamp)
  - `status`: `"active"`
  - `fcm_token`: (String)
  - `encrypted_payload`: (String) Base64 encoded payload encrypted with the Public RSA Key.

### 2. Payload Structure (JSON)
Before encryption, the payload should look like this:
```json
{
  "recipient_email": "recipient@example.com",
  "file_id": "SECURE_FILE_ID",
  "key_part_a": "SECRET_KEY_FRAGMENT"
}
```

### 3. Checking In (Ping)
Call the `pingWatchdog` function via your client app to reset the 30-day timer:
```typescript
firebase.functions().httpsCallable('pingWatchdog')({ blindId: '...' });
```

## ⚖️ License
MIT

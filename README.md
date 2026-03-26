# InCase Watchdog — Anonymous Dead Man's Switch

A secure, anonymous "Dead Man's Switch" built with Firebase Cloud Functions. It manages a 30-day timer, sends escalating warnings via FCM push notifications, and automatically releases an encrypted key fragment to a recipient upon expiration.

## 🚀 Features

- **Anonymous**: Uses client-generated BlindIDs (Hashed Email + DeviceSalt) — no personal data stored.
- **Secure**: RSA-encrypted payloads with private keys stored in **Google Secret Manager**.
- **Automated**: A daily CRON sweep handles escalation (Day 20 / Day 25) and final trigger (Day 30).
- **Multi-channel**: FCM push warnings + Resend email for key release.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Database | Firebase Firestore |
| Functions | Firebase Cloud Functions (Node.js 22 / TypeScript) |
| Secrets | Google Secret Manager |
| Notifications | Firebase FCM (push) + Resend (email) |
| Scheduler | Cloud Scheduler (CRON) |

## 📂 Project Structure

```
incase-watchdog/
├── functions/
│   ├── src/
│   │   ├── index.ts          # sweepWatchdog (CRON) & pingWatchdog (HTTPS)
│   │   ├── crypto.ts         # RSA decryption + Secret Manager
│   │   ├── notifications.ts  # FCM push + Resend email
│   │   └── types.ts          # Firestore schema types
│   ├── .env.example          # Environment variable template
│   └── package.json
├── setup_infrastructure.ps1  # RSA key generation + Secret Manager setup
├── firebase.json
└── .env                      # Your local config (never commit this)
```

## 🚦 Getting Started

### 1. Prerequisites

Install the following tools:

- **Firebase CLI**: `npm install -g firebase-tools`
- **Google Cloud CLI**: [install guide](https://cloud.google.com/sdk/docs/install)
- **OpenSSL**:
  - Windows: `winget install openssl` or install via [Git for Windows](https://git-scm.com/download/win)
  - macOS: `brew install openssl`
  - Linux: `sudo apt install openssl`
- A **[Resend](https://resend.com/)** account for email notifications.

Also authenticate both CLIs:
```bash
firebase login
gcloud auth login
```

### 2. Configure Your `.env` File

Create a `.env` file in the **project root** with:
```env
GCP_PROJECT=your-firebase-project-id
RESEND_API_KEY=re_your_api_key_here
```

> [!IMPORTANT]
> The `.env` file is used by `setup_infrastructure.ps1` at setup time. A separate `functions/.env` is used for local Cloud Functions development/emulation. Copy the template: `cp functions/.env.example functions/.env`

### 3. Enable Firebase Services

In the [Firebase Console](https://console.firebase.google.com/), manually enable:

#### A. Anonymous Authentication
1. Go to **Build** > **Authentication** > **Sign-in method**.
2. Enable **Anonymous** and click **Save**.

#### B. Firestore Database
1. Go to **Build** > **Firestore Database** > **Create database**.
2. Select your region and start in **Production mode**.
3. Click **Enable**.

### 4. Run Infrastructure Setup

From the project root, run the PowerShell setup script:
```powershell
./setup_infrastructure.ps1
```

This script will:
- ✅ Detect OpenSSL (even if not in your PATH)
- ✅ Check Firestore is initialized
- ✅ Generate a 2048-bit RSA key pair
- ✅ Upload the private key to Google Secret Manager
- ✅ Upload your `RESEND_API_KEY` to Google Secret Manager

> [!NOTE]
> The `public_key.pem` in the project root is used by the client app to encrypt payloads before storing them in Firestore.

### 5. Deploy Cloud Functions

From the **project root**, run:
```bash
firebase deploy --only functions
```

To target a specific project explicitly:
```bash
firebase deploy --only functions --project your-firebase-project-id
```

> [!TIP]
> On first deploy, Firebase will ask how many days to keep container images in Artifact Registry. Enter `1` to minimize storage costs.

---

## 🔍 Usage

### 1. Register a Watchdog

Instead of writing directly to Firestore, call the `createWatchdog` HTTPS callable function. This function generates a `secret_token` for the client and stores a hash of it on the server for security.

```typescript
const create = firebase.functions().httpsCallable('createWatchdog');
const { data } = await create({
  blindId: 'your-blind-id',
  fcm_token: 'your-fcm-token',
  encrypted_payload: 'base64-rsa-encrypted-payload'
});

const secretToken = data.secret_token; // SAVE THIS SECURELY (e.g., Keychain)
```

**Fields stored in Firestore:**
| Field | Type | Description |
|---|---|---|
| `last_ping` | Timestamp | Time of last check-in |
| `status` | String | `"active"` |
| `fcm_token` | String | Client device FCM token |
| `encrypted_payload` | String | Base64-encoded RSA-encrypted payload |
| `hashed_token` | String | SHA-256 hash of the client's secret token |

### 2. Payload Structure (JSON)

```json
{
  "recipient_email": "recipient@example.com",
  "file_id": "SECURE_FILE_ID",
  "key_part_a": "SECRET_KEY_FRAGMENT"
}
```

### 3. Checking In (Ping)

Call the `pingWatchdog` function via your client app to reset the 30-day timer. You must provide the `secret_token` returned during registration.

```typescript
const ping = firebase.functions().httpsCallable('pingWatchdog');
await ping({ 
  blindId: 'your-blind-id', 
  secret_token: 'your-saved-token' 
});
```

### 4. Deleting a Watchdog

Call the `deleteWatchdog` function to completely remove a timer. Requires the `secret_token`.

```typescript
const remove = firebase.functions().httpsCallable('deleteWatchdog');
await remove({ 
  blindId: 'your-blind-id', 
  secret_token: 'your-saved-token' 
});
```

Requires **Anonymous Authentication** to be signed in.

---

## 🧪 Testing

### Manually Triggering `sweepWatchdog`

The sweep function runs on a daily CRON schedule. To trigger it manually for testing:

#### Option 1 — Firebase Console (easiest for deployed functions)
1. Go to the [Cloud Scheduler page](https://console.cloud.google.com/cloudscheduler) in GCP.
2. Find the job named `firebase-schedule-sweepWatchdog-us-central1`.
3. Click **Force run**.

#### Option 2 — gcloud CLI
```bash
gcloud scheduler jobs run firebase-schedule-sweepWatchdog-us-central1 \
  --location us-central1 \
  --project your-firebase-project-id
```

#### Option 3 — Manual Trigger via `forceSweepWatchdog` (Recommended)
You can call the new `forceSweepWatchdog` HTTPS function directly via the Firebase CLI shell. This is the fastest way to test the sweep logic and see immediate results in the logs.

```bash
firebase functions:shell
# Inside the shell:
forceSweepWatchdog({})
```

#### Option 4 — Firebase Emulator (local testing)
```bash
cd functions
npm run build
firebase emulators:start --only functions
```
Then trigger it via the Emulator UI at `http://localhost:4000`.

### Testing `pingWatchdog`

You can call the HTTPS callable function directly from any Firebase SDK client, or test it via the Firebase Emulator Functions shell:
```bash
pingWatchdog({blindId: 'test-blind-id'})
```

> [!TIP]
> For end-to-end testing, insert a Firestore document with `last_ping` set to a timestamp 30+ days in the past and `status: "active"`, then force-run the sweep.

---

## 🛠️ Troubleshooting

### OpenSSL not recognized (Windows)

The setup script auto-detects OpenSSL in common locations (including Git for Windows). If you need to add it to PATH manually:

1. Search for **"Environment Variables"** in Windows Search.
2. Edit **System variables** > **Path**.
3. Add: `C:\Program Files\OpenSSL-Win64\bin`
4. Restart your terminal.

### Deployment fails

- Ensure you are **logged in**: `firebase login` and `gcloud auth login`
- Ensure the Cloud Functions API is enabled: `gcloud services enable cloudfunctions.googleapis.com --project YOUR_PROJECT_ID`
- Verify your project is on the **Blaze (pay-as-you-go)** plan — Cloud Functions requires it.

---

## ⚖️ License

MIT

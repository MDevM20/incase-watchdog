# Setup Infrastructure for Dead Man's Switch
# This script generates a 2048-bit RSA Private Key and uploads it to Google Secret Manager.
# Prerequisites: 
# 1. OpenSSL installed (standard on Windows 10/11 or via Git Bash).
# 2. Google Cloud CLI (gcloud) installed and authenticated.

# Load environment variables from .env if available
function Load-Env {
    param($path)
    if (Test-Path $path) {
        Write-Host "Loading configuration from: $path" -ForegroundColor Gray
        Get-Content $path | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
            $name, $value = $_.Split('=', 2)
            $name = $name.Trim()
            $value = $value.Trim()
            if ($name -and $value) {
                Set-Variable -Name $name -Value $value -Scope Script
            }
        }
    }
}

# Search for .env in root or functions folder
if (Test-Path ".env") { Load-Env ".env" }
elseif (Test-Path "functions/.env") { Load-Env "functions/.env" }

# Project Configuration (Prioritize .env variables)
$PROJECT_ID = $GCP_PROJECT
if (-not $PROJECT_ID) {
    Write-Host "Error: GCP_PROJECT not found in .env file." -ForegroundColor Red
    $PROJECT_ID = Read-Host "Please enter your Google Cloud Project ID (and consider adding it to .env)"
    if (-not $PROJECT_ID) { exit 1 }
}

Write-Host "--- 0. Checking Firebase Services ---" -ForegroundColor Cyan

# Check Firestore
Write-Host "Checking Firestore Database..." -ForegroundColor Gray
$firestoreExists = gcloud firestore databases list --project $PROJECT_ID --format="value(name)"
if (-not $firestoreExists) {
    Write-Host "Warning: Firestore Database not found in project $PROJECT_ID." -ForegroundColor Yellow
    Write-Host "Please initialize it in the Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
} else {
    Write-Host "Firestore is initialized." -ForegroundColor Green
}

# Reminder for Anonymous Auth
Write-Host "`nReminder: Ensure Anonymous Authentication is enabled." -ForegroundColor Yellow
Write-Host "Check settings here: https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers"

$SECRET_NAME = "WATCHDOG_PRIVATE_KEY"
$RESEND_SECRET_NAME = "RESEND_API_KEY"
$PRIVATE_KEY_FILE = "private_key.pem"
$PUBLIC_KEY_FILE = "public_key.pem"

# Check if openssl is in PATH, if not, check common locations
$opensslCmd = "openssl"

if (-not (Get-Command $opensslCmd -ErrorAction SilentlyContinue)) {
    $commonPaths = @(
        "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
        "C:\Program Files\OpenSSL\bin\openssl.exe",
        "C:\Program Files (x86)\OpenSSL-Win32\bin\openssl.exe",
        "C:\Program Files\Git\usr\bin\openssl.exe"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $opensslCmd = "`"$path`""
            Write-Host "OpenSSL found at: $path" -ForegroundColor Gray
            break
        }
    }
}

# Final check to see if we have a valid command
$checkCmd = if ($opensslCmd.StartsWith('"')) { $opensslCmd.Trim('"') } else { $opensslCmd }
if (-not (Get-Command $checkCmd -ErrorAction SilentlyContinue)) {
    Write-Host "Error: OpenSSL not found." -ForegroundColor Red
    Write-Host "Please install it from https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "Or add the 'bin' folder of your installation to your system PATH."
    exit 1
}

Write-Host "--- 1. Generating RSA Key Pair ---" -ForegroundColor Cyan
$cmdToRun = if ($opensslCmd.StartsWith('"')) { $opensslCmd.Trim('"') } else { $opensslCmd }
& $cmdToRun genrsa -out $PRIVATE_KEY_FILE 2048
& $cmdToRun rsa -in $PRIVATE_KEY_FILE -pubout -out $PUBLIC_KEY_FILE

Write-Host "RSA Private Key: $PRIVATE_KEY_FILE"
Write-Host "RSA Public Key: $PUBLIC_KEY_FILE"
Write-Host "Please keep the Private Key secure and share the Public Key with the client app." -ForegroundColor Yellow

Write-Host "`n--- 2. Uploading Private Key to Google Secret Manager ---" -ForegroundColor Cyan

# Check if secret already exists
$secretExists = gcloud secrets list --filter="name ~ $SECRET_NAME" --format="value(name)" --project $PROJECT_ID

if (-not $secretExists) {
    Write-Host "Creating secret $SECRET_NAME in project $PROJECT_ID..."
    gcloud secrets create $SECRET_NAME --replication-policy="automatic" --project $PROJECT_ID
} else {
    Write-Host "Secret $SECRET_NAME already exists in project $PROJECT_ID. Creating a new version..."
}

# Add the private key as a new version
gcloud secrets versions add $SECRET_NAME --data-file=$PRIVATE_KEY_FILE --project $PROJECT_ID

Write-Host "`n--- 3. Setting up Resend API Key ---" -ForegroundColor Cyan
$resendKey = $RESEND_API_KEY
if (-not $resendKey) {
    $resendKey = Read-Host "Please enter your Resend API Key (leave blank to skip)"
} else {
    Write-Host "Using Resend API Key found in .env" -ForegroundColor Gray
}

if ($resendKey) {
    $resendSecretExists = gcloud secrets list --filter="name ~ $RESEND_SECRET_NAME" --format="value(name)" --project $PROJECT_ID
    if (-not $resendSecretExists) {
        Write-Host "Creating secret $RESEND_SECRET_NAME in project $PROJECT_ID..."
        gcloud secrets create $RESEND_SECRET_NAME --replication-policy="automatic" --project $PROJECT_ID
    }
    
    # Write key to temp file to avoid BOM/UTF-16 character issues in CLI (Cloud Functions require clean UTF-8)
    [System.IO.File]::WriteAllText("$pwd/resend_key.tmp", $resendKey.Trim())
    gcloud secrets versions add $RESEND_SECRET_NAME --data-file="resend_key.tmp" --project $PROJECT_ID
    Remove-Item "resend_key.tmp"
    Write-Host "Resend API Key saved successfully (clean UTF-8)." -ForegroundColor Green
} else {
    Write-Host "Skipping Resend API Key setup." -ForegroundColor Yellow
}

Write-Host "`n--- 4. Granting Secret Access to Cloud Functions ---" -ForegroundColor Cyan
$SERVICE_ACCOUNT = "$PROJECT_ID@appspot.gserviceaccount.com"
Write-Host "Granting 'Secret Manager Secret Accessor' role to $SERVICE_ACCOUNT..."
gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$SERVICE_ACCOUNT" `
    --role="roles/secretmanager.secretAccessor" `
    --condition=None --quiet

Write-Host "`n--- Done! ---" -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "1. Note the File ID and Recipient Email for your watchdog timers."
Write-Host "2. Use the Public Key in the client app to encrypt payloads."
Write-Host "3. You can now deploy your functions: firebase deploy --only functions"

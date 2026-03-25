# Setup Infrastructure for Dead Man's Switch
# This script generates a 2048-bit RSA Private Key and uploads it to Google Secret Manager.
# Prerequisites: 
# 1. OpenSSL installed (standard on Windows 10/11 or via Git Bash).
# 2. Google Cloud CLI (gcloud) installed and authenticated.

$PROJECT_ID = "incase-watchdog" # Update this if your project ID is different
$SECRET_NAME = "WATCHDOG_PRIVATE_KEY"
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

Write-Host "`n--- Done! ---" -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "1. Note the File ID and Recipient Email for your watchdog timers."
Write-Host "2. Use the Public Key in the client app to encrypt payloads."
Write-Host "3. Ensure the Firebase Service Account has the 'Secret Manager Secret Accessor' role."

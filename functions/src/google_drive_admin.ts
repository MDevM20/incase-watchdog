import { google } from "googleapis";

/**
 * Grants reader access to a list of emails for a specific Google Drive file.
 * Uses the Service Account credentials from the environment.
 */
export async function grantGuardianAccess(fileId: string, guardianEmails: string[]) {
  // Authentication: The Cloud Function identity (Service Account) must have 'https://www.googleapis.com/auth/drive' scope.
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  console.log(`Granting access to ${guardianEmails.length} guardians for file ${fileId}`);

  for (const email of guardianEmails) {
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          type: "user",
          role: "reader",
          emailAddress: email,
        },
      });
      console.log(`Successfully granted access to ${email}`);
    } catch (error) {
      console.error(`Failed to grant access to ${email}:`, error);
      // We continue with other guardians even if one fails
    }
  }
}

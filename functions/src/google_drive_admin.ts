import { google } from "googleapis";
import { maskEmail, maskPII } from "./utils";

/**
 * Gets the active Service Account email using the default GoogleAuth discovery.
 */
export async function getServiceAccountEmail(): Promise<string> {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  });
  const credentials = await auth.getCredentials();
  
  // In many environments (Cloud Functions), the client email is in credentials
  if (credentials.client_email) {
    return credentials.client_email;
  }
  
  // Fallback / standard naming for default service accounts
  const projectId = await auth.getProjectId();
  return `${projectId}@appspot.gserviceaccount.com`;
}

/**
 * Verifies if the Service Account has 'writer' or 'owner' access to a file.
 * This is required for JIT strategies to manage permissions.
 * Returns the file name if successful, throws error otherwise.
 */
export async function checkFileAccess(fileId: string): Promise<string> {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });

  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: "name, userPermission, capabilities",
    });

    const role = (response.data as any).userPermission?.role;
    const canShare = response.data.capabilities?.canShare;

    console.log(`[Check] File: ${response.data.name} | Role: ${role} | canShare: ${canShare}`);

    if (role !== "owner" && role !== "writer" && !canShare) {
       throw new Error(`Insufficient permissions. Service account role is '${role}' (canShare: ${canShare}), but 'Editor' (writer) is required to manage JIT grants.`);
    }

    return response.data.name || "Untitled File";
  } catch (error: any) {
    console.error(`Service Account checkFileAccess failed for ${fileId}:`, error.message);
    const saEmail = await getServiceAccountEmail();
    throw new Error(`InCase Service Account cannot manage file ${fileId}. Ensure it is shared with: ${saEmail} as 'Editor'. Original error: ${error.message}`);
  }
}

/**
 * Grants reader access to a list of emails for a specific Google Drive file.
 * Uses the Service Account credentials from the environment.
 */
export async function grantGuardianAccess(fileId: string, guardianEmails: string[]) {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });
  const saEmail = await getServiceAccountEmail();

  console.log(`[JIT] Attempting to grant access to ${guardianEmails.length} guardians for file ${maskPII(fileId)}`);
  console.log(`[JIT] Using Service Account: ${maskEmail(saEmail)}`);

  for (const email of guardianEmails) {
    try {
      await drive.permissions.create({
        fileId: fileId,
        sendNotificationEmail: false, // We send our own rich HTML email
        requestBody: {
          type: "user",
          role: "reader",
          emailAddress: email,
        },
      });
      console.log(`[JIT] Successfully granted access to ${maskEmail(email)}`);
    } catch (error: any) {
      console.error(`[JIT] Failed to grant access to ${maskEmail(email)}:`, error.message);
      if (error.code === 403 || error.code === 404) {
        console.error(`[JIT] CRITICAL: Service Account (${maskEmail(saEmail)}) does not have permission to manage this file. The owner MUST share it as 'Editor'.`);
      }
    }
  }
}

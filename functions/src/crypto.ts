import * as forge from "node-forge";
import * as admin from "firebase-admin";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

/**
 * Retrieves the RSA Private Key from Google Secret Manager.
 */
async function getPrivateKey(): Promise<string> {
  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || admin.app().options.projectId;
  
  if (!projectId) {
    throw new Error("Could not determine GCP_PROJECT ID from environment or admin SDK.");
  }

  const name = `projects/${projectId}/secrets/WATCHDOG_PRIVATE_KEY/versions/latest`;
  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (!payload) {
      throw new Error(`Secret WATCHDOG_PRIVATE_KEY found but payload is empty for project ${projectId}`);
    }
    return payload;
  } catch (error) {
    throw new Error(`Failed to access secret WATCHDOG_PRIVATE_KEY in project ${projectId}: ${error}`);
  }
}

/**
 * Decrypts a base64 encoded payload using the RSA Private Key.
 */
export async function decryptPayload(encryptedBase64: string): Promise<any> {
  try {
    const privateKeyPem = await getPrivateKey();
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    
    const encryptedBytes = forge.util.decode64(encryptedBase64);
    const decrypted = privateKey.decrypt(encryptedBytes, "RSA-OAEP", {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error(`Decryption error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

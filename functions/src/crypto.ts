import * as forge from "node-forge";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

/**
 * Retrieves the RSA Private Key from Google Secret Manager.
 */
async function getPrivateKey(): Promise<string> {
  const name = `projects/${process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT}/secrets/WATCHDOG_PRIVATE_KEY/versions/latest`;
  const [version] = await client.accessSecretVersion({ name });
  const payload = version.payload?.data?.toString();
  if (!payload) {
    throw new Error("Failed to retrieve secret WATCHDOG_PRIVATE_KEY");
  }
  return payload;
}

/**
 * Decrypts a base64 encoded payload using the RSA Private Key.
 */
export async function decryptPayload(encryptedBase64: string): Promise<any> {
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
}

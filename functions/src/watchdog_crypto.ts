import * as crypto from "crypto";

/**
 * Retrieves the RSA Private Key from Environment (populated by Secret Manager).
 */
async function getPrivateKey(): Promise<string> {
  const privateKey = process.env.WATCHDOG_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("WATCHDOG_PRIVATE_KEY environment variable is missing. Ensure it is listed in runWith({ secrets: [...] }).");
  }
  return privateKey;
}

/**
 * Decrypts a base64 encoded hybrid payload.
 * Expected format: base64(encKey):base64(iv):base64(authTag):base64(ciphertext)
 */
export async function decryptPayload(hybridPayload: string): Promise<any> {
  try {
    const parts = hybridPayload.split(":");
    if (parts.length !== 4) {
      // Compatibility fallback (this is "rip and replace" though, but logs would be useful)
      throw new Error(`Invalid hybrid payload format. Expected 4 parts, got ${parts.length}.`);
    }

    const [encKeyBase64, ivBase64, authTagBase64, ciphertextBase64] = parts;
    const privateKeyPem = await getPrivateKey();

    // 1. Decrypt AES Key with RSA-OAEP (SHA-256)
    const encryptedKey = Buffer.from(encKeyBase64, "base64");
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedKey
    );

    // 2. Decrypt Payload with AES-256-GCM
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const ciphertext = Buffer.from(ciphertextBase64, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
    decipher.setAuthTag(authTag);

    // Update with decryption
    let decrypted = decipher.update(ciphertext, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Hybrid decryption failed:", error);
    throw new Error(`Decryption error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

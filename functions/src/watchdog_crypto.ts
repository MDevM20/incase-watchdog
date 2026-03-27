import * as forge from "node-forge";

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

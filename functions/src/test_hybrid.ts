import * as crypto from "crypto";
import * as fs from "fs";
import { decryptPayload } from "./watchdog_crypto";

// Mock environment
process.env.WATCHDOG_PRIVATE_KEY = fs.readFileSync("../private_key.pem", "utf8");

async function test() {
  const testPayload = {
    message: "This is a secret message that is definitely longer than what RSA can handle directly if we repeat it. " + "A".repeat(200),
    timestamp: Date.now()
  };
  const payloadStr = JSON.stringify(testPayload);

  // Simulation of Dart Encryption:
  // 1. Generate AES Key and IV
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  // 2. AES-GCM Encrypt
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  let ciphertext = cipher.update(payloadStr, "utf8", "base64");
  ciphertext += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  // 3. Encrypt AES Key with RSA-OAEP
  const publicKeyPem = fs.readFileSync("../public_key.pem", "utf8");
  const encryptedKey = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey
  ).toString("base64");

  // 4. Format Hybrid Payload
  const hybridPayload = `${encryptedKey}:${iv.toString("base64")}:${authTag}:${ciphertext}`;

  console.log("Generated Hybrid Payload (Truncated):", hybridPayload.substring(0, 50) + "...");

  try {
    const decrypted = await decryptPayload(hybridPayload);
    console.log("Decrypted Payload Message Length:", decrypted.message.length);
    if (decrypted.message === testPayload.message) {
      console.log("✅ SUCCESS: Decryption matches original!");
    } else {
      console.error("❌ FAILURE: Decryption mismatch.");
    }
  } catch (error) {
    console.error("❌ Decryption failed with error:", error);
  }
}

test();

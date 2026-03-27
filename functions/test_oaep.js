const forge = require('node-forge');
const fs = require('fs');

const privateKeyPem = fs.readFileSync('../private_key.pem', 'utf8');
const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

// The base64 output from the Dart test script
const encryptedBase64 = process.argv[2];

if (!encryptedBase64) {
  console.error("Please provide base64 encrypted string as argument.");
  process.exit(1);
}

try {
  const encryptedBytes = forge.util.decode64(encryptedBase64);
  const decrypted = privateKey.decrypt(encryptedBytes, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: {
      md: forge.md.sha256.create(),
    },
  });
  console.log("Decrypted successfully!");
  console.log("Message:", decrypted);
} catch (error) {
  console.error("Decryption failed:", error.message);
}
